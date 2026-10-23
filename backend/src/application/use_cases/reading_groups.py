"""
Reading groups: a leader shares one of their plans with people invited by link. Every member
keeps their own progress; the group shows the aggregate ("8 of 12 read day 5") and names only
those who chose to be named. Joining records explicit consent (religious conviction is LGPD
sensitive data) and leaving erases the participation.
"""
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID
from fastapi import HTTPException, status
from src.application.use_cases.reading_plans import _day_out, _weekdays
from src.application.use_cases.studies import study_to_dict
from src.common.reading_plans import PlanDay, PlanError, build_schedule, day_status, get_plan, mark_read, mark_unread
from src.common.utilities import set_local_time
from src.infrastructure.database.models.reading_groups_models import (
    ReadingGroupModel,
    ReadingGroupMemberModel,
    ReadingGroupNoteModel,
)
from src.infrastructure.repositories.app_repository import AppRepository
from src.infrastructure.repositories.reading_groups_repository import LEADER
from src.infrastructure.repositories.redis_repository import RedisRepository
from src.schemas.reading_groups_schemas import (
    GroupDayOut,
    GroupDetail,
    GroupInviteOut,
    GroupMemberOut,
    GroupNoteOut,
    GroupResponse,
    GroupStudyResponse,
    GroupSummary,
    GroupsResponse,
    InvitePreview,
    PatchMembershipSchema,
    PatchReadingGroupSchema,
    PostInviteSchema,
    PostJoinSchema,
    PostReadingGroupSchema,
    PutNoteSchema,
)

# Bump when the consent text shown in the app changes; stored with every membership.
CONSENT_VERSION = "2026-10-23"

Membership = tuple[ReadingGroupModel, ReadingGroupMemberModel]


def _user_id(payload_token: dict) -> UUID:
    return UUID(payload_token["sub"])


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def _error(code: str, status_code: int = status.HTTP_422_UNPROCESSABLE_ENTITY) -> HTTPException:
    return HTTPException(status_code=status_code, detail=code)


def _not_found() -> HTTPException:
    return _error("reading_group.not_found", status.HTTP_404_NOT_FOUND)


def _schedule(group: ReadingGroupModel) -> list[PlanDay]:
    return build_schedule(
        get_plan(group.plan_slug), group.book, group.start_date, group.total_days, _weekdays(group.weekdays), group.books
    )


def _title(group: ReadingGroupModel) -> str:
    return group.title or (f"Leitura de {group.book}" if group.book else get_plan(group.plan_slug).title)


def _days_read(read: dict, days: list[PlanDay]) -> int:
    return sum(day_status(read, day) == "read" for day in days)


def _invite_active(group: ReadingGroupModel, now: datetime) -> bool:
    return bool(group.invite_token) and group.invite_expires_at is not None and group.invite_expires_at > now


