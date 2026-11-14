# The Event Feed That Keeps Stale Updates (C++)

Replayed messages replace newer event data, and event order changes when the same batch is imported twice.

latest_events(rows) selects the greatest version per event ID; equal versions keep the first record. Output is sorted by event ID. Reject empty IDs or negative versions, never mutate input. Python rows are dicts with id/version/value. C++ Event has string id, int version, string value.

Edit solution.hpp. Read-only tests show the public interface. Run Tests compiles and runs the repository in the C++ sandbox.
