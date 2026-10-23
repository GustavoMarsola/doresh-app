"""
Mural da passagem: annotations a member chose to share with their group, pinned to the verses
and shown inside the day of the group's plan. The member's own notes stay private; a share is a
copy that disappears when unshared, when the member leaves, or when the comment is deleted.
Replies, hiding (leader) and reporting (any member) keep the mural safe.
"""
from uuid import UUID
from fastapi import status
from src.application.use_cases.reading_groups import ReadingGroupsUseCase, _error, _user_id, _utc
from src.common.bible.helpers import bible_book_slug, is_valid_bible_reference
from src.common.utilities import set_local_time
from src.infrastructure.database.models.reading_groups_models import ReadingGroupModel, ReadingGroupMemberModel
from src.infrastructure.database.models.reading_group_mural_models import ReadingGroupShareModel
from src.infrastructure.repositories.reading_groups_repository import LEADER
from src.schemas.reading_groups_schemas import (
    MuralResponse,
    MySharesResponse,
    MyShareOut,
    PostReplySchema,
    PostShareSchema,
    ShareAuthorOut,
    ShareOut,
    ShareReplyOut,
    ShareResponse,
)


class ReadingGroupMuralUseCase(ReadingGroupsUseCase):
    @property
    def mural(self):
        return self.repository.group_mural

    # ── Sharing ──

    async def share(self, payload_token: dict, group_id: UUID, data: PostShareSchema) -> tuple[ShareResponse, bool]:
        """Returns the share and whether it was created now (False: the same annotation was already shared)."""
        user_id = _user_id(payload_token)
        group, membership = await self._membership(user_id, group_id)
        fields = await self._share_fields(user_id, data)
        existing = await self.mural.find_share(
            group.id, user_id, fields["kind"], fields["comment_id"],
            fields["book"], fields["chapter"], fields["verse_start"], fields["verse_end"],
        )
        if existing:
            return await self._share_response(group, membership, existing), False
        share = await self.mural.create_share({"group_id": group.id, "user_id": user_id, **fields})
        return await self._share_response(group, membership, share), True

    async def _share_fields(self, user_id: UUID, data: PostShareSchema) -> dict:
        if data.kind == "comment":
            comment = await self.repository.bible.get_comment(user_id, data.comment_id) if data.comment_id else None
            if comment is None:
                raise _error("reading_group.annotation_not_found")
            return {
                "kind": "comment", "comment_id": comment.id, "book": comment.book, "chapter": comment.chapter,
                "verse_start": comment.verse_start, "verse_end": comment.verse_end, "text": comment.comment, "color": None,
            }
        if not (data.book and data.chapter and data.verse_start):
            raise _error("reading_group.annotation_not_found")
        verse_end = data.verse_end or data.verse_start
        slug = bible_book_slug(data.book)
        if verse_end < data.verse_start or not is_valid_bible_reference(slug, data.chapter, [data.verse_start, verse_end]):
            raise _error("reading_group.annotation_not_found")
        highlighted = {h.verse: h.color for h in await self.repository.bible.get_chapter_highlights(user_id, slug, data.chapter)}
        verses = range(data.verse_start, verse_end + 1)
        if any(v not in highlighted for v in verses):
            raise _error("reading_group.annotation_not_found")
        return {
            "kind": "highlight", "comment_id": None, "book": slug, "chapter": data.chapter,
            "verse_start": data.verse_start, "verse_end": verse_end, "text": None, "color": highlighted[data.verse_start],
        }

    async def unshare(self, payload_token: dict, group_id: UUID, share_id: UUID) -> None:
        user_id = _user_id(payload_token)
        group, _ = await self._membership(user_id, group_id)
        share = await self.mural.get_share(group.id, share_id)
        if share is None or share.user_id != user_id:
            raise _error("reading_group.share_not_found", status.HTTP_404_NOT_FOUND)
        await self.mural.delete_share(share)

    async def my_shares(self, payload_token: dict) -> MySharesResponse:
        rows = await self.mural.shares_by_user(_user_id(payload_token))
        return MySharesResponse(shares=[
            MyShareOut(
                id=s.id, group_id=s.group_id, group_name=name, kind=s.kind, comment_id=s.comment_id,
                book=s.book, chapter=s.chapter, verse_start=s.verse_start, verse_end=s.verse_end,
            )
            for s, name in rows
        ])

    # ── Reading the mural ──

    async def day_mural(self, payload_token: dict, group_id: UUID, day_index: int) -> MuralResponse:
        """Shares pinned to the verses of day `n`; hidden ones only for the leader."""
        group, membership = await self._membership(_user_id(payload_token), group_id)
        _, day = self._day(group, day_index)
        chapters = {(p.slug, p.chapter) for p in day.passages}
        rows = await self.mural.shares_in_chapters(group.id, chapters)
        shares = [
            (share, username) for share, username in rows
            if any(
                p.slug == share.book and p.chapter == share.chapter
                and share.verse_start <= p.verse_end and share.verse_end >= p.verse_start
                for p in day.passages
            )
        ]
        return MuralResponse(shares=await self._shares_out(group, membership, shares))

    # ── Replies, hiding, reporting ──

    async def _share_in(self, user_id: UUID, group_id: UUID, share_id: UUID, leader: bool = False):
        group, membership = (await self._as_leader(user_id, group_id)) if leader else (await self._membership(user_id, group_id))
        share = await self.mural.get_share(group.id, share_id)
        if share is None or (share.hidden_at is not None and membership.role != LEADER):
            raise _error("reading_group.share_not_found", status.HTTP_404_NOT_FOUND)
        return group, membership, share

    async def reply(self, payload_token: dict, group_id: UUID, share_id: UUID, data: PostReplySchema) -> ShareResponse:
        user_id = _user_id(payload_token)
        group, membership, share = await self._share_in(user_id, group_id, share_id)
        await self.mural.add_reply(share.id, user_id, data.text.strip())
        return await self._share_response(group, membership, share)

    async def delete_reply(self, payload_token: dict, group_id: UUID, share_id: UUID, reply_id: UUID) -> ShareResponse:
        """The author removes their reply; the leader can remove any."""
        user_id = _user_id(payload_token)
        group, membership, share = await self._share_in(user_id, group_id, share_id)
        reply = await self.mural.get_reply(share.id, reply_id)
        if reply is None:
            raise _error("reading_group.reply_not_found", status.HTTP_404_NOT_FOUND)
        if reply.user_id != user_id and membership.role != LEADER:
            raise _error("reading_group.leader_only", status.HTTP_403_FORBIDDEN)
        await self.mural.delete_reply(reply)
        return await self._share_response(group, membership, share)

    async def set_hidden(self, payload_token: dict, group_id: UUID, share_id: UUID, hidden: bool) -> ShareResponse:
        group, membership, share = await self._share_in(_user_id(payload_token), group_id, share_id, leader=True)
        share = await self.mural.save(share, {"hidden_at": set_local_time() if hidden else None})
        return await self._share_response(group, membership, share)

    async def report(self, payload_token: dict, group_id: UUID, share_id: UUID) -> ShareResponse:
        user_id = _user_id(payload_token)
        group, membership, share = await self._share_in(user_id, group_id, share_id)
        await self.mural.add_report(share.id, user_id)
        return await self._share_response(group, membership, share)

    # ── Output ──

    async def _share_response(self, group: ReadingGroupModel, membership: ReadingGroupMemberModel, share: ReadingGroupShareModel) -> ShareResponse:
        username = next((u for m, u in await self.groups.members(group.id) if m.user_id == share.user_id), "")
        shares = await self._shares_out(group, membership, [(share, username)])
        return ShareResponse(share=shares[0])

    async def _shares_out(
        self, group: ReadingGroupModel, viewer: ReadingGroupMemberModel, rows: list[tuple[ReadingGroupShareModel, str]]
    ) -> list[ShareOut]:
        is_leader = viewer.role == LEADER
        visible   = [(s, u) for s, u in rows if is_leader or s.hidden_at is None]
        members   = {m.user_id: m for m, _ in await self.groups.members(group.id)}
        ids       = [s.id for s, _ in visible]
        replies   = await self.mural.replies_for(ids)
        reports   = await self.mural.reports_for(ids)

        def author(user_id: UUID, username: str) -> ShareAuthorOut:
            member = members.get(user_id)
            return ShareAuthorOut(
                name=username if member and member.show_name else None,
                role=member.role if member else "member",
                is_me=user_id == viewer.user_id,
            )

        by_share: dict[UUID, list[ShareReplyOut]] = {}
        for reply, username in replies:
            by_share.setdefault(reply.share_id, []).append(
                ShareReplyOut(id=reply.id, author=author(reply.user_id, username), text=reply.text, created_at=_utc(reply.created_at))
            )
        return [
            ShareOut(
                id=s.id,
                kind=s.kind,
                author=author(s.user_id, username),
                book=s.book,
                chapter=s.chapter,
                verse_start=s.verse_start,
                verse_end=s.verse_end,
                text=s.text,
                color=s.color,
                hidden=s.hidden_at is not None,
                reports=len(reports.get(s.id, [])) if is_leader else 0,
                reported_by_me=viewer.user_id in reports.get(s.id, []),
                replies=by_share.get(s.id, []),
                created_at=_utc(s.created_at),
            )
            for s, username in visible
        ]
