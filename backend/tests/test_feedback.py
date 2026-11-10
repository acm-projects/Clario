import asyncio
import json
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import NAMESPACE_URL, uuid5

import httpx
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from auth import get_current_user
from gemini_feedback import generate_feedback, validate_feedback
from main import app
from routers import feedback

SESSION_ID = "11111111-1111-4111-8111-111111111111"
USER = {"sub": "test-user"}
CONTENT = {"summary": "The approach handles the example; review empty inputs.", "technical_score": 80, "reasoning_score": 75, "communication_score": 70, "strengths": ["Clear variable names"], "weaknesses": ["Missing empty-input handling"], "recommendations": ["Check input constraints before coding"], "coach_quote": "Start with your plan.", "coach_note": "State the invariant before the loop.", "evidence_limitations": []}
CONTENT["umpire"] = {key: {"stars": None, "summary": "Not enough evidence.", "details": "No recorded explanation for this stage.", "evidence_quotes": []} for key in ("understand", "match", "plan", "implement", "review", "evaluate")}
CONTENT["actions"] = {"fix": ["Check empty inputs.", "Explain the invariant.", "Walk through one example.", "Review duplicate values.", "State complexity."], "keep": ["Clear variable names"]}
SESSION = {"id": SESSION_ID, "user_id": USER["sub"], "status": "completed", "ended_at": "2026-10-19T12:00:00Z", "language": "python3", "problem_slug": "two-sum"}
SAVED = {"id": "saved-report", "session_id": SESSION_ID, "report": CONTENT}


class ValidationTests(unittest.TestCase):
    def test_missing_transcript_forces_unobserved_scores_to_null(self):
        result = validate_feedback(json.dumps(CONTENT), has_code=True, has_problem=True, has_speech=False)
        self.assertEqual(result["technical_score"], 80)
        self.assertIsNone(result["reasoning_score"])
        self.assertIsNone(result["communication_score"])
        self.assertEqual(result["overall_score"], 80)
        self.assertTrue(any("without execution" in item for item in result["evidence_limitations"]))

    def test_no_code_or_problem_means_no_technical_score(self):
        for code, problem in [(False, True), (True, False)]:
            result = validate_feedback(json.dumps(CONTENT), has_code=code, has_problem=problem, has_speech=True)
            self.assertIsNone(result["technical_score"])
            self.assertEqual(result["overall_score"], 72)

    def test_invalid_scores_and_incomplete_reports_are_rejected(self):
        for score in [101, -1, "80", True]:
            with self.assertRaises(ValidationError):
                validate_feedback(json.dumps({**CONTENT, "technical_score": score}), has_code=True, has_problem=True, has_speech=True)
        with self.assertRaises(ValidationError):
            validate_feedback("{}", has_code=True, has_problem=True, has_speech=True)


class ProviderTests(unittest.IsolatedAsyncioTestCase):
    async def test_provider_payload_uses_header_secret_and_validates_json(self):
        def respond(request):
            self.assertEqual(request.headers["x-goog-api-key"], "test-secret")
            self.assertNotIn("test-secret", str(request.url))
            body = json.loads(request.content)
            self.assertEqual(body["generationConfig"]["responseFormat"]["text"]["mimeType"], "APPLICATION_JSON")
            self.assertEqual(body["generationConfig"]["thinkingConfig"], {"thinkingLevel": "low"})
            return httpx.Response(200, json={"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": json.dumps(CONTENT)}]}}]})
        client = httpx.AsyncClient(transport=httpx.MockTransport(respond))
        with patch.dict("os.environ", {"GEMINI_API_KEY": "test-secret", "GEMINI_MODEL": "gemini-3.6-flash"}), patch("gemini_feedback.httpx.AsyncClient", return_value=client):
            report = await generate_feedback({"code": "return 1", "problem": {"title": "Example"}, "candidate_transcript": ""})
        self.assertEqual(report["provider"], "gemini")
        self.assertIsNone(report["communication_score"])

    async def test_rate_limit_does_not_expose_provider_response(self):
        client = httpx.AsyncClient(transport=httpx.MockTransport(lambda request: httpx.Response(429, json={"error": "secret detail"})))
        with patch.dict("os.environ", {"GEMINI_API_KEY": "test-secret"}), patch("gemini_feedback.httpx.AsyncClient", return_value=client):
            with self.assertRaises(HTTPException) as error:
                await generate_feedback({})
        self.assertEqual(error.exception.status_code, 503)
        self.assertNotIn("secret detail", error.exception.detail)

    async def test_provider_overload_explains_retry(self):
        client = httpx.AsyncClient(transport=httpx.MockTransport(lambda request: httpx.Response(503, json={"error": {"status": "UNAVAILABLE"}})))
        with patch.dict("os.environ", {"GEMINI_API_KEY": "test-secret"}), patch("gemini_feedback.httpx.AsyncClient", return_value=client):
            with self.assertRaises(HTTPException) as error:
                await generate_feedback({})
        self.assertEqual(error.exception.status_code, 503)
        self.assertIn("high demand", error.exception.detail)

    async def test_truncated_response_is_not_saved_as_valid_feedback(self):
        client = httpx.AsyncClient(transport=httpx.MockTransport(lambda request: httpx.Response(200, json={"candidates": [{"finishReason": "MAX_TOKENS", "content": {"parts": [{"text": "{}"}]}}]})))
        with patch.dict("os.environ", {"GEMINI_API_KEY": "test-secret"}), patch("gemini_feedback.httpx.AsyncClient", return_value=client):
            with self.assertRaises(HTTPException) as error:
                await generate_feedback({})
        self.assertEqual(error.exception.status_code, 502)

    async def test_missing_key_fails_before_network_request(self):
        with patch.dict("os.environ", {"GEMINI_API_KEY": ""}), patch("gemini_feedback.httpx.AsyncClient") as client:
            with self.assertRaises(HTTPException) as error:
                await generate_feedback({})
            client.assert_not_called()
        self.assertEqual(error.exception.status_code, 503)


