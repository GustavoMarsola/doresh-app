from uuid import UUID
from fastapi import Depends
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from src.infrastructure.repositories import get_session_repo
from src.infrastructure.database.models.subscriptions_models import (
    SubscriptionsModel,
    SubscriptionsEventsModel,
    PlansModel,
)


class SubscriptionsRepository:
    def __init__(self, db_session: AsyncSession = Depends(get_session_repo)) -> None:
        self.db_session = db_session

    async def get_plan_by_id(self, plan_id: UUID) -> PlansModel | None:
        stmt = select(PlansModel).where(PlansModel.id == plan_id)
        result = await self.db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_subscription_by_id(self, subscription_id: UUID) -> SubscriptionsModel | None:
        stmt = select(SubscriptionsModel).where(SubscriptionsModel.id == subscription_id)
        result = await self.db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_subscription_by_user_id(self, user_id: UUID):
        # Parameterized query to avoid SQL injection
        stmt = text("""
            SELECT
                p.description         AS plan_name,
                p.net_value           AS plan_price,
                s.expires_on::VARCHAR AS next_billing,
                s.status
            FROM subscriptions s
            LEFT JOIN users u ON u.subscription_id = s.id
            LEFT JOIN plans p ON p.id = s.plan_id
            WHERE u.id = :user_id
              AND s.active = true
            ORDER BY s.created_at DESC
            LIMIT 1
        """)
        result = await self.db_session.execute(stmt, {"user_id": str(user_id)})
        return result.mappings().one_or_none()

    async def get_subscription_by_external_id(self, external_id: str) -> SubscriptionsModel | None:
        stmt = select(SubscriptionsModel).where(SubscriptionsModel.external_id == external_id)
        result = await self.db_session.execute(stmt)
        return result.scalar_one_or_none()

    async def save_subscription(self, subscription_data: dict) -> SubscriptionsModel:
        subscription = SubscriptionsModel(**subscription_data)
        self.db_session.add(subscription)
        await self.db_session.commit()
        await self.db_session.refresh(subscription)
        return subscription

    async def save_subscription_event(self, event_data: dict) -> SubscriptionsEventsModel:
        event = SubscriptionsEventsModel(**event_data)
        self.db_session.add(event)
        await self.db_session.commit()
        await self.db_session.refresh(event)
        return event

    async def deactive_subscription(self, subscription_id: UUID, cancellation_reason: str) -> SubscriptionsModel | None:
        stmt = select(SubscriptionsModel).where(SubscriptionsModel.id == subscription_id)
        result = await self.db_session.execute(stmt)
        subscription = result.scalar_one_or_none()
        if subscription:
            subscription.active = False
            subscription.status = "CANCELED"
            subscription.cancellation_reason = cancellation_reason
            await self.db_session.commit()
            await self.db_session.refresh(subscription)
        return subscription

    async def get_all_plans(self) -> list[PlansModel]:
        stmt = select(PlansModel)
        result = await self.db_session.execute(stmt)
        return result.scalars().all()
