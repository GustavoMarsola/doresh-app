import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from src.infrastructure.database.models.entity_model import EntityModel


class ChatAIModel(EntityModel):
    __tablename__ = "chat_ai"

    session_id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False, index=True)
    message:    Mapped[dict]      = mapped_column(JSON, nullable=False)
