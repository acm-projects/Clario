# The Rate Limiter That Blocks Everyone

One customer's requests block unrelated accounts, and requests are rejected after the rolling window should reset.

RateLimiter(limit, window) requires positive values. allow(key, now) counts accepted requests in (now-window, now], separately per key. Rejecting a request must not extend its window. Timestamps are nondecreasing per key; reject backwards timestamps. C++ uses double seconds and string keys. Python rejects boolean limits.

Start in service.py; policy.py records the shared mutation policy. Tests are read-only.
