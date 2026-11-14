"""Trusted repair fixture for the async Python worker exercise."""
import asyncio

RETRY_DEFAULTS = {"retries": 3, "delay": 0}


async def with_retry(fn, opts=None):
    options = {**RETRY_DEFAULTS, **(opts or {})}
    attempts, delay = options["retries"], options["delay"]
    if type(attempts) is not int or attempts < 1:
        raise ValueError("retries must be positive")
    for attempt in range(attempts):
        try:
            return await fn()
        except Exception as error:
            status = getattr(error, "status", None)
            retryable = status is None or status == 429 or 500 <= status <= 599
            if not retryable or attempt + 1 == attempts:
                raise
            await asyncio.sleep(delay * 2**attempt / 1000)


async def process_batch(jobs, queue, deliver_webhook, concurrency=2):
    if type(concurrency) is not int or concurrency < 1:
        raise ValueError("concurrency must be positive")
    semaphore = asyncio.Semaphore(concurrency)
    async def deliver(job):
        async with semaphore:
            try:
                result = await with_retry(lambda: deliver_webhook(job["payload"]))
            except Exception as error:
                await queue.dead_letter(job, str(error))
                row = {"id": job["id"], "error": str(error)}
            else:
                row = {"id": job["id"], "res": result}
            await queue.ack(job["id"])
            return row
    rows = await asyncio.gather(*(deliver(job) for job in jobs), return_exceptions=True)
    for row in rows:
        if isinstance(row, BaseException):
            raise row
    return rows
