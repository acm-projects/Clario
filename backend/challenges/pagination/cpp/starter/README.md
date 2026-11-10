# The Pagination Bug (C++)

Transaction pages omit records from bulk imports and return unstable ordering.

Transaction.created_at is UTC microseconds since epoch (normalize timezone offsets before constructing records). Sort timestamp DESC then id DESC; cursor must preserve both keys at full microsecond precision. Limit 1..100; malformed cursors throw. Pages never cross account boundaries.

Edit solution.hpp. Read-only tests show the public interface. Run Tests compiles and runs the repository in the C++ sandbox.
