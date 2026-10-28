# The Broken TTL + LRU Cache

Feature flags go stale, hot entries disappear, and false-valued flags are repeatedly fetched.

## Contract
TTLCache has positive integer capacity and positive TTL, with an injectable clock. Entries expire at expires_at <= now. Reads refresh recency, not TTL. Writes refresh TTL and recency. Updating a key must not evict another key. len counts only live entries; eviction removes the least recently used live key. None denotes a miss; stored flag values are non-None and may include False, 0, or an empty string.

These are synthetic practice scenarios, not actual company questions.
Use Run Tests to reproduce the failures. Preserve public interfaces; edit implementation files, not tests.
