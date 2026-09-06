"""SQLAlchemy async database setup.

Provides the async engine, async session factory, and declarative base.
All ORM models should inherit from ``Base`` defined here.
"""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, func, CHAR, TypeDecorator
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.config import settings


class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(36), storing as
    hyphenated string values.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == "postgresql":
            return str(value)
        else:
            if isinstance(value, uuid.UUID):
                return str(value)
            else:
                return str(uuid.UUID(str(value)))

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(str(value))
            return value


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=30,
)

async_session_factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    """Declarative base for all SQLAlchemy models.

    Includes ``__abstract__`` to prevent table creation for the base itself
    and provides common ``created_at`` and ``updated_at`` columns.
    """

    __abstract__ = True

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    type_annotation_mapper = {
        datetime: DateTime(timezone=True),
        uuid.UUID: GUID(),
    }

    def __repr__(self) -> str:  # pragma: no cover
        """Provide a sensible default repr for all models."""
        attrs = []
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            attrs.append(f"{column.name}={value!r}")
        return f"{self.__class__.__name__}({', '.join(attrs)})"

    @property
    def columns(self):  # pragma: no cover
        """Return list of column objects on the model."""
        return self.__table__.columns

    @property
    def primary_key(self):  # pragma: no cover
        """Return the primary key column."""
        for column in self.__table__.columns:
            if column.primary_key:
                return column
        return None


def get_async_session() -> async_sessionmaker[AsyncSession]:
    """Return the async session factory."""
    return async_session_factory


async def get_session() -> AsyncSession:
    """Dependency: yield an async database session.

    Usage in route handlers::

        def get_db(session: AsyncSession = Depends(get_session)):
            ...
    """
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """Initialise the database — create tables and ensure demo users are seeded."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all, checkfirst=True)

    # Ensure demo accounts and showcase campus data are seeded
    from app.core.security import hash_password
    from app.models.user import User, UserRole
    from sqlalchemy.future import select

    demo_users = [
        {
            "id": uuid.UUID("11111111-1111-1111-1111-111111111111"),
            "email": "student@somaiya.edu",
            "full_name": "Arjun Mehta",
            "role": UserRole.STUDENT,
        },
        {
            "id": uuid.UUID("22222222-2222-2222-2222-222222222222"),
            "email": "faculty@somaiya.edu",
            "full_name": "Dr. Priya Sharma",
            "role": UserRole.FACULTY,
        },
        {
            "id": uuid.UUID("33333333-3333-3333-3333-333333333333"),
            "email": "admin@somaiya.edu",
            "full_name": "Campus Administrator",
            "role": UserRole.ADMIN,
        },
        {
            "id": uuid.UUID("44444444-4444-4444-4444-444444444444"),
            "email": "diya.shah@somaiya.edu",
            "full_name": "Diya Shah",
            "role": UserRole.STUDENT,
        },
        {
            "id": uuid.UUID("55555555-5555-5555-5555-555555555555"),
            "email": "rajesh.kumar@somaiya.edu",
            "full_name": "Dr. Rajesh Kumar",
            "role": UserRole.FACULTY,
        },
    ]

    async with async_session_factory() as session:
        for u in demo_users:
            res = await session.execute(select(User).where(User.email == u["email"]))
            existing = res.scalar_one_or_none()
            if not existing:
                existing = User(
                    id=u["id"],
                    email=u["email"],
                    hashed_password=hash_password("demo123"),
                    full_name=u["full_name"],
                    role=u["role"],
                    is_active=True,
                    is_verified=True,
                )
                session.add(existing)
            else:
                existing.hashed_password = hash_password("demo123")
                existing.is_active = True
                existing.is_verified = True
        await session.commit()
