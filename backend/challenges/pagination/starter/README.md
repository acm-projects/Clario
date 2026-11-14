# The Pagination Bug

Transaction pages omit records from bulk imports and return unstable ordering.

## Contract
list_transactions takes a list of dicts with integer id, account_id, and aware created_at. Return data, has_more, next_cursor. Sort created_at DESC then id DESC, preserving microseconds and UTC instants. Cursors must preserve both keys. Never skip or duplicate account records. Limits are integers 1–100; malformed cursors raise ValueError. Cursor helpers may change to support composite keys.

These are synthetic practice scenarios, not actual company questions.
Use Run Tests to reproduce the failures. Preserve public interfaces; edit implementation files, not tests.
