from datetime import datetime
from uuid import UUID
from fastapi import Depends
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.repositories import get_session_repo
from src.infrastructure.database.models.reading_groups_models import (
    ReadingGroupModel,
    ReadingGroupMemberModel,
    ReadingGroupNoteModel,
)
from src.infrastructure.database.models.users_models import UsersModel

LEADER = "leader"
MEMBER = "member"


class ReadingGroupsRepository:
    """
    Groups are reached through the caller's membership: `get_for_member` is the only way to load
    a group for reading or writing, so someone outside the group sees it as if it didn't exist.
    """

    def __init__(self, db_session: AsyncSession = Depends(get_session_repo)) -> None:
        self.db_session = db_session

    # ── Groups ──

    async def create(
        self, leader_id: UUID, data: dict, show_name: bool, consent_version: str, now: datetime
    ) -> tuple[ReadingGroupModel, ReadingGroupMemberModel]:
        group = ReadingGroupModel(leader_id=leader_id, **data)
        self.db_session.add(group)
        await self.db_session.flush()
        membership = ReadingGroupMemberModel(
            group_id=group.id, user_id=leader_id, role=LEADER, show_name=show_name,
            consent_version=consent_version, consent_at=now, read_ranges={},
        )
        self.db_session.add(membership)
        await self.db_session.commit()
        await self.db_session.refresh(group)
        await self.db_session.refresh(membership)
        return group, membership

    async def list_for_user(self, user_id: UUID) -> list[tuple[ReadingGroupModel, ReadingGroupMemberModel]]:
        stmt = (
            select(ReadingGroupModel, ReadingGroupMemberModel)
            .join(ReadingGroupMemberModel, ReadingGroupMemberModel.group_id == ReadingGroupModel.id)
            .where(ReadingGroupMemberModel.user_id == user_id)
            .order_by(ReadingGroupModel.updated_at.desc())
        )
        result = await self.db_session.execute(stmt)
        return [(group, membership) for group, membership in result.all()]

    async def get_for_member(
        self, user_id: UUID, group_id: UUID, for_update: bool = False
    ) -> tuple[ReadingGroupModel, ReadingGroupMemberModel] | None:
        stmt = (
            select(ReadingGroupModel, ReadingGroupMemberModel)
            .join(ReadingGroupMemberModel, ReadingGroupMemberModel.group_id == ReadingGroupModel.id)
            .where(ReadingGroupModel.id == group_id, ReadingGroupMemberModel.user_id == user_id)
        )
        if for_update:
            stmt = stmt.with_for_update()
        result = await self.db_session.execute(stmt)
        row = result.first()
        return (row[0], row[1]) if row else None

    async def get_by_invite_token(self, token: str) -> ReadingGroupModel | None:
        stmt = select(ReadingGroupModel).where(ReadingGroupModel.invite_token == token)
        result = await self.db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def save(self, instance, changes: dict):
        for field, value in changes.items():
            setattr(instance, field, value)
        await self.db_session.commit()
        await self.db_session.refresh(instance)
        return instance

    async def rollback(self) -> None:
        await self.db_session.rollback()

    async def delete_group(self, group_id: UUID) -> None:
        await self.db_session.execute(delete(ReadingGroupNoteModel).where(ReadingGroupNoteModel.group_id == group_id))
        await self.db_session.execute(delete(ReadingGroupMemberModel).where(ReadingGroupMemberModel.group_id == group_id))
        await self.db_session.execute(delete(ReadingGroupModel).where(ReadingGroupModel.id == group_id))
        await self.db_session.commit()

    # ── Members ──

    async def members(self, group_id: UUID) -> list[tuple[ReadingGroupMemberModel, str]]:
        """Memberships with the user's name, leader first, then by joining order."""
        stmt = (
            select(ReadingGroupMemberModel, UsersModel.username)
            .join(UsersModel, UsersModel.id == ReadingGroupMemberModel.user_id)
            .where(ReadingGroupMemberModel.group_id == group_id)
            .order_by((ReadingGroupMemberModel.role == LEADER).desc(), ReadingGroupMemberModel.created_at)
        )
        result = await self.db_session.execute(stmt)
        return [(membership, username) for membership, username in result.all()]

    async def members_count(self, group_id: UUID) -> int:
        stmt = select(func.count()).select_from(ReadingGroupMemberModel).where(ReadingGroupMemberModel.group_id == group_id)
        return await self.db_session.scalar(stmt) or 0

    async def membership(self, group_id: UUID, user_id: UUID) -> ReadingGroupMemberModel | None:
        stmt = select(ReadingGroupMemberModel).where(
            ReadingGroupMemberModel.group_id == group_id, ReadingGroupMemberModel.user_id == user_id
        )
        result = await self.db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def member_by_id(self, group_id: UUID, member_id: UUID) -> ReadingGroupMemberModel | None:
        stmt = select(ReadingGroupMemberModel).where(
            ReadingGroupMemberModel.group_id == group_id, ReadingGroupMemberModel.id == member_id
        )
        result = await self.db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def add_member(
        self, group_id: UUID, user_id: UUID, show_name: bool, consent_version: str, now: datetime
    ) -> ReadingGroupMemberModel:
        membership = ReadingGroupMemberModel(
            group_id=group_id, user_id=user_id, role=MEMBER, show_name=show_name,
            consent_version=consent_version, consent_at=now, read_ranges={},
        )
        self.db_session.add(membership)
        await self.db_session.commit()
        await self.db_session.refresh(membership)
        return membership

    async def remove_member(self, membership: ReadingGroupMemberModel) -> None:
        await self.db_session.delete(membership)
        await self.db_session.commit()

    # ── Notes ──

    async def notes(self, group_id: UUID) -> list[ReadingGroupNoteModel]:
        stmt = select(ReadingGroupNoteModel).where(ReadingGroupNoteModel.group_id == group_id)
        result = await self.db_session.execute(stmt)
        return list(result.scalars().all())

    async def note(self, group_id: UUID, day_index: int) -> ReadingGroupNoteModel | None:
        stmt = select(ReadingGroupNoteModel).where(
            ReadingGroupNoteModel.group_id == group_id, ReadingGroupNoteModel.day_index == day_index
        )
        result = await self.db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert_note(
        self, group_id: UUID, author_id: UUID, day_index: int, text: str, study_id: UUID | None
    ) -> ReadingGroupNoteModel:
        note = await self.note(group_id, day_index)
        if note is None:
            note = ReadingGroupNoteModel(group_id=group_id, author_id=author_id, day_index=day_index, text=text, study_id=study_id)
            self.db_session.add(note)
        else:
            note.text, note.study_id, note.author_id = text, study_id, author_id
        await self.db_session.commit()
        await self.db_session.refresh(note)
        return note

    async def delete_note(self, group_id: UUID, day_index: int) -> bool:
        stmt = delete(ReadingGroupNoteModel).where(
            ReadingGroupNoteModel.group_id == group_id, ReadingGroupNoteModel.day_index == day_index
        )
        result = await self.db_session.execute(stmt)
        await self.db_session.commit()
        return result.rowcount > 0
