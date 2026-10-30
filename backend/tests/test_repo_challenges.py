import asyncio
import json
import os
from unittest.mock import Mock
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from auth import get_current_user
from main import app
from services import repo_challenge_service as service
from piston.service import PistonServiceError

CART = "shopping-cart-01"
LOGIN = "login-debug-01"


def starter(identifier):
    return {file["path"]: file["content"] for file in service.detail(identifier)["files"] if not file["readOnly"]}


def fixed(identifier):
    files = starter(identifier)
    if identifier == CART:
        from pathlib import Path
        solutions = json.loads((Path(__file__).parent / "fixtures" / "repo_solutions.json").read_text())
        files.update(solutions[CART])
    else:
        files["main.py"] = "from auth import authenticate\ndef login(username, password):\n    return authenticate(username, password)\n"
        files["auth.py"] = """from users import USERS
def authenticate(username, password):
    if not isinstance(username, str) or not isinstance(password, str) or not username.strip() or not password:
        return False
    user = USERS.get(username.strip().lower())
    return bool(user and user['active'] and user['password'] == password)
"""
    return files


@pytest.mark.parametrize("identifier,initial_passes", [(LOGIN, 2)])
def test_trusted_exercise_fixtures_broken_and_repaired(identifier, initial_passes, tmp_path):
    """Execute only checked-in exercise fixtures, never candidate submissions."""
    import subprocess
    import sys

    folder, manifest = service.load(identifier)
    public = service.detail(identifier)
    assert 3 <= len(public["files"]) <= 6
    assert sum(len(file["content"].splitlines()) for file in public["files"]) < 300
    assert 3 <= len(manifest["bugs"]) <= 4
    assert (folder / "starter" / manifest["testFile"]).read_text() == (folder / "tests" / manifest["testFile"]).read_text()
    for bug in manifest["bugs"]:
        source = (folder / "starter" / bug["file"]).read_text().splitlines()
        assert 1 <= bug["line"] <= len(source)

    for repaired in (False, True):
        files = {file["path"]: file["content"] for file in public["files"]}
        if repaired:
            files.update(fixed(identifier))
        files[service.TEST_NAME] = (folder / "tests" / manifest["testFile"]).read_text()
        files[service.RUNNER_NAME] = (service.CHALLENGES / "runner.py").read_text()
        for name, content in files.items():
            (tmp_path / name).write_text(content, encoding="utf-8")
        run = subprocess.run([sys.executable, service.RUNNER_NAME], cwd=tmp_path,
                             capture_output=True, text=True, timeout=10)
        assert run.returncode == 0, run.stderr
        rows = json.loads(run.stdout.split(service.MARKER)[1])
        assert len(rows) == len(manifest["testNames"])
        assert sum(row["passed"] for row in rows) == (len(rows) if repaired else initial_passes)


@pytest.fixture
def client():
    app.dependency_overrides[get_current_user] = lambda: {"sub": "test-owner"}
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.pop(get_current_user, None)


def test_catalog_and_private_files(client):
    response = client.get("/api/repo-challenges")
    assert response.status_code == 200
    assert {row["id"] for row in response.json()} == {CART, LOGIN, "transaction-pagination-01", "seat-reservations-01", "ttl-lru-cache-01", "webhook-worker-01", "daily-revenue-01"}
    for identifier in {row["id"] for row in response.json()}:
        response = client.get(f"/api/repo-challenges/{identifier}")
        assert response.status_code == 200
        data = response.json()
        assert data["entrypoint"] in {file["path"] for file in data["files"]}
        assert "testNames" not in data and "testFile" not in data
        assert any(file["path"].startswith("test_") and file["readOnly"] for file in data["files"])
        assert "bugs" not in data
        for bug in service.load(identifier)[1]["bugs"]:
            assert bug["description"] not in response.text and bug["hint"] not in response.text
        assert all(not file["path"].startswith(("/", "C:")) for file in data["files"])
        assert any(file["readOnly"] for file in data["files"])


@pytest.mark.parametrize("identifier", ["missing", "..", "../shopping-cart", "C:\\Windows", "shopping-cart-01/../../config"])
def test_invalid_ids(identifier):
    with pytest.raises(KeyError):
        service.load(identifier)


