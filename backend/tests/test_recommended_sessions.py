from types import SimpleNamespace
import pytest
from fastapi.testclient import TestClient
from auth import get_current_user
from main import app
from routers import sessions


@pytest.fixture
def isolated_sessions(monkeypatch):
    rows=[]
    class Database:
        def table(self,name):
            assert name=="interview_sessions"
            return self
        def insert(self,body):
            rows.append({"id":"isolated-session",**body})
            return self
        def execute(self):
            return SimpleNamespace(data=[rows[-1]])
    monkeypatch.setattr(sessions,"supabase",Database())
    monkeypatch.setattr(sessions,"get_problem",lambda slug:{"slug":slug,"title":"Two Sum"})
    previous=app.dependency_overrides.copy()
    app.dependency_overrides[get_current_user]=lambda:{"sub":"isolated-audit-user"}
    with TestClient(app) as client:
        yield client,rows
    app.dependency_overrides.clear()
    app.dependency_overrides.update(previous)


@pytest.mark.parametrize("mode",["recommended","practice","full_mock","custom"])
def test_session_modes_persist_exactly_without_changing_slug_or_language(isolated_sessions,mode):
    client,rows=isolated_sessions
    response=client.post("/api/sessions",json={"problem_slug":"two-sum","mode":mode,"language":"java"})
    assert response.status_code==200
    assert response.json()["mode"]==mode
    assert rows==[{"id":"isolated-session","user_id":"isolated-audit-user","problem_slug":"two-sum","mode":mode,"language":"java","status":"in_progress"}]


@pytest.mark.parametrize("body",[
    {"problem_slug":"two-sum","mode":"unknown","language":"java"},
    {"problem_slug":"two-sum","language":"java"},
    {"problem_slug":"two-sum","mode":"recommended","language":"ruby"},
])
def test_invalid_mode_or_language_never_creates_a_session(isolated_sessions,body):
    client,rows=isolated_sessions
    assert client.post("/api/sessions",json=body).status_code in {400,422}
    assert rows==[]
