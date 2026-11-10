from types import SimpleNamespace
from unittest.mock import MagicMock, Mock

import pytest
from fastapi import HTTPException

from routers import sessions, scenarios, code_runner, system_design
from voice import router as voice
import db


def query_rows(rows):
    query = MagicMock()
    for method in ("select", "eq", "ilike", "limit", "order", "insert"):
        getattr(query, method).return_value = query
    query.execute.return_value = SimpleNamespace(data=rows)
    return SimpleNamespace(table=Mock(return_value=query))


def test_company_validation_uses_scenarios_not_leetcode(monkeypatch):
    monkeypatch.setattr(sessions, "supabase", query_rows([{"slug": "stripe-payments"}]))
    lookup = Mock(side_effect=AssertionError("must not load LeetCode for company scenarios"))
    monkeypatch.setattr(sessions, "get_problem", lookup)
    sessions.validate_interview_problem("stripe-payments", "company")
    lookup.assert_not_called()


def test_missing_company_scenario_is_404(monkeypatch):
    monkeypatch.setattr(sessions, "supabase", query_rows([]))
    with pytest.raises(HTTPException) as error:
        sessions.validate_interview_problem("missing", "company")
    assert error.value.status_code == 404


def test_company_session_returns_public_problem_and_preserves_evidence_apis(monkeypatch):
    scenario = {"slug": "stripe-payments", "company": "Stripe", "title": "Payments", "difficulty": "Medium", "prompt": "Process payments", "starter_code": {"python3": "class Solution: pass"}, "hidden_details": ["private"], "code": "saved", "metadata": {}, "event_type": "other"}
    monkeypatch.setattr(sessions, "get_owned_session", lambda *args: {"id": "owned", "mode": "company", "problem_slug": scenario["slug"]})
    monkeypatch.setattr(sessions, "supabase", query_rows([scenario]))
    result = sessions.get_session("owned", {"sub": "user"})
    assert result["problem"]["description_html"] == "Process payments"
    assert "hidden_details" not in result["problem"]
    assert callable(sessions.save_interview_evidence)


def test_database_system_design_context_reaches_dedicated_agent(monkeypatch):
    question = {"slug": "stripe-architecture", "company": "Stripe", "title": "Payments architecture", "difficulty": "Medium", "prompt": "Design payments", "scale": {"requests": 1000}, "strong_signals": ["idempotency"], "curveballs": ["regional outage"]}
    monkeypatch.setattr(db, "supabase", query_rows([question]))
    public = voice.get_system_design_scenario(question["slug"], {"sub": "user"})
    assert "strong_signals" not in public
    client = Mock()
    client.conversational_ai.conversations.get_signed_url.return_value = SimpleNamespace(signed_url="https://example.test/signed")
    monkeypatch.setattr(voice, "get_elevenlabs", lambda: client)
    monkeypatch.setattr(voice, "settings", SimpleNamespace(elevenlabs_system_design_agent_id="design-agent", elevenlabs_agent_id="coding-agent"))
    result = voice.get_system_design_session(question["slug"], {"sub": "user"})
    client.conversational_ai.conversations.get_signed_url.assert_called_once_with(agent_id="design-agent")
    assert result["variables"]["strong_signals"] == "idempotency"
    assert "regional outage" in result["variables"]["problem_description"]
    assert "idempotency" not in result["variables"]["bug_summary"]


def test_company_generation_never_falls_back_to_another_company(monkeypatch):
    monkeypatch.setattr(scenarios, "build_company_scenario", Mock(side_effect=RuntimeError("offline")))
    store = query_rows([])
    monkeypatch.setattr(scenarios, "supabase", store)
    with pytest.raises(HTTPException) as error:
        scenarios.generate_scenario("Stripe")
    assert error.value.status_code == 503
    store.table.return_value.ilike.assert_called_once_with("company", "Stripe")


def test_candidate_execution_keeps_hidden_test_data_private(monkeypatch):
    scenario = {"slug": "stripe", "base_problem_slug": "two-sum", "starter_code": {"python3": "class Solution:\n    def twoSum(self, nums, target):\n        pass"}, "test_cases": [{"input": [[2, 7], 9], "expected": [0, 1]}]}
    monkeypatch.setattr(code_runner, "supabase", query_rows([scenario]))
    monkeypatch.setattr(code_runner, "run_scenario_tests", lambda **kwargs: {"total": 1, "passed": 1, "failed": 0, "all_passed": True, "results": [{"test_number": 1, "passed": True, "status": "Accepted", "expected": [0, 1], "actual": [0, 1]}]})
    result = code_runner.execute_scenario(code_runner.RunRequest(scenario_slug="stripe", solution_code="class Solution: pass"))
    assert result["all_passed"]
    assert "expected" not in result["results"][0]
    assert "actual" not in result["results"][0]
