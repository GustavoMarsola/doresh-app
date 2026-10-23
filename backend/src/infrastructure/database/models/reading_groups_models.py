import uuid
from datetime import date, datetime
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from src.infrastructure.database.models.entity_model import EntityModel


class ReadingGroupModel(EntityModel):
    """
    A group of people reading the same plan at the same rhythm, led by one user.
    The plan definition is copied from the leader's plan when the group is created, so the
    group keeps its days even if the leader later changes or removes their own plan.
    Only one invite link is active at a time: a new one replaces the previous.
    """
    __tablename__ = "reading_groups"

    leader_id:   Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    name:        Mapped[str]       = mapped_column()
    plan_slug:   Mapped[str]       = mapped_column()
    book:        Mapped[str]       = mapped_column(nullable=True)
    books:       Mapped[list]      = mapped_column(JSON, nullable=True)
    title:       Mapped[str]       = mapped_column(nullable=True)
    start_date:  Mapped[date]      = mapped_column()
    total_days:  Mapped[int]       = mapped_column()
    weekdays:    Mapped[str]       = mapped_column()  # ISO weekdays read, e.g. "12345"
    meeting_weekday: Mapped[int]   = mapped_column(nullable=True)  # ISO weekday of the group's meeting, if any

    invite_token:      Mapped[str]      = mapped_column(nullable=True, unique=True)
    invite_expires_at: Mapped[datetime] = mapped_column(nullable=True)


class ReadingGroupMemberModel(EntityModel):
    """
    One person in a group. Taking part in a Bible reading group reveals religious conviction
    (LGPD sensitive data): the row records the explicit consent given on joining, and leaving
    the group deletes the row. `show_name` is the member's choice to be named to the others;
    otherwise only the aggregate ("8 of 12 read day 5") is shown.
    """
    __tablename__ = "reading_group_members"
    __table_args__ = (UniqueConstraint("group_id", "user_id", name="uq_reading_group_member"),)

    group_id:        Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("reading_groups.id"), index=True)
    user_id:         Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    role:            Mapped[str]       = mapped_column()  # "leader" | "member"
    show_name:       Mapped[bool]      = mapped_column(default=False)
    consent_version: Mapped[str]       = mapped_column()
    consent_at:      Mapped[datetime]  = mapped_column()
    read_ranges:     Mapped[dict]      = mapped_column(JSON, default=dict)  # same shape as user_reading_plans


class ReadingGroupNoteModel(EntityModel):
    """The leader's note for one day of the group's plan, optionally with one of their studies attached."""
    __tablename__ = "reading_group_notes"
    __table_args__ = (UniqueConstraint("group_id", "day_index", name="uq_reading_group_note_day"),)

    group_id:  Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("reading_groups.id"), index=True)
    author_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"))
    day_index: Mapped[int]       = mapped_column()
    text:      Mapped[str]       = mapped_column()
    study_id:  Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("studies.id", ondelete="SET NULL"), nullable=True
    )
