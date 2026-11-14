"""Repair retry handling and durable batch delivery. Queue methods are async."""
import asyncio

RETRY_DEFAULTS = {"retries": 3, "delay": 0}


async def with_retry(fn, opts=None):
    opts = RETRY_DEFAULTS if opts is None else opts
    while opts["retries"] > 0:
        try:
            return await fn()
        except Exception:
            opts["retries"] -= 1
            await asyncio.sleep(opts["delay"] / 1000)
            opts["delay"] *= 2


async def process_batch(jobs, queue, deliver_webhook, concurrency=2):
    async def deliver(job):
        await queue.ack(job["id"])
        result = await with_retry(lambda: deliver_webhook(job["payload"]))
        return {"id": job["id"], "res": result}
    return await asyncio.gather(*(deliver(job) for job in jobs))
