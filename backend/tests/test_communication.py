import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from pydantic import ValidationError
from auth import get_current_user
from communication import CommunicationCapture, summarize_captures
from main import app
from routers import sessions, feedback

ID = "11111111-1111-4111-8111-111111111111"
BASE = {"capture_id": ID, "monitored_seconds": 20, "silent_seconds": 5, "longest_pause_seconds": 3, "transcript": "Um I mean use a hash map. Thumb number summary.", "transcription_available": True}
def event(data):
    return {"event_type": "communication_summary", "metadata": data}

class CommunicationTests(unittest.TestCase):
    def test_snapshots_do_not_double_count_and_fillers_have_word_boundaries(self):
        result = summarize_captures([event({**BASE, "monitored_seconds": 10}), event(BASE)])
        self.assertEqual(result["monitored_seconds"], 20)
        self.assertEqual(result["silent_seconds"], 5)
        self.assertEqual(result["filler_count"], 2)
        self.assertEqual(result["fillers"], {"um": 1, "i mean": 1})
        self.assertEqual(result["silence_percent"], 25)

    def test_invalid_durations_and_nonfinite_values_are_rejected(self):
        for change in [{"silent_seconds": 21}, {"longest_pause_seconds": 6}, {"monitored_seconds": float("nan")}, {"monitored_seconds": float("inf")}]:
            with self.assertRaises(ValidationError): CommunicationCapture.model_validate({**BASE, **change})

    def test_missing_transcript_never_claims_zero_fillers_or_pace(self):
        result = summarize_captures([event({**BASE, "transcript": "", "transcription_available": False})])
        self.assertIsNone(result["filler_count"])
        self.assertIsNone(result["words_per_speaking_minute"])
        self.assertIsNone(summarize_captures([]))

    def test_multiple_captures_combine_and_corrupt_events_are_ignored(self):
        result = summarize_captures([event(BASE), event({**BASE, "capture_id": "22222222-2222-4222-8222-222222222222"}), event({})])
        self.assertEqual(result["monitored_seconds"], 40)
        self.assertEqual(result["filler_count"], 4)

    def test_save_requires_owned_active_session(self):
        app.dependency_overrides[get_current_user] = lambda: {"sub": "test-user"}
        try:
            client = TestClient(app)
            query = MagicMock()
            query.insert.return_value = query
            query.execute.return_value = SimpleNamespace(data=[])
            with patch.object(sessions, "get_owned_session", return_value={"status": "in_progress"}) as owned, patch.object(sessions.supabase, "table", return_value=query):
                response = client.post("/api/sessions/" + ID + "/communication", json=BASE)
                self.assertEqual(response.status_code, 200)
                owned.assert_called_once_with(ID, "test-user")
                self.assertEqual(query.insert.call_args.args[0]["event_type"], "communication_summary")
            with patch.object(sessions, "get_owned_session", return_value={"status": "completed"}), patch.object(sessions.supabase, "table") as table:
                self.assertEqual(client.post("/api/sessions/" + ID + "/communication", json=BASE).status_code, 409)
                table.assert_not_called()
        finally:
            app.dependency_overrides.clear()


class FeedbackCommunicationTests(unittest.TestCase):
    def test_transcript_and_metrics_reach_feedback_without_duplicate_snapshots(self):
        app.dependency_overrides[get_current_user] = lambda: {"sub": "test-user"}
        try:
            tables = {}
            rows_by_table = {"code_snapshots": [], "transcript_events": [], "session_events": [event(BASE)], "feedback_reports": []}
            for name, rows in rows_by_table.items():
                query = MagicMock()
                for method in ["select", "eq", "order", "limit", "upsert"]:
                    getattr(query, method).return_value = query
                query.execute.return_value = SimpleNamespace(data=rows)
                tables[name] = query
            report = {key: None for key in ["technical_score", "reasoning_score", "communication_score", "overall_score"]}
            report.update(strengths=[], weaknesses=[], recommendations=[])
            with patch.object(feedback, "get_owned_session", return_value={"status":"completed", "ended_at":"2026-10-20", "language":"python3"}), patch.object(feedback, "get_saved_report", side_effect=[None, {"id":"saved"}]), patch.object(feedback, "get_stored_problem", return_value=None), patch.object(feedback.supabase, "table", side_effect=lambda name: tables[name]), patch.object(feedback, "generate_feedback", new_callable=AsyncMock, return_value=report) as generate:
                response = TestClient(app).post("/api/feedback/" + ID)
            self.assertEqual(response.status_code, 200)
            evidence = generate.call_args.args[0]
            self.assertEqual(evidence["candidate_transcript"], BASE["transcript"])
            self.assertEqual(evidence["communication_metrics"]["filler_count"], 2)
            self.assertEqual(evidence["session_events"], [])
            saved = tables["feedback_reports"].upsert.call_args.args[0]
            self.assertEqual(saved["report"]["communication_metrics"]["silent_seconds"], 5)
        finally:
            app.dependency_overrides.clear()
