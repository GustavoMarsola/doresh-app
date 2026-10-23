import uuid
from datetime import date
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from src.infrastructure.database.models.entity_model import EntityModel


class UserReadingPlanModel(EntityModel):
    """
    A user's copy of a catalogue plan (`plan_slug`) with their rhythm and progress.
    The days themselves are computed from the catalogue; `read_ranges` keeps the verses read,
    per chapter ({"joao:3": [[1, 21]]}), so changing the rhythm never loses progress.
    """
    __tablename__ = "user_reading_plans"

    user_id:     Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    plan_slug:   Mapped[str]       = mapped_column()
    book:        Mapped[str]       = mapped_column(nullable=True)  # only for plans where the user picks the book
    books:       Mapped[list]      = mapped_column(JSON, nullable=True)  # only for custom plans: the books chosen
    title:       Mapped[str]       = mapped_column(nullable=True)  # only for custom plans
    start_date:  Mapped[date]      = mapped_column()
    total_days:  Mapped[int]       = mapped_column()
    weekdays:    Mapped[str]       = mapped_column()  # ISO weekdays read, e.g. "12345"
    read_ranges: Mapped[dict]      = mapped_column(JSON, default=dict)
