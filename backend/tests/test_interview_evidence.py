from unittest.mock import Mock, patch
import httpx
import pytest
from pydantic import ValidationError
from communication import CommunicationCapture, summarize_captures
from interview_evidence import InterviewEvidence, persist_evidence
import leetcode
from fastapi.testclient import TestClient
from auth import get_current_user
from main import app
from routers import sessions


CAPTURE = {"capture_id": "11111111-1111-4111-8111-111111111111", "monitored_seconds": 10, "silent_seconds": 3, "longest_pause_seconds": 3,
    "silence_intervals": [{"start_seconds": 2, "end_seconds": 5, "duration_seconds": 3}]}


def test_recorded_silence_timestamps_survive_feedback_aggregation():
    result = summarize_captures([{"event_type": "communication_summary", "metadata": CAPTURE}])
    assert result["silence_intervals"][0]["start_seconds"] == 2
    assert result["silence_intervals"][0]["duration_seconds"] == 3
    assert result["filler_count"] is None


def test_inconsistent_silence_intervals_are_rejected():
    for interval in [{"start_seconds": 5, "end_seconds": 2, "duration_seconds": 3}, {"start_seconds": 2, "end_seconds": 6, "duration_seconds": 3}]:
        with pytest.raises(ValidationError):
            CommunicationCapture.model_validate({**CAPTURE, "silence_intervals": [interval]})


def test_retries_reuse_the_same_evidence_ids():
    database = Mock()
    evidence = InterviewEvidence.model_validate({"transcript": [{"source": "user", "message": "My reasoning"}], "communication": CAPTURE})
    persist_evidence(database, "session-one", evidence)
    first = database.table.return_value.upsert.call_args_list[:]
    database.reset_mock()
    persist_evidence(database, "session-one", evidence)
    assert database.table.return_value.upsert.call_args_list == first


def test_two_sum_is_available_when_upstream_and_cache_fail():
    with patch.object(leetcode, "fetch_live_problem", side_effect=httpx.HTTPError("Rate limited")), patch.object(leetcode, "_db_problem", return_value=None):
        problem = leetcode.get_problem("two-sum")
    assert problem["title"] == "Two Sum"
    assert problem["starter_code"]["python3"] and problem["starter_code"]["java"]
    assert problem["example_testcases"]
    from piston.testcases import build_test_cases
    assert len(build_test_cases(problem)) == 3


def test_evidence_endpoint_requires_an_owned_active_session(monkeypatch):
    app.dependency_overrides[get_current_user] = lambda: {"sub": "owner"}
    persist = Mock()
    monkeypatch.setattr(sessions, "persist_evidence", persist)
    owned = Mock(return_value={"status": "in_progress"})
    monkeypatch.setattr(sessions, "get_owned_session", owned)
    try:
        client = TestClient(app)
        assert client.post("/api/sessions/session-one/evidence", json={"communication": CAPTURE}).status_code == 200
        owned.assert_called_with("session-one", "owner")
        persist.assert_called_once()
        owned.return_value = {"status": "completed"}
        assert client.post("/api/sessions/session-one/evidence", json={"communication": CAPTURE}).status_code == 409
        assert persist.call_count == 1
    finally:
        app.dependency_overrides.clear()


def test_transcript_receipt_times_and_duration_are_saved_separately():
    database = Mock()
    evidence = InterviewEvidence.model_validate({"transcript": [{"source": "user", "message": "Use a map", "received_at": "2026-11-02T18:00:00Z", "elapsed_seconds": 2.5}], "duration_seconds": 65})
    persist_evidence(database, "session-one", evidence)
    writes = database.table.return_value.upsert.call_args_list
    assert writes[0].args[0][0]["text"] == "Use a map"
    timing = writes[1].args[0][0]
    assert timing["event_type"] == "transcript_timing"
    assert timing["metadata"]["elapsed_seconds"] == 2.5
    assert timing["metadata"]["received_at"] == "2026-11-02T18:00:00+00:00"
    assert writes[2].args[0]["metadata"]["duration_seconds"] == 65


def test_transcript_read_checks_ownership_before_querying(monkeypatch):
    from fastapi import HTTPException
    app.dependency_overrides[get_current_user] = lambda: {"sub": "owner"}
    owned = Mock(side_effect=HTTPException(404, "Session not found"))
    monkeypatch.setattr(sessions, "get_owned_session", owned)
    try:
        response = TestClient(app).get("/api/sessions/other-session/transcript")
        assert response.status_code == 404
        owned.assert_called_once_with("other-session", "owner")
    finally:
        app.dependency_overrides.clear()
