"""Validate language selection and trusted checked-in exercise ports."""
import asyncio
import json
import os
import subprocess
import sys
from pathlib import Path
from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

from auth import get_current_user
from main import app
from services import repo_challenge_service as service

FIXTURES = Path(__file__).parent / "fixtures"
CPP_SOLUTIONS = json.loads((FIXTURES / "repo_cpp_solutions.json").read_text())
PYTHON_SOLUTIONS = json.loads((FIXTURES / "repo_additional_solutions.json").read_text())


@pytest.mark.parametrize("identifier", sorted(CPP_SOLUTIONS))
def test_language_variants_keep_ids_and_enforce_file_boundaries(identifier):
    for language in ("python", "cpp"):
        data = service.detail(identifier, language)
        assert data["id"] == identifier and data["language"] == language
        assert data["languages"] == ["python", "cpp"]
        assert "bugs" not in data and "testNames" not in data
        files = {f["path"]: f["content"] for f in data["files"] if not f["readOnly"]}
        service.validate_files(identifier, files, language)
        with pytest.raises(service.InvalidRepository):
            service.validate_files(identifier, {**files, "support.hpp": "replacement"}, language)
    with pytest.raises(service.InvalidRepository):
        service.validate_files(identifier, CPP_SOLUTIONS[identifier], "python")
    with pytest.raises(service.InvalidRepository):
        service.detail(identifier, "../../cpp")


def test_language_routes_and_cpp_execution_payload(monkeypatch):
    identifier = "shopping-cart-01"
    async def execute(language, files, **kwargs):
        assert language == "cpp" and kwargs["bounded"]
        assert kwargs["versions"]["cpp"]
        assert files[0]["name"] == "_clario_runner.cpp"
        assert len(files) == 1
        assert 'class Cart' in files[0]["content"]
        assert '#include "solution.hpp"' not in files[0]["content"]
        names = service.load(identifier, "cpp")[1]["testNames"]
        return service.MARKER + json.dumps([{"name": n, "passed": True} for n in names]), "", 0
    monkeypatch.setattr(service, "execute_files_on_piston", execute)
    app.dependency_overrides[get_current_user] = lambda: {"sub": "language-test"}
    try:
        with TestClient(app) as client:
            assert client.get(f"/api/repo-challenges/{identifier}?language=cpp").json()["language"] == "cpp"
            assert client.get(f"/api/repo-challenges/{identifier}?language=rust").status_code == 422
            response = client.post(f"/api/repo-challenges/{identifier}/run", json={"language": "cpp", "files": CPP_SOLUTIONS[identifier]})
            assert response.status_code == 200 and response.json()["success"]
            assert client.post(f"/api/repo-challenges/{identifier}/run", json={"language": "python", "files": CPP_SOLUTIONS[identifier]}).status_code == 422
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_python_worker_broken_and_repaired(tmp_path):
    folder, manifest = service.load("webhook-worker-01", "python")
    data = service.detail("webhook-worker-01", "python")
    for repaired in (False, True):
        files = {f["path"]: f["content"] for f in data["files"]}
        if repaired:
            files["processor.py"] = (FIXTURES / "worker_solution.py").read_text()
        files[service.RUNNER_NAME] = (service.CHALLENGES / "runner.py").read_text()
        files[service.TEST_NAME] = (folder / "tests" / manifest["testFile"]).read_text()
        for name, content in files.items():
            (tmp_path / name).write_text(content, encoding="utf-8")
        result = subprocess.run([sys.executable, "-B", service.RUNNER_NAME], cwd=tmp_path, capture_output=True, text=True, timeout=20)
        assert result.returncode == 0, result.stderr
        rows = json.loads(result.stdout.split(service.MARKER)[1])
        assert len(rows) == 8
        assert all(row["passed"] for row in rows) == repaired, rows


@pytest.mark.parametrize("identifier", sorted(PYTHON_SOLUTIONS))
def test_additional_python_starters_and_repairs(identifier, tmp_path):
    folder, manifest = service.load(identifier, "python")
    data = service.detail(identifier, "python")
    for repaired in (False, True):
        files = {f["path"]: f["content"] for f in data["files"]}
        if repaired:
            files.update(PYTHON_SOLUTIONS[identifier])
        files[service.RUNNER_NAME] = (service.CHALLENGES / "runner.py").read_text()
        files[service.TEST_NAME] = (folder / "tests" / manifest["testFile"]).read_text()
        for name, content in files.items():
            (tmp_path / name).write_text(content, encoding="utf-8")
        run = subprocess.run([sys.executable, "-B", service.RUNNER_NAME], cwd=tmp_path, capture_output=True, text=True, timeout=10)
        assert run.returncode == 0, run.stderr
        rows = json.loads(run.stdout.split(service.MARKER)[1])
        assert [row["name"] for row in rows] == sorted(manifest["testNames"])
        assert all(row["passed"] for row in rows) == repaired, rows


def test_cpp_interview_storage_and_report_use_selected_language(monkeypatch):
    import db
    from routers.feedback import get_stored_problem
    database = Mock()
    query = database.table.return_value
    query.update.return_value = query
    query.eq.return_value = query
    query.execute.return_value.data = [{"id": "saved"}]
    monkeypatch.setattr(db, "supabase", database)
    result = service.save_submission("owner", "seat-reservations-01", CPP_SOLUTIONS["seat-reservations-01"], {}, "cpp")
    assert result["saved"]
    assert query.insert.call_args_list[0].args[0]["language"] == "cpp"
    assert query.insert.call_args_list[1].args[0]["language"] == "cpp"
    problem = get_stored_problem({"problem_slug": "repo-debugging:seat-reservations-01", "language": "cpp"})
    assert "simulator" in problem["description"]


@pytest.mark.skipif(os.getenv("PISTON_REPO_TESTS") != "1", reason="Requires local Piston with C++ installed")
@pytest.mark.parametrize("identifier", sorted(CPP_SOLUTIONS))
def test_cpp_starters_fail_and_repairs_pass_in_piston(identifier):
    files = {f["path"]: f["content"] for f in service.detail(identifier, "cpp")["files"] if not f["readOnly"]}
    broken = asyncio.run(service.evaluate(identifier, files, "cpp"))
    assert not broken["error"], broken
    assert not broken["success"] and broken["failed"] > 0
    fixed = asyncio.run(service.evaluate(identifier, CPP_SOLUTIONS[identifier], "cpp"))
    assert not fixed["error"], fixed
    assert fixed["success"], fixed
