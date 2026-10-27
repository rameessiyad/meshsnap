import math
import threading
import time
from collections import deque
from collections.abc import Callable

from app.core.config import get_settings


class RateLimiter:
    """Sliding-window limiter: at most `max_attempts` events per `window_seconds` per key.

    Held in this process's memory. It resets when the server restarts and is not
    shared between several server processes (see "Known limitations").
    """

    def __init__(
        self,
        max_attempts: int,
        window_seconds: int,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._clock = clock
        self._events: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def _prune(self, key: str) -> deque[float] | None:
        """Drop expired events. Must be called with the lock held."""
        events = self._events.get(key)
        if events is None:
            return None
        cutoff = self._clock() - self.window_seconds
        while events and events[0] <= cutoff:
            events.popleft()
        if not events:
            del self._events[key]
            return None
        return events

    def is_blocked(self, key: str) -> bool:
        with self._lock:
            events = self._prune(key)
            return events is not None and len(events) >= self.max_attempts

    def record(self, key: str) -> None:
        with self._lock:
            self._prune(key)
            self._events.setdefault(key, deque()).append(self._clock())

    def retry_after(self, key: str) -> int:
        """Seconds until the key is allowed again. 0 if it is not blocked."""
        with self._lock:
            events = self._prune(key)
            if events is None or len(events) < self.max_attempts:
                return 0
            # The event that must expire for the count to drop below the limit.
            blocking_event = events[len(events) - self.max_attempts]
            remaining = blocking_event + self.window_seconds - self._clock()
            return max(1, math.ceil(remaining))

    def clear_key(self, key: str) -> None:
        with self._lock:
            self._events.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._events.clear()


_settings = get_settings()

# Failed logins per (IP + email) pair: stops password guessing on one account.
login_pair_limiter = RateLimiter(
    _settings.login_max_attempts, _settings.login_window_seconds
)

# Failed logins per IP: stops one client trying many accounts.
login_ip_limiter = RateLimiter(
    _settings.login_max_attempts_per_ip, _settings.login_window_seconds
)

# Registration attempts per IP: limits fake accounts and invite-code guessing.
register_limiter = RateLimiter(
    _settings.register_max_attempts, _settings.register_window_seconds
)


def reset_all_limiters() -> None:
    """Used by tests so one test's attempts never affect another."""
    login_pair_limiter.clear()
    login_ip_limiter.clear()
    register_limiter.clear()