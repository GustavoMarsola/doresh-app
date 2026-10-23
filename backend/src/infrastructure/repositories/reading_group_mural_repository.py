from datetime import datetime
from uuid import UUID
from fastapi import Depends
from sqlalchemy import select, delete, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.repositories import get_session_repo
from src.infrastructure.database.models.reading_groups_models import ReadingGroupModel
from src.infrastructure.database.models.reading_group_mural_models import (
    ReadingGroupShareModel,
    ReadingGroupShareReplyModel,
    ReadingGroupShareReportModel,
)
from src.infrastructure.database.models.users_models import UsersModel


class ReadingGroupMuralRepository:
    """Shared annotations of a group. Callers check membership first; queries are scoped by group."""

    def __init__(self, db_session: AsyncSession = Depends(get_session_repo)) -> None:
        self.db_session = db_session

    # ── Shares ──

    async def create_share(self, data: dict) -> ReadingGroupShareModel:
        share = ReadingGroupShareModel(**data)
        self.db_session.add(share)
        await self.db_session.commit()
        await self.db_session.refresh(share)
        return share

    async def get_share(self, group_id: UUID, share_id: UUID) -> ReadingGroupShareModel | None:
        stmt = select(ReadingGroupShareModel).where(
            ReadingGroupShareModel.group_id == group_id, ReadingGroupShareModel.id == share_id
        )
        result = await self.db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def find_share(self, group_id: UUID, user_id: UUID, kind: str, comment_id: UUID | None,
                         book: str, chapter: int, verse_start: int, verse_end: int) -> ReadingGroupShareModel | None:
        """The same annotation already shared in this group by this member, if any."""
        if comment_id is not None:
            where = [ReadingGroupShareModel.comment_id == comment_id]
        else:
            where = [
                ReadingGroupShareModel.kind == kind,
                ReadingGroupShareModel.book == book,
                ReadingGroupShareModel.chapter == chapter,
                ReadingGroupShareModel.verse_start == verse_start,
                ReadingGroupShareModel.verse_end == verse_end,
            ]
        stmt = select(ReadingGroupShareModel).where(
            ReadingGroupShareModel.group_id == group_id, ReadingGroupShareModel.user_id == user_id, *where
        )
        result = await self.db_session.execute(stmt)
        return result.scalars().first()

    async def shares_in_chapters(self, group_id: UUID, chapters: set[tuple[str, int]]) -> list[tuple[ReadingGroupShareModel, str]]:
        """Shares of the group pinned to any of the (book slug, chapter) pairs, with the author's name; oldest first."""
        if not chapters:
            return []
        stmt = (
            select(ReadingGroupShareModel, UsersModel.username)
            .join(UsersModel, UsersModel.id == ReadingGroupShareModel.user_id)
            .where(
                ReadingGroupShareModel.group_id == group_id,
                or_(*[
                    (ReadingGroupShareModel.book == book) & (ReadingGroupShareModel.chapter == chapter)
                    for book, chapter in chapters
                ]),
            )
            .order_by(ReadingGroupShareModel.chapter, ReadingGroupShareModel.verse_start, ReadingGroupShareModel.created_at)
        )
        result = await self.db_session.execute(stmt)
        return [(share, username) for share, username in result.all()]

    async def shares_by_user(self, user_id: UUID) -> list[tuple[ReadingGroupShareModel, str]]:
        """Everything the user shared, with the group's name (for the reader to show where a note went)."""
        stmt = (
            select(ReadingGroupShareModel, ReadingGroupModel.name)
            .join(ReadingGroupModel, ReadingGroupModel.id == ReadingGroupShareModel.group_id)
            .where(ReadingGroupShareModel.user_id == user_id)
            .order_by(ReadingGroupShareModel.created_at.desc())
        )
        result = await self.db_session.execute(stmt)
        return [(share, name) for share, name in result.all()]

    async def save(self, instance, changes: dict):
        for field, value in changes.items():
            setattr(instance, field, value)
        await self.db_session.commit()
        await self.db_session.refresh(instance)
        return instance

    async def delete_share(self, share: ReadingGroupShareModel) -> None:
        await self.db_session.execute(delete(ReadingGroupShareModel).where(ReadingGroupShareModel.id == share.id))
        await self.db_session.commit()

    # ── Replies and reports ──

    async def replies_for(self, share_ids: list[UUID]) -> list[tuple[ReadingGroupShareReplyModel, str]]:
        if not share_ids:
            return []
        stmt = (
            select(ReadingGroupShareReplyModel, UsersModel.username)
            .join(UsersModel, UsersModel.id == ReadingGroupShareReplyModel.user_id)
            .where(ReadingGroupShareReplyModel.share_id.in_(share_ids))
            .order_by(ReadingGroupShareReplyModel.created_at)
        )
        result = await self.db_session.execute(stmt)
        return [(reply, username) for reply, username in result.all()]

    async def add_reply(self, share_id: UUID, user_id: UUID, text: str) -> ReadingGroupShareReplyModel:
        reply = ReadingGroupShareReplyModel(share_id=share_id, user_id=user_id, text=text)
        self.db_session.add(reply)
        await self.db_session.commit()
        await self.db_session.refresh(reply)
        return reply

    async def get_reply(self, share_id: UUID, reply_id: UUID) -> ReadingGroupShareReplyModel | None:
        stmt = select(ReadingGroupShareReplyModel).where(
            ReadingGroupShareReplyModel.share_id == share_id, ReadingGroupShareReplyModel.id == reply_id
        )
        result = await self.db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def delete_reply(self, reply: ReadingGroupShareReplyModel) -> None:
        await self.db_session.delete(reply)
        await self.db_session.commit()

    async def reports_for(self, share_ids: list[UUID]) -> dict[UUID, list[UUID]]:
        """share id → ids of the members who reported it."""
        if not share_ids:
            return {}
        stmt = select(ReadingGroupShareReportModel.share_id, ReadingGroupShareReportModel.user_id).where(
            ReadingGroupShareReportModel.share_id.in_(share_ids)
        )
        result = await self.db_session.execute(stmt)
        reports: dict[UUID, list[UUID]] = {}
        for share_id, user_id in result.all():
            reports.setdefault(share_id, []).append(user_id)
        return reports

    async def add_report(self, share_id: UUID, user_id: UUID) -> None:
        exists = await self.db_session.scalar(
            select(func.count()).select_from(ReadingGroupShareReportModel).where(
                ReadingGroupShareReportModel.share_id == share_id, ReadingGroupShareReportModel.user_id == user_id
            )
        )
        if not exists:
            self.db_session.add(ReadingGroupShareReportModel(share_id=share_id, user_id=user_id))
            await self.db_session.commit()

    # ── Clean-up (membership ends, group ends, comment deleted) ──

    async def delete_member_activity(self, group_id: UUID, user_id: UUID) -> None:
        """Everything a member put on the group's mural: shares (with their replies), replies and reports."""
        group_shares = select(ReadingGroupShareModel.id).where(ReadingGroupShareModel.group_id == group_id)
        await self.db_session.execute(delete(ReadingGroupShareReplyModel).where(
            ReadingGroupShareReplyModel.user_id == user_id, ReadingGroupShareReplyModel.share_id.in_(group_shares)
        ))
        await self.db_session.execute(delete(ReadingGroupShareReportModel).where(
            ReadingGroupShareReportModel.user_id == user_id, ReadingGroupShareReportModel.share_id.in_(group_shares)
        ))
        await self.db_session.execute(delete(ReadingGroupShareModel).where(
            ReadingGroupShareModel.group_id == group_id, ReadingGroupShareModel.user_id == user_id
        ))
        await self.db_session.commit()

    async def delete_group_activity(self, group_id: UUID) -> None:
        await self.db_session.execute(delete(ReadingGroupShareModel).where(ReadingGroupShareModel.group_id == group_id))
        await self.db_session.commit()
