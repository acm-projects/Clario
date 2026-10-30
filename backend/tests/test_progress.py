from unittest.mock import Mock
from fastapi.testclient import TestClient
from auth import get_current_user
from main import app
from routers import progress


def test_summary_keeps_missing_scores_and_unobserved_steps_unknown():
    history = [
        {"overall_score": 40, "technical_score": 60, "problem_solving_score": 20, "communication_score": None},
        {"overall_score": None, "technical_score": None, "problem_solving_score": None, "communication_score": None},
        {"overall_score": 80, "technical_score": 80, "problem_solving_score": 70, "communication_score": 90},
    ]
    events = [
        {"session_id": "one", "event_type": "step_skipped", "metadata": {"step": "plan"}},
        {"session_id": "one", "event_type": "step_completed", "metadata": {"step": "plan"}},
        {"session_id": "two", "event_type": "step_skipped", "metadata": {"step": "plan"}},
    ]
    result = progress.summarize(history, events)
    assert result["total_sessions"] == 3
    assert result["average_overall"] == 60
    assert result["average_by_category"]["communication"] == 90
    assert result["change_vs_first"] == 40
    assert result["umpire_miss_rate"]["plan"] == 0.5
    assert result["umpire_miss_rate"]["review"] is None


def test_empty_summary_does_not_invent_scores_or_habits():
    result = progress.summarize([], [])
    assert result["total_sessions"] == 0
    assert result["latest_overall"] is None and result["average_overall"] is None
    assert all(value is None for value in result["umpire_miss_rate"].values())


def test_history_reads_only_owned_completed_sessions(monkeypatch):
    query = Mock()
    for method in ("select", "eq", "order", "range"):
        getattr(query, method).return_value = query
    query.execute.return_value.data = []
    monkeypatch.setattr(progress.supabase, "table", lambda name: query)
    app.dependency_overrides[get_current_user] = lambda: {"sub": "progress-owner"}
    try:
        response = TestClient(app).get("/api/progress/history")
        assert response.status_code == 200 and response.json() == []
        query.eq.assert_any_call("user_id", "progress-owner")
        query.eq.assert_any_call("status", "completed")
    finally:
        app.dependency_overrides.clear()
