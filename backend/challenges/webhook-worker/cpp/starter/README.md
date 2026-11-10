# The Lossy Job Worker (C++)

Webhook jobs disappear after crashes, batches return early, and retry settings leak between deliveries.

withRetry uses DeliveryError.status (0 = network error) and immutable RetryOptions. Retry only 0, 429, and 5xx; retries is total attempts, delay is milliseconds with exponential backoff. processBatch uses futures/threads, waits for all workers, caps concurrency and preserves input order. Queue callbacks must be thread-safe. Dead-letter failed deliveries durably before ack; dead-letter/ack failure rejects the batch. Return JobResult with res or error. Do not mutate job/options inputs.

Edit solution.hpp. Read-only tests show the public interface. Run Tests compiles and runs the repository in the C++ sandbox.
