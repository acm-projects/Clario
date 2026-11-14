import json
import asyncio
import unittest
from unittest.mock import AsyncMock, patch

import httpx
from fastapi import HTTPException
from fastapi.testclient import TestClient

from main import app
from piston import router as runner
from piston.harness import MARKER
from piston.testcases import UnsupportedProblem, build_test_cases, parse_signature

PROBLEM = {
    "slug": "a-real-library-problem",
    "starter_code": {"python3": "class Solution:\n    def solve(self, nums: List[int], target: int):\n        pass"},
    "example_testcases": "[2,7,11,15]\n9\n[3,2,4]\n6",
    "description_html": "<p><strong>Output:</strong> [0,1]</p><p><strong>Output:</strong> [1,2]</p>",
}

class SandboxCasesTests(unittest.TestCase):
    def test_full_and_bodyless_starters(self):
        for starter in [PROBLEM["starter_code"]["python3"], "class Solution:\n    def solve(self, nums, target):"]:
            self.assertEqual(parse_signature(starter), ("solve", ["nums", "target"]))

    def test_real_problem_examples(self):
        self.assertEqual(build_test_cases(PROBLEM), [
            {"input": [[2,7,11,15], 9], "expected": [0,1]},
            {"input": [[3,2,4], 6], "expected": [1,2]},
        ])

    def test_complex_types_are_explicitly_unsupported(self):
        with self.assertRaises(UnsupportedProblem):
            parse_signature("class Solution:\n    def solve(self, node: TreeNode): pass")

    def test_loader_uses_library_not_bundled_fixtures(self):
        with patch.object(runner, "get_problem", return_value=PROBLEM) as get_problem:
            self.assertEqual(runner.load_problem(PROBLEM["slug"]), PROBLEM)
            get_problem.assert_called_once_with(PROBLEM["slug"])

    def test_loader_maps_service_failure(self):
        with patch.object(runner, "get_problem", side_effect=httpx.ConnectError("offline")):
            with self.assertRaises(HTTPException) as context:
                asyncio.run(runner.run_tests(runner.TestsRequest(slug="anything", language="python", code="pass")))
            self.assertEqual(context.exception.status_code, 503)

    def test_all_routes_survive_initialization(self):
        paths=app.openapi()["paths"]
        for endpoint in ["/run", "/run/tests", "/voice/turn", "/api/sessions", "/api/problems/{slug}", "/api/feedback"]:
            self.assertIn(endpoint, paths)

    def test_voice_without_credentials_does_not_break_startup(self):
        from voice import router as voice
        from types import SimpleNamespace
        with patch.object(voice, "settings", SimpleNamespace(elevenlabs_api_key="", gemini_api_key="")):
            response=TestClient(app).post("/voice/turn", files={"audio": ("test.webm", b"sample", "audio/webm")})
        self.assertEqual(response.status_code, 503)

class SandboxRunnerTests(unittest.IsolatedAsyncioTestCase):
    async def run_result(self, rows, exit_code=0):
        stdout = "candidate output\n" + MARKER + json.dumps(rows) if rows is not None else ""
        with patch.object(runner, "load_problem", return_value=PROBLEM), patch("piston.service.execute_on_piston", new=AsyncMock(return_value=(stdout, "", exit_code))):
            return await runner.run_tests(runner.TestsRequest(slug=PROBLEM["slug"], language="python", code="class Solution: pass"))

    async def test_accepts_complete_correct_results(self):
        result=await self.run_result([{"ok": True, "output": [0,1]}, {"ok": True, "output": [1,2]}])
        self.assertEqual((result.status,result.passed,result.total), ("Accepted",2,2))
        self.assertEqual(result.stdout,"candidate output")

    async def test_wrong_answer(self):
        result=await self.run_result([{"ok": True, "output": []}, {"ok": True, "output": [1,2]}])
        self.assertEqual((result.status,result.passed), ("Wrong Answer",1))

    async def test_incomplete_results_never_pass(self):
        result=await self.run_result([{"ok": True, "output": [0,1]}])
        self.assertEqual(result.status,"Runtime Error")

    async def test_timeout(self):
        result=await self.run_result(None,124)
        self.assertEqual(result.status,"Time Limit Exceeded")

    async def test_missing_problem(self):
        with patch.object(runner,"load_problem",return_value=None):
            with self.assertRaises(HTTPException) as context:
                await runner.run_tests(runner.TestsRequest(slug="missing",language="python",code="pass"))
            self.assertEqual(context.exception.status_code,404)

    async def test_java_harness_explicitly_unsupported(self):
        with patch.object(runner, "load_problem", return_value=PROBLEM):
            result=await runner.run_tests(runner.TestsRequest(slug="any",language="java",code="class Solution {}"))
        self.assertEqual(result.status,"Unsupported")
