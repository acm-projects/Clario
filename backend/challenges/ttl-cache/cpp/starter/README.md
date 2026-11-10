# The Broken TTL + LRU Cache (C++)

Feature flags go stale, hot entries disappear, and false-valued flags are repeatedly fetched.

Flag is variant<bool,int,string>; optional<Flag> nullopt is a cache miss. get refreshes recency only, put refreshes TTL and recency. Expire at expires <= clock(). size counts live entries. Updating a key must not evict a different key. Fetch only on misses, including when stored value is false, zero or empty string.

Edit solution.hpp. Read-only tests show the public interface. Run Tests compiles and runs the repository in the C++ sandbox.
