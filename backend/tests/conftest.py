from collections.abc import Generator

import pytest
from sqlalchemy.orm import Session

from app.db.session import engine


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