class RouteTests(unittest.TestCase):
    def setUp(self):
        app.dependency_overrides[get_current_user] = lambda: USER
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_preview_calls_real_generator_with_fixed_evidence_without_saving(self):
        with patch.dict("os.environ", {"DEV_BYPASS_AUTH": "true"}), patch.object(feedback, "generate_feedback", new_callable=AsyncMock, return_value=CONTENT) as generate, patch.object(feedback.supabase, "table") as table:
            response = self.client.post("/api/feedback/preview/two-sum")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["saved"])
        self.assertTrue(response.json()["synthetic"])
        evidence = generate.call_args.args[0]
        self.assertIn("pass", evidence["code"])
        self.assertIn("not sure", evidence["candidate_transcript"])
        self.assertFalse(evidence["code_was_executed"])
        table.assert_not_called()

    def test_preview_is_unavailable_outside_local_dev_mode(self):
        with patch.dict("os.environ", {"DEV_BYPASS_AUTH": "false"}), patch.object(feedback, "generate_feedback", new_callable=AsyncMock) as generate:
            response = self.client.post("/api/feedback/preview/two-sum")
        self.assertEqual(response.status_code, 404)
        generate.assert_not_called()

    def test_individual_report_returns_owned_saved_report(self):
        with patch.object(feedback, "get_owned_session", return_value=SESSION) as owned, patch.object(feedback, "get_saved_report", return_value=SAVED), patch.object(feedback, "get_stored_problem", return_value={"title": "Two Sum"}), patch.object(feedback, "supabase") as database:
            database.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = [{"code": "return 1"}]
            response = self.client.get("/api/feedback/" + SESSION_ID)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["feedback"], {**SAVED, "report": {**SAVED.get("report", {}), "submitted_code": "return 1"}})
        owned.assert_called_once_with(SESSION_ID, USER["sub"])

    def test_individual_report_denies_other_users_session(self):
        with patch.object(feedback, "get_owned_session", side_effect=HTTPException(404, "Session not found")), patch.object(feedback, "get_saved_report") as saved:
            response = self.client.get("/api/feedback/" + SESSION_ID)
        self.assertEqual(response.status_code, 404)
        saved.assert_not_called()

    def test_other_users_session_is_denied_before_generation(self):
        with patch.object(feedback, "get_owned_session", side_effect=HTTPException(404, "Session not found")), patch.object(feedback, "generate_feedback", new_callable=AsyncMock) as generate:
            response = self.client.post("/api/feedback/" + SESSION_ID)
        self.assertEqual(response.status_code, 404)
        generate.assert_not_called()

    def test_in_progress_session_is_not_graded(self):
        with patch.object(feedback, "get_owned_session", return_value={**SESSION, "status": "in_progress"}), patch.object(feedback, "generate_feedback", new_callable=AsyncMock) as generate:
            response = self.client.post("/api/feedback/" + SESSION_ID)
        self.assertEqual(response.status_code, 409)
        generate.assert_not_called()

    def test_cached_report_does_not_call_gemini(self):
        with patch.object(feedback, "get_owned_session", return_value=SESSION), patch.object(feedback, "get_saved_report", return_value=SAVED), patch.object(feedback, "generate_feedback", new_callable=AsyncMock) as generate:
            response = self.client.post("/api/feedback/" + SESSION_ID)
        self.assertEqual(response.status_code, 200)
        generate.assert_not_called()

    def test_session_without_evidence_is_not_graded(self):
        query = MagicMock()
        for method in ["select", "eq", "order", "limit"]:
            getattr(query, method).return_value = query
        query.execute.return_value = SimpleNamespace(data=[])
        with patch.object(feedback, "get_owned_session", return_value=SESSION), patch.object(feedback, "get_saved_report", return_value=None), patch.object(feedback, "get_stored_problem", return_value=None), patch.object(feedback.supabase, "table", return_value=query), patch.object(feedback, "generate_feedback", new_callable=AsyncMock) as generate:
            response = self.client.post("/api/feedback/" + SESSION_ID)
        self.assertEqual(response.status_code, 422)
        generate.assert_not_called()

    def test_provider_outage_returns_temporary_report_without_saving(self):
        tables = {}
        for name, rows in {"code_snapshots": [{"code": "return 1"}], "transcript_events": [], "session_events": []}.items():
            query = MagicMock()
            for method in ["select", "eq", "order", "limit"]:
                getattr(query, method).return_value = query
            query.execute.return_value = SimpleNamespace(data=rows)
            tables[name] = query
        with patch.object(feedback, "get_owned_session", return_value=SESSION), patch.object(feedback, "get_saved_report", return_value=None), patch.object(feedback, "get_stored_problem", return_value={"title": "Two Sum"}), patch.object(feedback.supabase, "table", side_effect=lambda name: tables[name]) as table, patch.object(feedback, "generate_feedback", new_callable=AsyncMock, side_effect=HTTPException(503, "Provider unavailable")):
            response = self.client.post("/api/feedback/" + SESSION_ID)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["report"]["is_fallback"])
        self.assertEqual(response.json()["overall_score"], 25)
        self.assertEqual(response.json()["report"]["submitted_code"], "return 1")
        self.assertNotIn("feedback_reports", [call.args[0] for call in table.call_args_list])

    def test_history_is_scoped_to_user(self):
        query = MagicMock()
        for method in ["select", "eq", "order", "limit"]:
            getattr(query, method).return_value = query
        query.execute.return_value = SimpleNamespace(data=[])
        with patch.object(feedback.supabase, "table", return_value=query):
            response = self.client.get("/api/feedback")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])
        query.eq.assert_any_call("user_id", USER["sub"])

    def test_valid_evidence_is_saved_with_a_deterministic_id(self):
        tables = {}
        for name, rows in {"code_snapshots": [{"code": "return 1", "language": "python3"}], "transcript_events": [{"speaker": "user", "text": "I will use a hash map."}], "session_events": [], "feedback_reports": []}.items():
            query = MagicMock()
            for method in ["select", "eq", "order", "limit", "upsert"]:
                getattr(query, method).return_value = query
            query.execute.return_value = SimpleNamespace(data=rows)
            tables[name] = query
        report = validate_feedback(json.dumps(CONTENT), has_code=True, has_problem=True, has_speech=True)
        with patch.object(feedback, "get_owned_session", return_value=SESSION), patch.object(feedback, "get_saved_report", side_effect=[None, SAVED]), patch.object(feedback, "get_stored_problem", return_value={"title": "Two Sum"}), patch.object(feedback.supabase, "table", side_effect=lambda name: tables[name]), patch.object(feedback, "generate_feedback", new_callable=AsyncMock, return_value=report) as generate:
            response = self.client.post("/api/feedback/" + SESSION_ID)
        self.assertEqual(response.status_code, 200)
        evidence = generate.call_args.args[0]
        self.assertEqual(evidence["candidate_transcript"], "I will use a hash map.")
        saved = tables["feedback_reports"].upsert.call_args.args[0]
        self.assertEqual(saved["id"], str(uuid5(NAMESPACE_URL, "clario:gemini-feedback:" + SESSION_ID)))


