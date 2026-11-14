import asyncio
import unittest
from processor import with_retry, process_batch, RETRY_DEFAULTS


class DeliveryError(Exception):
    def __init__(self, status=None):
        super().__init__("delivery failed")
        self.status = status


class Queue:
    def __init__(self):
        self.events = []
        self.fail_dead = self.fail_ack = False

    async def ack(self, identifier):
        if self.fail_ack:
            raise RuntimeError("ack failed")
        self.events.append(("ack", identifier))

    async def dead_letter(self, job, error):
        if self.fail_dead:
            raise RuntimeError("storage failed")
        self.events.append(("dead", job["id"]))


class Tests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        RETRY_DEFAULTS.update(retries=3, delay=0)

    async def test_ack_after_delivery(self):
        queue = Queue()
        async def deliver(payload):
            self.assertEqual(queue.events, [])
            return payload
        await process_batch([{"id": 1, "payload": "ok"}], queue, deliver)
        self.assertEqual(queue.events, [("ack", 1)])

    async def test_batch_waits(self):
        async def deliver(payload):
            await asyncio.sleep(0.01 if payload == "first" else 0)
            return payload
        result = await process_batch([{"id": i, "payload": p} for i, p in enumerate(["first", "second"])], Queue(), deliver)
        self.assertEqual([r["res"] for r in result], ["first", "second"])

    async def test_concurrency_cap(self):
        active = peak = 0
        async def deliver(payload):
            nonlocal active, peak
            active += 1
            peak = max(active, peak)
            await asyncio.sleep(0.01)
            active -= 1
            return payload
        await process_batch([{"id": i, "payload": i} for i in range(8)], Queue(), deliver, 2)
        self.assertLessEqual(peak, 2)
        self.assertEqual(active, 0)

    async def test_custom_options_unchanged(self):
        opts = {"retries": 2, "delay": 1}
        calls = 0
        async def deliver():
            nonlocal calls
            calls += 1
            if calls == 1:
                raise DeliveryError(500)
            return "ok"
        self.assertEqual(await with_retry(deliver, opts), "ok")
        self.assertEqual(opts, {"retries": 2, "delay": 1})

    async def test_dead_letter_before_ack(self):
        queue = Queue()
        async def deliver(payload):
            raise DeliveryError(400)
        rows = await process_batch([{"id": 1, "payload": "x"}], queue, deliver)
        self.assertEqual(queue.events, [("dead", 1), ("ack", 1)])
        self.assertEqual(rows, [{"id": 1, "error": "delivery failed"}])

    async def test_dead_letter_failure_unacked(self):
        queue = Queue()
        queue.fail_dead = True
        async def fail(payload):
            raise DeliveryError(400)
        with self.assertRaises(RuntimeError):
            await process_batch([{"id": 1, "payload": "x"}], queue, fail)
        self.assertEqual(queue.events, [])
        queue.fail_ack = True
        async def succeed(payload):
            return payload
        with self.assertRaises(RuntimeError):
            await process_batch([{"id": 1, "payload": "x"}], queue, succeed)

    async def test_retry_defaults_immutable(self):
        for _ in range(2):
            calls = 0
            async def deliver():
                nonlocal calls
                calls += 1
                if calls < 3:
                    raise DeliveryError()
                return "ok"
            self.assertEqual(await with_retry(deliver), "ok")
            self.assertEqual(calls, 3)
        self.assertEqual(RETRY_DEFAULTS, {"retries": 3, "delay": 0})

    async def test_retry_policy(self):
        for status, attempts in [(None, 3), (429, 3), (500, 3), (400, 1)]:
            calls = 0
            async def fail():
                nonlocal calls
                calls += 1
                raise DeliveryError(status)
            with self.assertRaises(DeliveryError):
                await with_retry(fail)
            self.assertEqual(calls, attempts)
