# The Oversold Event

Concurrent seat holds oversell events, mobile retries duplicate bookings, and expiry workers release inventory twice.

## Contract
Use the provided SQLite Database. reserve_seats returns a reservation dict; exactly the available number of concurrent requests may succeed, with SoldOut otherwise. Hold expiry is now+600 seconds. Positive integer quantities and nonempty keys are required. Replaying a key with identical event/user/qty returns the same reservation; conflicting reuse raises ValueError. Inventory decrement and reservation insertion must be one database transaction with rollback on failure. expire_holds releases held reservations at expires_at <= now exactly once, even with concurrent workers. Do not replace database transactions with process-local locks.

These are synthetic practice scenarios, not actual company questions.
Use Run Tests to reproduce the failures. Preserve public interfaces; edit implementation files, not tests.
