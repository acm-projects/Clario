from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from auth import get_current_user
from main import app
from services import repo_challenge_service as service


@pytest.fixture
def client():
    app.dependency_overrides[get_current_user] = lambda: {"sub": "owner"}
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def test_repository_context_comes_from_public_challenge_only():
    from routers.feedback import get_stored_problem
    problem = get_stored_problem({"problem_slug": "repo-debugging:shopping-cart-01"})
    assert problem["title"] == service.detail("shopping-cart-01")["title"]
    assert "bugs" not in problem and "files" not in problem
    assert get_stored_problem({"problem_slug": "repo-debugging:missing"}) is None


def test_repository_evidence_is_saved_before_session_completion(monkeypatch):
    import db
    database = Mock()
    operations = []
    def table(name):
        query = Mock()
        def insert(payload):
            operations.append((name, "insert", payload))
            return query
        def update(payload):
            operations.append((name, "update", payload))
            return query
        query.insert.side_effect = insert
        query.upsert.side_effect = lambda payload, **kwargs: insert(payload)
        query.update.side_effect = update
        query.eq.return_value = query
        query.execute.return_value.data = [{"id": "saved"}]
        return query
    database.table.side_effect = table
    monkeypatch.setattr(db, "supabase", database)
    turn = {"source": "user", "message": "I checked the calculation."}
    saved = service.save_submission("owner", "shopping-cart-01", {"cart.py": "candidate code"}, {"transcript": [turn], "passed": 1})
    assert saved["saved"]
    assert operations[0][0:2] == ("interview_sessions", "insert")
    assert operations[-1][0:2] == ("interview_sessions", "update")
    assert operations[-1][2]["status"] == "completed"
    assert operations[1][2]["code"] == "File: cart.py\ncandidate code"
    assert operations[2][0] == "transcript_events"
    assert operations[2][2][0]["text"] == turn["message"]
    assert not any(name == "repo_debug_submissions" for name, _, _ in operations)


def test_end_interview_persists_evidence_without_executing_code(client, monkeypatch):
    evaluate = AsyncMock(side_effect=AssertionError("Ending must not run tests"))
    monkeypatch.setattr(service, "evaluate", evaluate)
    saved = Mock(return_value={"saved": True, "submission_id": str(uuid4()), "message": "Saved"})
    monkeypatch.setattr(service, "save_submission", saved)
    turn = {"source": "user", "message": "I have not fixed it yet."}
    files = {file["path"]: file["content"] for file in service.detail("shopping-cart-01")["files"] if not file["readOnly"]}
    response = client.post("/api/repo-challenges/shopping-cart-01/finish", json={"files": files, "transcript": [turn]})
    assert response.status_code == 200 and response.json()["saved"]
    assert saved.call_args.args[3]["transcript"] == [turn]
    evaluate.assert_not_awaited()
