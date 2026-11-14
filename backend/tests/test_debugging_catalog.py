"""Trusted checked-in exercise fixtures only; candidate code still runs in Piston."""
import json
import subprocess
import sys
from pathlib import Path

import pytest
from services import repo_challenge_service as service

SOLUTIONS = json.loads((Path(__file__).parent / "fixtures" / "repo_solutions.json").read_text())


@pytest.mark.parametrize("identifier", sorted(SOLUTIONS))
def test_broken_and_repaired_exercises(identifier, tmp_path):
    folder, manifest = service.load(identifier)
    public = service.detail(identifier)
    assert "bugs" not in public and "testNames" not in public
    javascript = manifest["language"] == "javascript"
    runner = "runner.js" if javascript else "runner.py"
    runner_name = "_clario_runner.js" if javascript else service.RUNNER_NAME
    test_name = "_clario_tests.js" if javascript else service.TEST_NAME
    for repaired in (False, True):
        files = {file["path"]: file["content"] for file in public["files"]}
        if repaired:
            files.update(SOLUTIONS[identifier])
        files[runner_name] = (service.CHALLENGES / runner).read_text()
        files[test_name] = (folder / "tests" / manifest["testFile"]).read_text()
        for name, content in files.items():
            (tmp_path / name).write_text(content, encoding="utf-8")
        command = ["node", runner_name] if javascript else [sys.executable, runner_name]
        result = subprocess.run(command, cwd=tmp_path, capture_output=True, text=True, timeout=20)
        assert result.returncode == 0, result.stderr
        rows = json.loads(result.stdout.split(service.MARKER, 1)[1])
        assert [r["name"] for r in rows] == sorted(manifest["testNames"])
        if repaired:
            assert all(r["passed"] for r in rows), rows
        else:
            assert not all(r["passed"] for r in rows), "Starter must reproduce real failures"


def test_javascript_sandbox_payload(monkeypatch):
    import asyncio
    async def execute(language, files, **kwargs):
        assert language == "javascript" and kwargs["bounded"]
        assert files[0]["name"] == "_clario_runner.js"
        assert "_clario_tests.js" in {f["name"] for f in files}
        rows = [{"name": name, "passed": True} for name in service.load("webhook-worker-01")[1]["testNames"]]
        return service.MARKER + json.dumps(rows), "", 0
    monkeypatch.setattr(service, "execute_files_on_piston", execute)
    sources = {f["path"]: f["content"] for f in service.detail("webhook-worker-01")["files"] if not f["readOnly"]}
    assert asyncio.run(service.evaluate("webhook-worker-01", sources))["success"]
