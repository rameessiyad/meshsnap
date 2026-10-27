from app.services.rate_limiter import RateLimiter


class FakeClock:
    def __init__(self) -> None:
        self.now = 1000.0

    def __call__(self) -> float:
        return self.now


def make_limiter(max_attempts: int = 3, window: int = 60) -> tuple[RateLimiter, FakeClock]:
    clock = FakeClock()
    return RateLimiter(max_attempts, window, clock=clock), clock


def test_not_blocked_below_the_limit() -> None:
    limiter, _ = make_limiter()
    limiter.record("a")
    limiter.record("a")
    assert not limiter.is_blocked("a")


def test_blocked_when_the_limit_is_reached() -> None:
    limiter, _ = make_limiter()
    for _ in range(3):
        limiter.record("a")
    assert limiter.is_blocked("a")


def test_keys_are_independent() -> None:
    limiter, _ = make_limiter()
    for _ in range(3):
        limiter.record("a")
    assert limiter.is_blocked("a")
    assert not limiter.is_blocked("b")


def test_block_expires_after_the_window() -> None:
    limiter, clock = make_limiter()
    for _ in range(3):
        limiter.record("a")
    clock.now += 61
    assert not limiter.is_blocked("a")


def test_retry_after_counts_down() -> None:
    limiter, clock = make_limiter()
    for _ in range(3):
        limiter.record("a")
    clock.now += 10
    assert limiter.retry_after("a") == 50
    assert limiter.retry_after("never-seen") == 0


def test_clear_key_unblocks() -> None:
    limiter, _ = make_limiter()
    for _ in range(3):
        limiter.record("a")
    limiter.clear_key("a")
    assert not limiter.is_blocked("a")