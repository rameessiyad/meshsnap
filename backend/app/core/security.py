import hashlib
import secrets

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

# PasswordHasher() uses Argon2id by default, with the library's recommended
# cost parameters. The salt is generated randomly for every password.
_hasher = PasswordHasher()

# A throwaway hash used when a login email does not exist. Verifying against it
# makes "unknown email" take about as long as "wrong password", so response
# timing does not reveal which emails are registered.
_DUMMY_HASH = _hasher.hash("meshsnap-timing-equalizer")


def hash_password(password: str) -> str:
    """Return an Argon2id hash of the password."""
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Check a password against a stored hash. Never raises on a bad password."""
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def verify_dummy_password(password: str) -> None:
    """Spend the same time as a real check. Call when the email is not found."""
    verify_password(password, _DUMMY_HASH)


def password_needs_rehash(password_hash: str) -> bool:
    """True if the hash was made with older, weaker parameters."""
    return _hasher.check_needs_rehash(password_hash)


def generate_token() -> str:
    """A random URL-safe token (43 characters) for session cookies and reset links."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """SHA-256 hex digest (64 characters). Only this is stored in the database."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def tokens_match(a: str, b: str) -> bool:
    """Constant-time comparison, used for CSRF tokens."""
    return secrets.compare_digest(a.encode("utf-8"), b.encode("utf-8"))