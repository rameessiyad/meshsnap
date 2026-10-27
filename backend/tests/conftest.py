from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.session import engine, get_db
from app.main import app
from app.services.rate_limiter import reset_all_limiters


@pytest.fixture()
def db() -> Generator[Session, None, None]:
    """A database session whose changes are always rolled back after each test.

    Tests use your real development database, but nothing is ever saved.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
        autoflush=False,
        expire_on_commit=False,
    )
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db: Session) -> Generator[TestClient, None, None]:
    """A test client whose API calls use the rolled-back test session."""

    def override_get_db() -> Generator[Session, None, None]:
        yield db

    app.dependency_overrides[get_db] = override_get_db
    reset_all_limiters()
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
        reset_all_limiters()