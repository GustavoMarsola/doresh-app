from enum import Enum
from uuid import UUID
from datetime import date, datetime
from fastapi import Depends
from sqlalchemy import select, or_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.repositories import get_session_repo
from src.infrastructure.database.models.users_models import (
    UsersModel,
    SessionsModel,
    AddressModel,
    UsersVerificationModel,
)
from src.infrastructure.database.models.studies_models import StudyModel, StudySectionModel, StudyReferenceModel
from src.infrastructure.database.models.ai_models import ChatAIModel
from src.infrastructure.database.models.bible_models import BibleHighlightsModel, BibleCommentsModel
from src.common.utilities import set_local_time


class RefreshOutcome(str, Enum):
    ROTATED = "rotated"
    REUSED  = "reused"
    INVALID = "invalid"


class UsersRepository:
    def __init__(self, db_session: AsyncSession = Depends(get_session_repo)) -> None:
        self.db_session = db_session

    async def create_user(self, data: dict) -> UsersModel:
        user = UsersModel(**data)
        self.db_session.add(user)
        await self.db_session.commit()
        await self.db_session.refresh(user)
        return user

    async def create_email_verification(self, data: dict) -> UsersVerificationModel:
        verification = UsersVerificationModel(**data)
        self.db_session.add(verification)
        await self.db_session.commit()
        await self.db_session.refresh(verification)
        return verification

    async def update_user_email_verification(
        self, verification_id: UUID
    ) -> tuple[UsersModel | None, UsersVerificationModel | None]:
        stmt = select(UsersVerificationModel).where(UsersVerificationModel.id == verification_id)
        result = await self.db_session.execute(stmt)
        verification = result.scalar_one_or_none()

        if not verification:
            return None, None

        if verification.expires_at < date.today():
            return None, None

        user_id = verification.user_id
        verification.confirmed = True
        verification.confirmed_at = set_local_time()
        await self.db_session.commit()
        await self.db_session.refresh(verification)

        stmt = select(UsersModel).where(UsersModel.id == user_id)
        result = await self.db_session.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            user.active = True
            user.verified = True
            await self.db_session.commit()
            await self.db_session.refresh(user)

        return user, verification

    async def get_user_by_email(self, email: str) -> UsersModel | None:
        stmt = select(UsersModel).where(UsersModel.email == email)
        result = await self.db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: UUID) -> UsersModel | None:
        stmt = select(UsersModel).where(UsersModel.id == user_id)
        result = await self.db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def register_user_session(
        self,
        user_id: UUID,
        refresh_token_hash: str,
        refresh_expires_at: datetime,
    ) -> SessionsModel:
        session = SessionsModel(
            user_id=user_id,
            refresh_token_hash=refresh_token_hash,
            refresh_expires_at=refresh_expires_at,
        )
        self.db_session.add(session)
        await self.db_session.commit()
        await self.db_session.refresh(session)
        return session

    async def get_active_session(self, user_id: UUID, session_id: UUID) -> SessionsModel | None:
        stmt = select(SessionsModel).where(
            SessionsModel.id == session_id,
            SessionsModel.user_id == user_id,
            SessionsModel.logout_at.is_(None),
        )
        result = await self.db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def rotate_refresh_token(
        self,
        refresh_token_hash: str,
        new_refresh_token_hash: str,
        new_refresh_expires_at: datetime,
    ) -> tuple["RefreshOutcome", SessionsModel | None]:
        """
        Swap the session's current refresh token for a new one under a row lock.
        A token that matches the previous (already rotated) hash revokes the whole session.
        """
        stmt = (
            select(SessionsModel)
            .where(
                or_(
                    SessionsModel.refresh_token_hash == refresh_token_hash,
                    SessionsModel.previous_refresh_token_hash == refresh_token_hash,
                )
            )
            .with_for_update()
        )
        result  = await self.db_session.execute(stmt)
        session = result.scalars().first()
        now     = set_local_time()

        if session is None or session.logout_at is not None:
            await self.db_session.rollback()
            return RefreshOutcome.INVALID, None

        if session.refresh_token_hash != refresh_token_hash:
            self._revoke(session, "Refresh token reuse detected", now)
            await self.db_session.commit()
            await self.db_session.refresh(session)
            return RefreshOutcome.REUSED, session

        if session.refresh_expires_at is None or session.refresh_expires_at <= now:
            await self.db_session.rollback()
            return RefreshOutcome.INVALID, None

        session.previous_refresh_token_hash = refresh_token_hash
        session.refresh_token_hash          = new_refresh_token_hash
        session.refresh_expires_at          = new_refresh_expires_at
        session.refreshed_at                = now
        await self.db_session.commit()
        await self.db_session.refresh(session)
        return RefreshOutcome.ROTATED, session

    async def logout_session(
        self,
        user_id: UUID,
        session_id: UUID,
        message: str = "User logged out",
    ) -> SessionsModel | None:
        stmt = select(SessionsModel).where(
            SessionsModel.id == session_id,
            SessionsModel.user_id == user_id,
        )
        result = await self.db_session.execute(stmt)
        session = result.scalar_one_or_none()
        if session and session.logout_at is None:
            self._revoke(session, message, set_local_time())
            await self.db_session.commit()
            await self.db_session.refresh(session)
        return session

    async def update_password(self, user_id: UUID, password_hash: str) -> None:
        user = await self.get_user_by_id(user_id)
        if user:
            user.password = password_hash
            await self.db_session.commit()

    async def revoke_all_sessions(self, user_id: UUID, message: str) -> list[UUID]:
        """Log out every active session of the user. Returns the ids of the sessions revoked."""
        stmt = select(SessionsModel).where(
            SessionsModel.user_id == user_id,
            SessionsModel.logout_at.is_(None),
        )
        result   = await self.db_session.execute(stmt)
        sessions = result.scalars().all()
        now      = set_local_time()
        for session in sessions:
            self._revoke(session, message, now)
        await self.db_session.commit()
        return [session.id for session in sessions]

    async def delete_user_and_data(self, user_id: UUID) -> list[UUID]:
        """
        Permanently erase the user and everything they own, in one transaction.
        Returns the ids of the user's sessions so their cached state can be revoked.
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return []

        session_ids = (
            await self.db_session.execute(select(SessionsModel.id).where(SessionsModel.user_id == user_id))
        ).scalars().all()
        user_studies = select(StudyModel.id).where(StudyModel.user_id == user_id)

        await self.db_session.execute(delete(ChatAIModel).where(ChatAIModel.session_id.in_(session_ids)))
        await self.db_session.execute(delete(StudySectionModel).where(StudySectionModel.study_id.in_(user_studies)))
        await self.db_session.execute(delete(StudyReferenceModel).where(StudyReferenceModel.study_id.in_(user_studies)))
        for model in (StudyModel, BibleHighlightsModel, BibleCommentsModel, SessionsModel, UsersVerificationModel):
            await self.db_session.execute(delete(model).where(model.user_id == user_id))

        address_id = user.address_id
        await self.db_session.execute(delete(UsersModel).where(UsersModel.id == user_id))
        if address_id:
            await self.db_session.execute(delete(AddressModel).where(AddressModel.id == address_id))
        await self.db_session.commit()
        return list(session_ids)

    @staticmethod
    def _revoke(session: SessionsModel, message: str, now: datetime) -> None:
        session.message                     = message
        session.logout_at                   = now
        session.refresh_token_hash          = None
        session.previous_refresh_token_hash = None
        session.refresh_expires_at          = None

    async def get_user_address(self, user_id: str) -> AddressModel | None:
        stmt = (
            select(AddressModel)
            .join(UsersModel, UsersModel.address_id == AddressModel.id)
            .where(UsersModel.id == user_id)
        )
        result = await self.db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_studies(self, user_id: str) -> list[StudyModel]:
        stmt = select(StudyModel).where(StudyModel.user_id == user_id)
        result = await self.db_session.execute(stmt)
        return result.scalars().all()

    async def get_user_highlights(self, user_id: str) -> list[BibleHighlightsModel]:
        stmt = (
            select(BibleHighlightsModel)
            .where(BibleHighlightsModel.user_id == user_id)
            .order_by(BibleHighlightsModel.created_at.desc())
        )
        result = await self.db_session.execute(stmt)
        return result.scalars().all()

    async def get_user_comments(self, user_id: str) -> list[BibleCommentsModel]:
        stmt = (
            select(BibleCommentsModel)
            .where(BibleCommentsModel.user_id == user_id)
            .order_by(BibleCommentsModel.created_at.desc())
        )
        result = await self.db_session.execute(stmt)
        return result.scalars().all()
