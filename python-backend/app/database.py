"""
SQLAlchemy engine, session factory, Base model, and FastAPI dependency.
Uses synchronous engine with psycopg2 (the spec calls for psycopg2-binary).
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import (
    DeclarativeBase,
    sessionmaker,
    Session,
    Mapped,
    mapped_column,
)
from sqlalchemy.dialects.postgresql import UUID

from app.config import settings

# ── Engine ────────────────────────────────────────────────────────────
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=(settings.ENVIRONMENT == "development"),
)

# ── Session factory ───────────────────────────────────────────────────
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)

# ── Naming convention for Alembic auto-generated migrations ──────────
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


# ── Declarative Base ─────────────────────────────────────────────────
class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=convention)


# ── FastAPI dependency ────────────────────────────────────────────────
def get_db() -> Session:
    """Yield a database session and ensure it is closed after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
