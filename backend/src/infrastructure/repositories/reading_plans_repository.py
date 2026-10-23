from uuid import UUID
from fastapi import Depends
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.repositories import get_session_repo
from src.infrastructure.database.models.reading_plans_models import UserReadingPlanModel


class ReadingPlansRepository:
    """Every query is scoped to the owner: another user's plan behaves as if it didn't exist."""

    def __init__(self, db_session: AsyncSession = Depends(get_session_repo)) -> None:
        self.db_session = db_session

    async def create(self, user_id: UUID, data: dict) -> UserReadingPlanModel:
        plan = UserReadingPlanModel(user_id=user_id, read_ranges={}, **data)
        self.db_session.add(plan)
        await self.db_session.commit()
        await self.db_session.refresh(plan)
        return plan

    async def list_by_user(self, user_id: UUID) -> list[UserReadingPlanModel]:
        stmt = (
            select(UserReadingPlanModel)
            .where(UserReadingPlanModel.user_id == user_id)
            .order_by(UserReadingPlanModel.updated_at.desc())
        )
        result = await self.db_session.execute(stmt)
        return list(result.scalars().all())

    async def get(self, user_id: UUID, plan_id: UUID, for_update: bool = False) -> UserReadingPlanModel | None:
        stmt = select(UserReadingPlanModel).where(
            UserReadingPlanModel.id == plan_id,
            UserReadingPlanModel.user_id == user_id,
        )
        if for_update:
            stmt = stmt.with_for_update()
        result = await self.db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def save(self, plan: UserReadingPlanModel, changes: dict) -> UserReadingPlanModel:
        for field, value in changes.items():
            setattr(plan, field, value)
        await self.db_session.commit()
        await self.db_session.refresh(plan)
        return plan

    async def rollback(self) -> None:
        await self.db_session.rollback()

    async def delete(self, user_id: UUID, plan_id: UUID) -> bool:
        stmt = delete(UserReadingPlanModel).where(
            UserReadingPlanModel.id == plan_id,
            UserReadingPlanModel.user_id == user_id,
        )
        result = await self.db_session.execute(stmt)
        await self.db_session.commit()
        return result.rowcount > 0