@pytest.mark.parametrize("path", ["../config.py", "C:\\config.py", "_clario_runner.py", "README.md", "tests.py", "nested/cart.py"])
def test_unexpected_and_readonly_files_rejected(path):
    with pytest.raises(service.InvalidRepository):
        service.validate_files(CART, {**starter(CART), path: "replacement"})


def test_missing_and_oversized_files():
    files = starter(CART)
    del files["main.py"]
    with pytest.raises(service.InvalidRepository):
        service.validate_files(CART, files)
    files = starter(CART)
    files["cart.py"] = "x" * 50_001
    with pytest.raises(service.InvalidRepository):
        service.validate_files(CART, files)
    files["cart.py"] = "\u2600" * 20_000
    with pytest.raises(service.InvalidRepository):
        service.validate_files(CART, files)


def test_readonly_starters_preserved():
    _, _, files = service.validate_files(LOGIN, starter(LOGIN))
    readonly = {file["path"]: file["content"] for file in service.detail(LOGIN)["files"] if file["readOnly"]}
    assert all(files[name] == content for name, content in readonly.items())


def test_payload_uses_shared_executor_and_limits(monkeypatch):
    async def execute(language, files, **kwargs):
        assert language == "python" and kwargs["bounded"] is True
        assert files[0]["name"] == service.RUNNER_NAME
        assert {file["name"] for file in files} >= {"users.py", "main.py", "auth.py", service.TEST_NAME}
        return service.MARKER + json.dumps([{"name": name, "passed": True} for name in sorted(service.load(LOGIN)[1]["testNames"])]), "", 0
    monkeypatch.setattr(service, "execute_files_on_piston", execute)
    result = asyncio.run(service.evaluate(LOGIN, starter(LOGIN)))
    assert result["success"] and result["passed"] == 8


@pytest.mark.parametrize("stdout,code", [("not json", 0), (service.MARKER + "[]", 0), ("", 124), ("private test traceback", 1)])
def test_execution_failures_do_not_leak_private_output(monkeypatch, stdout, code):
    async def execute(*args, **kwargs):
        return stdout, "private test source", code
    monkeypatch.setattr(service, "execute_files_on_piston", execute)
    result = asyncio.run(service.evaluate(CART, starter(CART)))
    assert not result["success"] and result["error"]
    assert "private test" not in json.dumps(result)


def test_submit_neither_executes_tests_nor_ends_the_interview(client, monkeypatch):
    async def evaluate(identifier, files):
        raise AssertionError("Submit must not execute code")
    saved = Mock(return_value={"saved": False, "submission_id": None, "message": "Storage unavailable"})
    monkeypatch.setattr(service, "evaluate", evaluate)
    monkeypatch.setattr(service, "save_submission", saved)
    response = client.post(f"/api/repo-challenges/{CART}/submit", json={"files": starter(CART)})
    assert response.status_code == 200 and response.json()["review_requested"] is True
    saved.assert_not_called()


def test_routes_reject_bad_input_and_missing_challenge(client):
    assert client.get("/api/repo-challenges/missing").status_code == 404
    assert client.post(f"/api/repo-challenges/{CART}/run", json={"files": starter(CART), "command": "bash"}).status_code == 422
    assert client.post(f"/api/repo-challenges/{CART}/run", json={"files": {"../x.py": "x"}}).status_code == 422


def test_piston_outage_not_reported_as_pass(client, monkeypatch):
    async def fail(*args, **kwargs):
        raise PistonServiceError("internal detail")
    monkeypatch.setattr(service, "evaluate", fail)
    response = client.post(f"/api/repo-challenges/{CART}/run", json={"files": starter(CART)})
    assert response.status_code == 503 and "internal detail" not in response.text


def test_persistence_failure_is_explicit(monkeypatch):
    import db
    database = Mock()
    database.table.side_effect = RuntimeError("schema unavailable")
    monkeypatch.setattr(db, "supabase", database)
    assert service.save_submission("owner", CART, starter(CART), {})["saved"] is False


