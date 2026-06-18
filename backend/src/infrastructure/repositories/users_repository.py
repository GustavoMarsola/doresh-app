from uuid import UUID
from datetime import date
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.repositories import get_session_repo
from src.infrastructure.database.models.users_models import (
    UsersModel,
    SessionsModel,
    AddressModel,
    UsersVerificationModel,
)
from src.infrastructure.database.models.studies_models import StudyModel
from src.infrastructure.database.models.bible_models import BibleHighlightsModel, BibleCommentsModel
from src.common.utilities import set_local_time


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

        # Check expiration before confirming
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

    async def update_user_external_id(self, user_id: UUID, external_id: str) -> UsersModel | None:
        stmt = select(UsersModel).where(UsersModel.id == user_id)
        result = await self.db_session.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            user.external_id = external_id
            await self.db_session.commit()
            await self.db_session.refresh(user)
        return user

    async def register_user_session(self, user_id: UUID) -> SessionsModel:
        session = SessionsModel(user_id=user_id)
        self.db_session.add(session)
        await self.db_session.commit()
        await self.db_session.refresh(session)
        return session

    async def logout_session(self, session_id: UUID, message: str = "User logged out") -> SessionsModel | None:
        stmt = select(SessionsModel).where(SessionsModel.id == session_id)
        result = await self.db_session.execute(stmt)
        session = result.scalar_one_or_none()
        if session:
            session.message = message
            session.logout_at = set_local_time()
            await self.db_session.commit()
            await self.db_session.refresh(session)
        return session

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

    async def update_user_subscription(self, user_id: str, subscription_id: str) -> UsersModel | None:
        stmt = select(UsersModel).where(UsersModel.id == user_id)
        result = await self.db_session.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            user.subscription_id = subscription_id
            await self.db_session.commit()
            await self.db_session.refresh(user)
        return user
