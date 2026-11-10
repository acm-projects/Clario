import unittest
from unittest.mock import AsyncMock
from fastapi import HTTPException
from feedback_fallback import review_with_fallback


class FallbackTests(unittest.IsolatedAsyncioTestCase):
    async def test_provider_errors_return_labeled_placeholders_and_real_saved_evidence(self):
        for status in (502, 503, 504):
            report = await review_with_fallback({"code": "return 3", "candidate_transcript": "um check the input"}, AsyncMock(side_effect=HTTPException(status, "private provider detail")))
            self.assertTrue(report["is_fallback"])
            self.assertEqual(report["overall_score"], 25)
            self.assertEqual(report["submitted_code"], "return 3")
            self.assertEqual(report["filler_words"]["items"], [{"word": "um", "count": 1}])
            self.assertTrue(all(stage["stars"] is None for stage in report["umpire"].values()))
            self.assertNotIn("private provider detail", str(report))

    async def test_non_provider_errors_still_raise(self):
        with self.assertRaises(HTTPException):
            await review_with_fallback({}, AsyncMock(side_effect=HTTPException(422, "Missing evidence")))

    async def test_successful_reports_are_unchanged(self):
        report = {"provider": "gemini"}
        self.assertIs(await review_with_fallback({}, AsyncMock(return_value=report)), report)