def test_persistence_success_requires_returned_row(monkeypatch):
    import db
    database = Mock()
    query = database.table.return_value
    query.update.return_value = query
    query.eq.return_value = query
    query.execute.return_value.data = [{"id": "saved-row"}]
    monkeypatch.setattr(db, "supabase", database)
    result = service.save_submission("owner", CART, starter(CART), {"passed": 2})
    assert result["saved"] is True and result["submission_id"]
    row = query.insert.call_args_list[0].args[0]
    assert row["user_id"] == "owner" and row["problem_slug"] == "repo-debugging:" + CART
    assert "repo_debug_submissions" not in [call.args[0] for call in database.table.call_args_list]
    query.execute.return_value.data = []
    assert service.save_submission("owner", CART, starter(CART), {})["saved"] is False


def test_execution_requires_authentication_outside_local_bypass(monkeypatch):
    import auth
    monkeypatch.setattr(auth, "settings", SimpleNamespace(dev_bypass_auth=False))
    with TestClient(app) as client:
        for action in ("run", "submit"):
            assert client.post(f"/api/repo-challenges/{CART}/{action}", json={"files": starter(CART)}).status_code == 401


def test_repository_voice_context_uses_existing_agent_without_private_tests(client, monkeypatch):
    from voice import router as voice
    elevenlabs = Mock()
    elevenlabs.conversational_ai.conversations.get_signed_url.return_value = SimpleNamespace(signed_url="https://example.test/signed")
    monkeypatch.setattr(voice, "get_elevenlabs", lambda: elevenlabs)
    monkeypatch.setattr(voice, "settings", SimpleNamespace(elevenlabs_agent_id="test-agent", elevenlabs_voice_id="test-voice"))
    monkeypatch.setattr(voice, "get_problem", Mock(side_effect=AssertionError("Repo voice must not call LeetCode")))
    response = client.get(f"/voice/repo-session?challenge_id={CART}")
    assert response.status_code == 200
    data = response.json()
    assert data["signed_url"] == "https://example.test/signed"
    assert data["voice_id"] == "test-voice"
    context = data["variables"]["problem_description"]
    assert "repository debugging interview" in context and "cart.py" in context
    assert "test_cart.py" in context
    for bug in service.load(CART)[1]["bugs"]:
        assert bug["description"] not in response.text and bug["hint"] not in response.text
    elevenlabs.conversational_ai.conversations.get_signed_url.assert_called_once_with(agent_id="test-agent")
    assert client.get("/voice/repo-session?challenge_id=missing").status_code == 404


@pytest.mark.skipif(os.getenv("PISTON_REPO_TESTS") != "1", reason="Set PISTON_REPO_TESTS=1 to execute code in local Piston")
@pytest.mark.parametrize("identifier", [CART, LOGIN])
def test_real_piston_broken_and_fixed(identifier):
    broken = asyncio.run(service.evaluate(identifier, starter(identifier)))
    assert not broken["success"] and broken["failed"] > 0 and not broken["error"]
    repaired = asyncio.run(service.evaluate(identifier, fixed(identifier)))
    assert repaired["success"] and repaired["passed"] == repaired["total"]


@pytest.mark.skipif(os.getenv("PISTON_REPO_TESTS") != "1", reason="Requires local Piston")
def test_real_piston_timeout_and_syntax_error():
    files = starter(CART)
    files["main.py"] = "while True: pass"
    timeout = asyncio.run(service.evaluate(CART, files))
    assert timeout["error"] and not timeout["success"]
    files["main.py"] = "def broken("
    invalid = asyncio.run(service.evaluate(CART, files))
    assert invalid["error"] and not invalid["success"]


@pytest.mark.skipif(os.getenv("PISTON_REPO_TESTS") != "1", reason="Requires local Piston")
def test_real_run_endpoint_evaluates_fixed_files(client, monkeypatch):
    monkeypatch.setattr(service, "save_submission", lambda *args: {"saved": False, "submission_id": None, "message": "Test intentionally disables database writes"})
    response = client.post(f"/api/repo-challenges/{CART}/run", json={"files": fixed(CART)})
    assert response.status_code == 200
    result = response.json()
    assert result["success"] and result["passed"] == result["total"] == len(service.load(CART)[1]["testNames"])
    assert "submission" not in result
