# The Lossy Job Worker

Webhook jobs disappear after crashes, batches return early, and retry settings leak between deliveries.

## Contract
Node/CommonJS. withRetry(fn, opts) makes at most opts.retries total attempts (default 3), with exponential backoff from opts.delay milliseconds (default 0 for this exercise). Never mutate options. Retry network errors (no status), 429 and 5xx; immediately rethrow other HTTP errors. Exhaustion rethrows the last error. processBatch(jobs, queue, deliverWebhook, concurrency=2) awaits every job with a concurrency cap and preserves input order. Success yields {id,res}; exhausted/permanent delivery failure must be durably dead-lettered before acknowledgment and yields {id,error:message}. A failed dead-letter write or acknowledgment rejects the batch without treating the job as delivered. queue supplies async ack(id) and deadLetter(job,error). Delivery must be idempotent in a real at-least-once system.

These are synthetic practice scenarios, not actual company questions.
Use Run Tests to reproduce the failures. Preserve public interfaces; edit implementation files, not tests.
