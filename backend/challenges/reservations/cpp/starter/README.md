# The Oversold Event (C++)

Concurrent seat holds oversell events, mobile retries duplicate bookings, and expiry workers release inventory twice.

The C++ port uses the provided read-only transactional Database simulator, not SQLite. Database.transaction serializes access, commits on success and rolls back on exceptions. Use its State exclusively inside transactions; do not add your own locks or alter support.hpp. Reservation fields mirror the Python rows. reserve_seats validates positive qty/nonempty keys, enforces capacity, atomically inserts and decrements, and replays identical keys only. expire_holds releases held rows at expires_at <= now once. Holds last 600 seconds.

Edit solution.hpp. Read-only tests show the public interface. Run Tests compiles and runs the repository in the C++ sandbox.
