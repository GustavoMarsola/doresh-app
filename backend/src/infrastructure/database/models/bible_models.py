import uuid
from sqlalchemy import ForeignKey, Index, UniqueConstraint
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
    """One row per highlighted verse. `book` is the normalized slug (e.g. "1_corintios")."""
    __tablename__ = "bible_highlights"
    __table_args__ = (
        UniqueConstraint("user_id", "book", "chapter", "verse", name="uq_bible_highlights_user_verse"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    book:    Mapped[str]       = mapped_column()
    chapter: Mapped[int]       = mapped_column()
    verse:   Mapped[int]       = mapped_column()
    color:   Mapped[str]       = mapped_column()


class BibleCommentsModel(EntityModel):
    """A comment on a verse range (`verse_start`..`verse_end`) of one chapter."""
    __tablename__ = "bible_comments"
    __table_args__ = (
        Index("ix_bible_comments_user_passage", "user_id", "book", "chapter"),
    )

    user_id:     Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    book:        Mapped[str]       = mapped_column()
    chapter:     Mapped[int]       = mapped_column()
    verse_start: Mapped[int]       = mapped_column()
    verse_end:   Mapped[int]       = mapped_column()
    comment:     Mapped[str]       = mapped_column()
