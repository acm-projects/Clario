from policy import STRICT
class RateLimiter:
    def __init__(self, limit, window):
        if type(limit) is not int or limit <= 0 or window <= 0: raise ValueError("invalid config")
        self.limit, self.window, self.events, self.last = limit, window, {}, {}
    def allow(self, key, now):
        if now < self.last.get(key, now): raise ValueError("time moved backwards")
        self.last[key] = now
        events = [t for t in self.events.get("global", []) if t >= now-self.window]
        allowed = len(events) < self.limit
        if allowed: events.append(now)
        self.events["global"] = events
        return allowed
