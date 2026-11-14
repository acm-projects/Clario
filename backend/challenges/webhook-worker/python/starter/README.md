# The Lossy Job Worker (Python)

Async Python: with_retry(fn, opts=None) retries network errors (no status), 429 and 5xx only, at most retries total attempts (default 3), with exponential delay in milliseconds (default 0). Never mutate options or defaults; exhaustion rethrows. process_batch(jobs, queue, deliver_webhook, concurrency=2) awaits all jobs, caps concurrency, preserves input order, and returns {id,res} or {id,error}. Queue supplies async ack(id) and dead_letter(job,error). Dead-letter delivery failures durably before ack. Dead-letter/ack errors reject the batch.

Edit processor.py. Use only the standard library. Tests are read-only.
