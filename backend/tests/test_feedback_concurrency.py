import asyncio
import unittest
from unittest.mock import AsyncMock
from fastapi import HTTPException
from routers.feedback import singleflight


class FeedbackConcurrencyTests(unittest.IsolatedAsyncioTestCase):
    async def test_one_stalled_interview_does_not_block_another(self):
        started, release = asyncio.Event(), asyncio.Event()
        async def slow():
            started.set()
            await release.wait()
            return {"summary": "first"}
        first = asyncio.create_task(singleflight("slow-interview", slow))
        await started.wait()
        try:
            result = await asyncio.wait_for(singleflight("other-interview", AsyncMock(return_value={"summary": "second"})), timeout=1)
            self.assertEqual(result["summary"], "second")
        finally:
            release.set()
            await first

    async def test_duplicate_requests_share_errors_and_can_retry(self):
        started, release = asyncio.Event(), asyncio.Event()
        calls = 0
        async def fail():
            nonlocal calls
            calls += 1
            started.set()
            await release.wait()
            raise HTTPException(504, "Timed out")
        first = asyncio.create_task(singleflight("same-interview", fail))
        await started.wait()
        duplicate = asyncio.create_task(singleflight("same-interview", fail))
        await asyncio.sleep(0)
        release.set()
        failures = await asyncio.gather(first, duplicate, return_exceptions=True)
        self.assertEqual(calls, 1)
        self.assertTrue(all(isinstance(error, HTTPException) for error in failures))
        result = await singleflight("same-interview", AsyncMock(return_value={"summary": "retried"}))
        self.assertEqual(result["summary"], "retried")

    async def test_navigation_does_not_cancel_shared_generation(self):
        started, release = asyncio.Event(), asyncio.Event()
        async def generate():
            started.set()
            await release.wait()
            return {"summary": "saved"}
        first = asyncio.create_task(singleflight("cancelled-client", generate))
        await started.wait()
        first.cancel()
        with self.assertRaises(asyncio.CancelledError):
            await first
        duplicate_factory = AsyncMock()
        second = asyncio.create_task(singleflight("cancelled-client", duplicate_factory))
        await asyncio.sleep(0)
        release.set()
        self.assertEqual((await second)["summary"], "saved")
        duplicate_factory.assert_not_called()
