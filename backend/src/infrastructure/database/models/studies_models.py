import uuid
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from src.infrastructure.database.models.entity_model import EntityModel


class StudyModel(EntityModel):
    __tablename__ = "studies"

    user_id:      Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    title:        Mapped[str]       = mapped_column()
    introduction: Mapped[str]       = mapped_column()
    conclusion:   Mapped[str]       = mapped_column()
    ai_generated: Mapped[bool]      = mapped_column(default=False)
    active:       Mapped[bool]      = mapped_column(default=True)

    sections: Mapped[list["StudySectionModel"]] = relationship(
        "StudySectionModel",
        back_populates="study",
        order_by="StudySectionModel.order_index",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    references: Mapped[list["StudyReferenceModel"]] = relationship(
        "StudyReferenceModel",
        back_populates="study",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class StudySectionModel(EntityModel):
    __tablename__ = "study_sections"
    __table_args__ = (
        UniqueConstraint("study_id", "order_index", name="uq_study_section_order"),
    )

    study_id:    Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("studies.id"), index=True)
    title:       Mapped[str]       = mapped_column(nullable=True)
    order_index: Mapped[int]       = mapped_column()
    text:        Mapped[str]       = mapped_column()

    study: Mapped["StudyModel"] = relationship("StudyModel", back_populates="sections")


class StudyReferenceModel(EntityModel):
    __tablename__ = "study_references"

    study_id:    Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("studies.id"), index=True)
    book:        Mapped[str]       = mapped_column()
    chapter:     Mapped[int]       = mapped_column()
    verse_start: Mapped[int]       = mapped_column(nullable=True)
    verse_end:   Mapped[int]       = mapped_column(nullable=True)

    study: Mapped["StudyModel"] = relationship("StudyModel", back_populates="references")
