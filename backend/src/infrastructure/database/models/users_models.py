import uuid
from datetime import datetime, date
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from src.infrastructure.database.models.entity_model import EntityModel
from src.common.utilities import set_local_time


class AddressModel(EntityModel):
    __tablename__ = "addresses"

    street:       Mapped[str] = mapped_column()
    number:       Mapped[str] = mapped_column(nullable=True)
    complement:   Mapped[str] = mapped_column(nullable=True)
    neighborhood: Mapped[str] = mapped_column()
    city:         Mapped[str] = mapped_column()
    state:        Mapped[str] = mapped_column()
    postal_code:  Mapped[str] = mapped_column()
    country:      Mapped[str] = mapped_column(default="BRAZIL")


class UsersModel(EntityModel):
    __tablename__ = "users"

    email:           Mapped[str]  = mapped_column(unique=True)
    password:        Mapped[str]  = mapped_column()
    document_number: Mapped[str]  = mapped_column(unique=True)
    document_type:   Mapped[str]  = mapped_column()
    username:        Mapped[str]  = mapped_column()
    phone:           Mapped[str]  = mapped_column(nullable=True)
    active:          Mapped[bool] = mapped_column(default=False)
    verified:        Mapped[bool] = mapped_column(default=False)
    external_id:     Mapped[str]  = mapped_column(unique=True, nullable=True)

    address_id:      Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("addresses.id"), nullable=True)
    subscription_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("subscriptions.id"), nullable=True)


class UsersVerificationModel(EntityModel):
    __tablename__ = "users_verifications"

    user_id:           Mapped[uuid.UUID]  = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"))
    verification_code: Mapped[str]        = mapped_column()
    expires_at:        Mapped[date]       = mapped_column()
    email_sent:        Mapped[bool]       = mapped_column(default=False)
    email_sent_at:     Mapped[datetime]   = mapped_column(nullable=True)
    confirmed:         Mapped[bool]       = mapped_column(default=False)
    confirmed_at:      Mapped[datetime]   = mapped_column(nullable=True)


class SessionsModel(EntityModel):
    __tablename__ = "sessions"

    user_id:    Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    token:      Mapped[str]       = mapped_column(nullable=True)
    login_at:   Mapped[datetime]  = mapped_column(default=set_local_time)
    expires_at: Mapped[datetime]  = mapped_column(nullable=True)
    ip_address: Mapped[str]       = mapped_column(nullable=True)
    logout_at:  Mapped[datetime]  = mapped_column(nullable=True)
    message:    Mapped[str]       = mapped_column(nullable=True)
