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


def test_duration_prefers_observed_room_time_and_never_uses_finish_only_session_dates():
    session = {"id": "one", "started_at": "2026-11-02T18:00:00Z", "ended_at": "2026-11-02T18:10:30Z"}
    assert progress.recorded_duration(session, []) == 630
    session["problem_slug"] = "repo-debugging:example"
    assert progress.recorded_duration(session, []) is None
    events = [{"session_id": "other", "event_type": "session_duration", "metadata": {"duration_seconds": 99}}, {"session_id": "one", "event_type": "session_duration", "metadata": {"duration_seconds": 615}}]
    assert progress.recorded_duration(session, events) == 615


def test_latest_and_first_refer_to_actual_interviews_not_other_scored_sessions():
    row = lambda score: {"overall_score": score, "technical_score": score, "problem_solving_score": score, "communication_score": score}
    result = progress.summarize([row(10), row(50), row(None)], [])
    assert result["total_sessions"] == 3 and result["average_overall"] == 30
    assert result["latest_overall"] is None and result["change_vs_first"] is None
    result = progress.summarize([row(None), row(20), row(40)], [])
    assert result["latest_overall"] == 40 and result["change_vs_first"] is None
    result = progress.summarize([row(0), row(100)], [])
    assert result["change_vs_first"] == 100


def test_invalid_scores_do_not_become_stats_or_chart_values():
    row = lambda score: {"overall_score": score, "technical_score": score, "problem_solving_score": score, "communication_score": score}
    result = progress.summarize([row(True), row(float("nan")), row(101), row(-1), row("75")], [])
    assert result["average_overall"] is None
    assert result["latest_overall"] is None
    assert all(value is None for value in result["average_by_category"].values())


def test_history_metadata_summary_and_status_come_from_saved_records(monkeypatch):
    sessions = [
        {"id": "first", "problem_slug": "two-sum", "language": "python3", "mode": "custom", "started_at": "2026-11-01T12:00:00Z", "ended_at": "2026-11-01T12:10:00Z"},
        {"id": "second", "problem_slug": "repo-debugging:shopping-cart-01", "language": "cpp", "mode": "practice", "started_at": "2026-11-02T12:00:00Z", "ended_at": "2026-11-02T12:00:01Z"},
        {"id": "third", "problem_slug": "deleted", "language": "python3", "mode": "custom", "started_at": "2026-11-03T12:00:00Z", "ended_at": "2026-11-03T12:03:00Z"},
    ]
    reports = [
        {"id": "newest", "session_id": "first", "overall_score": 0, "technical_score": 101, "reasoning_score": True, "communication_score": 60, "report": {"summary": "Saved feedback summary."}},
        {"id": "older", "session_id": "first", "overall_score": 90, "report": {"summary": "Old summary."}},
        {"id": "last", "session_id": "third", "overall_score": 15, "report": {}},
        {"id": "foreign", "session_id": "someone-else", "overall_score": 100, "report": {}},
    ]
    queries = {}
    def table(name):
        query = Mock()
        query.table_name = name
        for method in ("select", "eq", "in_", "order"):
            getattr(query, method).return_value = query
        queries[name] = query
        return query
    monkeypatch.setattr(progress.supabase, "table", table)
    monkeypatch.setattr(progress, "all_rows", lambda query: {"interview_sessions": sessions, "feedback_reports": reports, "session_events": []}[query.table_name])
    def problem(session):
        if session["id"] == "first":
            return {"title": "Two Sum", "difficulty": "Easy", "topics": ["Array", " Hash Table ", "Array"]}
        if session["id"] == "second":
            assert session["language"] == "cpp"
            return {"title": "The Cart That Charges the Wrong Amount", "difficulty": "medium", "topics": None}
        return None
    monkeypatch.setattr(progress, "get_stored_problem", problem)
    result = progress.overview(user={"sub": "owner"})
    rows, summary = result["history"], result["summary"]
    assert rows[0]["topics"] == ["Array", "Hash Table"]
    assert rows[0]["feedback_summary"] == "Saved feedback summary."
    assert rows[0]["feedback_id"] == "newest" and rows[0]["feedback_status"] == "reviewed"
    assert rows[0]["overall_score"] == 0 and rows[0]["technical_score"] is None
    assert rows[1]["difficulty"] == "Medium" and rows[1]["mode"] == "repo_debugging"
    assert rows[1]["topics"] == [] and rows[1]["feedback_status"] == "pending"
    assert rows[1]["duration_seconds"] is None
    assert rows[2]["problem_title"] is None and rows[2]["feedback_summary"] is None
    assert summary["total_sessions"] == 3 and summary["average_overall"] == 7.5
    assert summary["latest_overall"] == 15 and summary["change_vs_first"] == 15
    assert summary["latest_session_id"] == "third"
    queries["interview_sessions"].eq.assert_any_call("user_id", "owner")
    queries["interview_sessions"].eq.assert_any_call("status", "completed")
    queries["feedback_reports"].in_.assert_called_once_with("session_id", ["first", "second", "third"])


def test_overview_uses_one_owned_history_read_for_cards_and_rows(monkeypatch):
    read = Mock(return_value=([], {}, []))
    monkeypatch.setattr(progress, "progress_rows", read)
    app.dependency_overrides[get_current_user] = lambda: {"sub": "overview-owner"}
    try:
        result = TestClient(app).get("/api/progress")
        assert result.status_code == 200
        assert result.json()["history"] == []
        assert result.json()["summary"]["total_sessions"] == 0
        read.assert_called_once_with("overview-owner")
    finally:
        app.dependency_overrides.clear()


def test_repo_history_metadata_is_synced_from_the_catalog_in_both_languages():
    from services import repo_challenge_service as service
    from routers.feedback import get_stored_problem
    for identifier in service.catalog():
        for language in ("python", "cpp"):
            actual = service.detail(identifier, language)
            stored = get_stored_problem({"problem_slug": "repo-debugging:" + identifier, "language": "python3" if language == "python" else language})
            assert stored["title"] == actual["title"]
            assert stored["difficulty"] == actual["difficulty"]
            assert stored["topics"] == actual["topics"] and stored["topics"]
