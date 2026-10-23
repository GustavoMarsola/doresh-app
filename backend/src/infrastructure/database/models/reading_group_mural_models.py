import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from src.infrastructure.database.models.entity_model import EntityModel


class ReadingGroupShareModel(EntityModel):
    """
    An annotation a member chose to share with one group: a comment (its text is copied at
    share time) or a highlight (just the verses and colour). Pinned to a verse range of one
    chapter; `book` is the normalized slug, as in bible_comments. The member's own annotation
    stays private and untouched; unsharing deletes this row. The leader can hide a share
    (`hidden_at`) without deleting it.
    """
    __tablename__ = "reading_group_shares"
    __table_args__ = (Index("ix_reading_group_shares_passage", "group_id", "book", "chapter"),)

    group_id:    Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("reading_groups.id"), index=True)
    user_id:     Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    kind:        Mapped[str]       = mapped_column()  # "comment" | "highlight"
    comment_id:  Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("bible_comments.id", ondelete="SET NULL"), nullable=True
    )
    book:        Mapped[str]       = mapped_column()
    chapter:     Mapped[int]       = mapped_column()
    verse_start: Mapped[int]       = mapped_column()
    verse_end:   Mapped[int]       = mapped_column()
    text:        Mapped[str]       = mapped_column(nullable=True)  # comments only
    color:       Mapped[str]       = mapped_column(nullable=True)  # highlights only
    hidden_at:   Mapped[datetime]  = mapped_column(nullable=True)


class ReadingGroupShareReplyModel(EntityModel):
    __tablename__ = "reading_group_share_replies"

    share_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("reading_group_shares.id", ondelete="CASCADE"), index=True
    )
    user_id:  Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    text:     Mapped[str]       = mapped_column()


class ReadingGroupShareReportModel(EntityModel):
    """A member flagged a share for the leader's attention; one report per member and share."""
    __tablename__ = "reading_group_share_reports"
    __table_args__ = (UniqueConstraint("share_id", "user_id", name="uq_reading_group_share_report"),)

    share_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("reading_group_shares.id", ondelete="CASCADE"), index=True
    )
    user_id:  Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True)
