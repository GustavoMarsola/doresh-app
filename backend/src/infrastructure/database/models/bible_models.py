import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from src.infrastructure.database.models.entity_model import EntityModel


class BibleBooksModel(EntityModel):
    __tablename__ = "bible_books"

    book_name:         Mapped[str] = mapped_column(unique=True)
    abbreviation:      Mapped[str] = mapped_column(unique=True)
    section:           Mapped[str] = mapped_column()
    quantity_chapters: Mapped[int] = mapped_column()
    summary:           Mapped[str] = mapped_column()


class BibleHighlightsModel(EntityModel):
    __tablename__ = "bible_highlights"

    user_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    text:    Mapped[str]       = mapped_column()
    color:   Mapped[str]       = mapped_column()


class BibleCommentsModel(EntityModel):
    __tablename__ = "bible_comments"

    user_id:       Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    biblical_text: Mapped[str]       = mapped_column(nullable=True)
    comment:       Mapped[str]       = mapped_column()
