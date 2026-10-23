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
        files["cart.py"] = files["cart.py"].replace("discount_rate = discount_percent / 100", "discount_rate = discount_percent")
        files["cart.py"] = files["cart.py"].replace('item["price"] for', 'item["price"] * item["quantity"] for')
        files["discounts.py"] = files["discounts.py"].replace("round(subtotal)", "subtotal")
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


@pytest.fixture
def client():
    app.dependency_overrides[get_current_user] = lambda: {"sub": "test-owner"}
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.pop(get_current_user, None)


def test_catalog_and_private_files(client):
    response = client.get("/api/repo-challenges")
    assert response.status_code == 200
    assert {row["id"] for row in response.json()} == {CART, LOGIN}
    for identifier in (CART, LOGIN):
        response = client.get(f"/api/repo-challenges/{identifier}")
        assert response.status_code == 200
        data = response.json()
        assert data["entrypoint"] in {file["path"] for file in data["files"]}
        assert "testNames" not in data and "testFile" not in data
        assert all(file["path"] != "test_cart.py" for file in data["files"])
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


def test_submission_evaluates_then_reports_real_persistence_status(client, monkeypatch):
    async def evaluate(identifier, files, **kwargs):
        assert identifier == CART and files == starter(CART)
        return {"success": False, "passed": 2, "failed": 5, "total": 7, "tests": [], "error": None}
    saved = Mock(return_value={"saved": False, "submission_id": None, "message": "Storage unavailable"})
    monkeypatch.setattr(service, "evaluate", evaluate)
    monkeypatch.setattr(service, "save_submission", saved)
    response = client.post(f"/api/repo-challenges/{CART}/submit", json={"files": starter(CART)})
    assert response.status_code == 200 and response.json()["submission"]["saved"] is False
    assert saved.call_args.args[0] == "test-owner"


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
    database.table.return_value.insert.return_value.execute.return_value.data = [{"id": "saved-row"}]
    monkeypatch.setattr(db, "supabase", database)
    result = service.save_submission("owner", CART, starter(CART), {"passed": 2})
    assert result["saved"] is True and result["submission_id"] == "saved-row"
    row = database.table.return_value.insert.call_args.args[0]
    assert row["user_id"] == "owner" and row["files"] == starter(CART)
    database.table.return_value.insert.return_value.execute.return_value.data = []
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
    monkeypatch.setattr(voice, "settings", SimpleNamespace(elevenlabs_agent_id="test-agent"))
    monkeypatch.setattr(voice, "get_problem", Mock(side_effect=AssertionError("Repo voice must not call LeetCode")))
    response = client.get(f"/voice/repo-session?challenge_id={CART}")
    assert response.status_code == 200
    data = response.json()
    assert data["signed_url"] == "https://example.test/signed"
    context = data["variables"]["problem_description"]
    assert "repository debugging interview" in context and "cart.py" in context
    assert "test_cart.py" not in context and "test_percentage_discount" not in context
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
def test_real_submission_endpoint_evaluates_fixed_files(client, monkeypatch):
    monkeypatch.setattr(service, "save_submission", lambda *args: {"saved": False, "submission_id": None, "message": "Test intentionally disables database writes"})
    response = client.post(f"/api/repo-challenges/{CART}/submit", json={"files": fixed(CART)})
    assert response.status_code == 200
    result = response.json()
    assert result["success"] and result["passed"] == result["total"] == 11
    assert result["submission"]["saved"] is False


@pytest.mark.parametrize("submit,expected_total", [(False, 3), (True, 11)])
def test_cart_visible_and_submit_payloads(monkeypatch, submit, expected_total):
    async def execute(language, files, **kwargs):
        payload = {file["name"]: file["content"] for file in files}
        assert "test_checkout.py" in payload
        assert bool(payload[service.TEST_NAME]) is submit
        manifest = service.load(CART)[1]
        names = manifest["visibleTestNames"] + (manifest["testNames"] if submit else [])
        return service.MARKER + json.dumps([{"name": name, "passed": True} for name in sorted(names)]), "", 0
    monkeypatch.setattr(service, "execute_files_on_piston", execute)
    result = asyncio.run(service.evaluate(CART, starter(CART), submit=submit))
    assert result["success"] and result["total"] == expected_total


@pytest.mark.parametrize("path", ["../cart.py", "nested/cart.py", "C:\\cart.py", "_clario_tests.py"])
def test_safe_paths_reject_traversal_and_reserved_names(tmp_path, path):
    with pytest.raises(service.InvalidRepository):
        service.safe_path(tmp_path, path)