if __name__ == "__main__":
    unittest.main()

class DetailEvidenceTests(unittest.TestCase):
    def test_unverifiable_quotes_and_whitespace_cannot_support_stars(self):
        raw = json.loads(json.dumps(CONTENT))
        raw['umpire']['plan'].update(stars=5, evidence_quotes=['invented plan', '   '])
        result = validate_feedback(json.dumps(raw), has_code=True, has_problem=True, has_speech=True, source_code='return 1', candidate_transcript='um I will use a map, um')
        self.assertEqual(result['umpire']['plan']['stars'], 0)
        self.assertEqual(result['filler_words']['items'], [{'word': 'um', 'count': 2}])

    def test_verified_candidate_quote_keeps_rating_but_code_cannot_prove_plan(self):
        raw = json.loads(json.dumps(CONTENT))
        raw['umpire']['plan'].update(stars=4, evidence_quotes=['I will use a map'])
        result = validate_feedback(json.dumps(raw), has_code=True, has_problem=True, has_speech=True, candidate_transcript='I will use a map')
        self.assertEqual(result['umpire']['plan']['stars'], 4)
        result = validate_feedback(json.dumps(raw), has_code=True, has_problem=True, has_speech=False, source_code='# I will use a map')
        self.assertEqual(result['umpire']['plan']['stars'], 0)
        self.assertFalse(result['filler_words']['available'])

    def test_five_fix_actions_and_integer_stars_are_required(self):
        raw = json.loads(json.dumps(CONTENT))
        raw['actions']['fix'] = ['One action']
        with self.assertRaises(ValidationError):
            validate_feedback(json.dumps(raw), has_code=True, has_problem=True, has_speech=True)
