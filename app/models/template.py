"""
Template model — cancellable biometric fingerprint templates.
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Text, Integer, DateTime, Enum, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TemplateStatus(str, enum.Enum):
    active = "active"
    cancelled = "cancelled"


class Template(Base):
    __tablename__ = "templates"

    __table_args__ = (
        Index("ix_templates_user_id_status", "user_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    biohash: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    key_reference: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("key_vaults.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[TemplateStatus] = mapped_column(
        Enum(TemplateStatus, name="template_status", native_enum=True),
        nullable=False,
        default=TemplateStatus.active,
    )
    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )

    # ── Relationships ─────────────────────────────────────────────────
    user = relationship("User", back_populates="templates")
    key_vault = relationship("KeyVault", back_populates="templates")

    def __repr__(self) -> str:
        return f"<Template id={self.id} status={self.status.value} v{self.version}>"