class ReadingGroupsUseCase:
    def __init__(self, repository: AppRepository, redis_repository: RedisRepository) -> None:
        self.repository       = repository
        self.redis_repository = redis_repository
        self.groups           = repository.reading_groups

    # ── Access ──

    async def _membership(self, user_id: UUID, group_id: UUID, for_update: bool = False) -> Membership:
        found = await self.groups.get_for_member(user_id, group_id, for_update=for_update)
        if not found:
            if for_update:
                await self.groups.rollback()
            raise _not_found()
        return found

    async def _as_leader(self, user_id: UUID, group_id: UUID, for_update: bool = False) -> Membership:
        group, membership = await self._membership(user_id, group_id, for_update=for_update)
        if membership.role != LEADER:
            if for_update:
                await self.groups.rollback()
            raise _error("reading_group.leader_only", status.HTTP_403_FORBIDDEN)
        return group, membership

    # ── Groups ──

    async def list_groups(self, payload_token: dict) -> GroupsResponse:
        user_id = _user_id(payload_token)
        groups  = []
        for group, membership in await self.groups.list_for_user(user_id):
            days = _schedule(group)
            groups.append(GroupSummary(**self._summary_fields(group, membership, days, await self.groups.members_count(group.id))))
        return GroupsResponse(groups=groups)

    async def get_group(self, payload_token: dict, group_id: UUID) -> GroupResponse:
        group, membership = await self._membership(_user_id(payload_token), group_id)
        return await self._detail(group, membership)

    async def create_group(self, payload_token: dict, data: PostReadingGroupSchema) -> GroupResponse:
        user_id = _user_id(payload_token)
        if not data.consent:
            raise _error("reading_group.consent_required")
        plan = await self.repository.reading_plans.get(user_id, data.plan_id)
        if not plan:
            raise _error("reading_group.plan_not_found")
        fields = {
            "name":            data.name.strip(),
            "plan_slug":       plan.plan_slug,
            "book":            plan.book,
            "books":           plan.books,
            "title":           plan.title,
            "start_date":      data.start_date or plan.start_date,
            "total_days":      plan.total_days,
            "weekdays":        plan.weekdays,
            "meeting_weekday": data.meeting_weekday,
        }
        group, membership = await self.groups.create(user_id, fields, data.show_name, CONSENT_VERSION, set_local_time())
        return await self._detail(group, membership)

    async def update_group(self, payload_token: dict, group_id: UUID, data: PatchReadingGroupSchema) -> GroupResponse:
        group, membership = await self._as_leader(_user_id(payload_token), group_id, for_update=True)
        changes: dict = {}
        if data.name is not None:
            changes["name"] = data.name.strip()
        if data.start_date is not None:
            changes["start_date"] = data.start_date
        if data.total_days is not None:
            changes["total_days"] = data.total_days
        if data.weekdays is not None:
            changes["weekdays"] = "".join(map(str, _weekdays(data.weekdays)))
        if "meeting_weekday" in data.model_fields_set:
            changes["meeting_weekday"] = data.meeting_weekday
        try:
            build_schedule(
                get_plan(group.plan_slug), group.book,
                changes.get("start_date", group.start_date), changes.get("total_days", group.total_days),
                _weekdays(changes.get("weekdays", group.weekdays)), group.books,
            )
        except PlanError as error:
            await self.groups.rollback()
            raise _error(error.code)
        group = await self.groups.save(group, changes)
        return await self._detail(group, membership)

    async def delete_group(self, payload_token: dict, group_id: UUID) -> None:
        group, _ = await self._as_leader(_user_id(payload_token), group_id)
        await self.groups.delete_group(group.id)

    # ── Invites ──

    async def create_invite(self, payload_token: dict, group_id: UUID, data: PostInviteSchema) -> GroupResponse:
        group, membership = await self._as_leader(_user_id(payload_token), group_id)
        group = await self.groups.save(group, {
            "invite_token":      secrets.token_urlsafe(24),
            "invite_expires_at": set_local_time() + timedelta(days=data.days),
        })
        return await self._detail(group, membership)

    async def revoke_invite(self, payload_token: dict, group_id: UUID) -> GroupResponse:
        group, membership = await self._as_leader(_user_id(payload_token), group_id)
        group = await self.groups.save(group, {"invite_token": None, "invite_expires_at": None})
        return await self._detail(group, membership)

    async def _group_by_invite(self, token: str) -> ReadingGroupModel:
        group = await self.groups.get_by_invite_token(token)
        if not group:
            raise _error("reading_group.invite_invalid", status.HTTP_404_NOT_FOUND)
        if not _invite_active(group, set_local_time()):
            raise _error("reading_group.invite_expired", status.HTTP_410_GONE)
        return group

    async def preview_invite(self, payload_token: dict, token: str) -> InvitePreview:
        user_id = _user_id(payload_token)
        group   = await self._group_by_invite(token)
        leader  = await self.repository.users.get_user_by_id(group.leader_id)
        days    = _schedule(group)
        return InvitePreview(
            group_id=group.id,
            name=group.name,
            title=_title(group),
            leader_name=leader.username if leader else "",
            members_count=await self.groups.members_count(group.id),
            start_date=group.start_date,
            end_date=days[-1].date,
            reading_days=len(days),
            already_member=await self.groups.membership(group.id, user_id) is not None,
            next_passages=_day_out(days[0], {}).passages,
        )

    async def join(self, payload_token: dict, token: str, data: PostJoinSchema) -> GroupResponse:
        user_id = _user_id(payload_token)
        group   = await self._group_by_invite(token)
        membership = await self.groups.membership(group.id, user_id)
        if membership is None:
            if not data.consent:
                raise _error("reading_group.consent_required")
            membership = await self.groups.add_member(group.id, user_id, data.show_name, CONSENT_VERSION, set_local_time())
        return await self._detail(group, membership)

    # ── Members ──

    async def leave(self, payload_token: dict, group_id: UUID) -> None:
        _, membership = await self._membership(_user_id(payload_token), group_id)
        if membership.role == LEADER:
            raise _error("reading_group.leader_cannot_leave")
        # Leaving erases the participation: progress, and what they shared or wrote on the mural
        await self.repository.group_mural.delete_member_activity(group_id, membership.user_id)
        await self.groups.remove_member(membership)

    async def remove_member(self, payload_token: dict, group_id: UUID, member_id: UUID) -> GroupResponse:
        group, membership = await self._as_leader(_user_id(payload_token), group_id)
        target = await self.groups.member_by_id(group.id, member_id)
        if not target:
            raise _error("reading_group.member_not_found", status.HTTP_404_NOT_FOUND)
        if target.role == LEADER:
            raise _error("reading_group.cannot_remove_leader")
        await self.repository.group_mural.delete_member_activity(group.id, target.user_id)
        await self.groups.remove_member(target)
        return await self._detail(group, membership)

    async def update_membership(self, payload_token: dict, group_id: UUID, data: PatchMembershipSchema) -> GroupResponse:
        group, membership = await self._membership(_user_id(payload_token), group_id)
        membership = await self.groups.save(membership, {"show_name": data.show_name})
        return await self._detail(group, membership)

    # ── Days ──

    def _day(self, group: ReadingGroupModel, day_index: int) -> tuple[list[PlanDay], PlanDay]:
        days = _schedule(group)
        if not 1 <= day_index <= len(days):
            raise _error("reading_group.day_not_found", status.HTTP_404_NOT_FOUND)
        return days, days[day_index - 1]

    async def set_day_read(self, payload_token: dict, group_id: UUID, day_index: int, read: bool) -> GroupResponse:
        group, membership = await self._membership(_user_id(payload_token), group_id, for_update=True)
        try:
            _, day = self._day(group, day_index)
        except HTTPException:
            await self.groups.rollback()
            raise
        update     = mark_read if read else mark_unread
        membership = await self.groups.save(membership, {"read_ranges": update(membership.read_ranges or {}, day.passages)})
        return await self._detail(group, membership)

    async def put_note(self, payload_token: dict, group_id: UUID, day_index: int, data: PutNoteSchema) -> GroupResponse:
        user_id = _user_id(payload_token)
        group, membership = await self._as_leader(user_id, group_id)
        self._day(group, day_index)
        if data.study_id is not None and not await self.repository.studies.get_user_study(user_id, data.study_id):
            raise _error("reading_group.study_not_found")
        await self.groups.upsert_note(group.id, user_id, day_index, data.text.strip(), data.study_id)
        return await self._detail(group, membership)

    async def delete_note(self, payload_token: dict, group_id: UUID, day_index: int) -> GroupResponse:
        group, membership = await self._as_leader(_user_id(payload_token), group_id)
        await self.groups.delete_note(group.id, day_index)
        return await self._detail(group, membership)

    async def get_day_study(self, payload_token: dict, group_id: UUID, day_index: int) -> GroupStudyResponse:
        """The study the leader attached to a day, readable by every member."""
        group, _ = await self._membership(_user_id(payload_token), group_id)
        note  = await self.groups.note(group.id, day_index)
        study = await self.repository.studies.get_active_study(note.study_id) if note and note.study_id else None
        if not study:
            raise _error("reading_group.study_not_found", status.HTTP_404_NOT_FOUND)
        return GroupStudyResponse(study=study_to_dict(study))

    # ── Output ──

    @staticmethod
    def _summary_fields(
        group: ReadingGroupModel, membership: ReadingGroupMemberModel, days: list[PlanDay], members_count: int
    ) -> dict:
        read     = membership.read_ranges or {}
        statuses = [day_status(read, day) for day in days]
        next_day = next((day for day, s in zip(days, statuses) if s != "read"), None)
        return {
            "id":            group.id,
            "name":          group.name,
            "title":         _title(group),
            "role":          membership.role,
            "members_count": members_count,
            "start_date":    group.start_date,
            "end_date":      days[-1].date,
            "reading_days":  len(days),
            "days_read":     statuses.count("read"),
            "next_day":      _day_out(next_day, read) if next_day else None,
            "completed":     next_day is None,
            "created_at":    _utc(group.created_at),
            "updated_at":    _utc(group.updated_at),
        }

    async def _detail(self, group: ReadingGroupModel, membership: ReadingGroupMemberModel) -> GroupResponse:
        days    = _schedule(group)
        members = await self.groups.members(group.id)
        notes   = {note.day_index: note for note in await self.groups.notes(group.id)}
        titles  = await self.repository.studies.get_active_titles([n.study_id for n in notes.values() if n.study_id])
        now     = set_local_time()

        members_out, readers = [], [0] * len(days)
        for member, username in members:
            read = member.read_ranges or {}
            statuses = [day_status(read, day) for day in days]
            for i, s in enumerate(statuses):
                readers[i] += s == "read"
            members_out.append(GroupMemberOut(
                id=member.id,
                name=username if member.show_name else None,
                role=member.role,
                days_read=statuses.count("read"),
                is_me=member.id == membership.id,
            ))

        mine = membership.read_ranges or {}
        days_out = [
            GroupDayOut(
                **_day_out(day, mine).model_dump(),
                readers=readers[i],
                is_meeting=group.meeting_weekday is not None and day.date.isoweekday() == group.meeting_weekday,
                note=self._note_out(notes.get(day.index), titles),
            )
            for i, day in enumerate(days)
        ]
        invite = (
            GroupInviteOut(token=group.invite_token, expires_at=_utc(group.invite_expires_at))
            if membership.role == LEADER and _invite_active(group, now) else None
        )
        return GroupResponse(group=GroupDetail(
            **self._summary_fields(group, membership, days, len(members)),
            plan_slug=group.plan_slug,
            book=group.book,
            books=group.books,
            total_days=group.total_days,
            weekdays=list(_weekdays(group.weekdays)),
            meeting_weekday=group.meeting_weekday,
            show_name=membership.show_name,
            invite=invite,
            members=members_out,
            days=days_out,
        ))

    @staticmethod
    def _note_out(note: ReadingGroupNoteModel | None, titles: dict[UUID, str]) -> GroupNoteOut | None:
        if note is None:
            return None
        return GroupNoteOut(
            text=note.text,
            study_id=note.study_id,
            study_title=titles.get(note.study_id) if note.study_id else None,
            updated_at=_utc(note.updated_at),
        )
