import uuid
from decimal import Decimal
from datetime import date, datetime
from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from src.infrastructure.database.models.entity_model import EntityModel


class PlansModel(EntityModel):
    __tablename__ = "plans"

    price:       Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.0)
    discount:    Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.0)
    net_value:   Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.0)
    description: Mapped[str]    = mapped_column(default="FREE_PLAN")
    cycle:       Mapped[str]    = mapped_column(default="MONTHLY")


class SubscriptionsModel(EntityModel):
    __tablename__ = "subscriptions"

    plan_id:              Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("plans.id"))
    payment_method:       Mapped[str]       = mapped_column()
    payment_due_date:     Mapped[date]      = mapped_column()
    external_id:          Mapped[str]       = mapped_column(unique=True)
    status:               Mapped[str]       = mapped_column()
    active:               Mapped[bool]      = mapped_column(default=True)
    expires_on:           Mapped[date]      = mapped_column()
    cancellation_reason:  Mapped[str]       = mapped_column(nullable=True)


class SubscriptionsEventsModel(EntityModel):
    __tablename__ = "subscriptions_events"

    subscription_external_id: Mapped[str]      = mapped_column(nullable=True)
    event_external_id:        Mapped[str]      = mapped_column(nullable=True)
    event_description:        Mapped[str]      = mapped_column()
    event_datetime:           Mapped[datetime] = mapped_column()
    event_raw_data:           Mapped[dict]     = mapped_column(JSON, nullable=True)
