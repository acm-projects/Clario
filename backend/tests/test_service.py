import asyncio

from piston import service


PROBLEM = {
    "starter_code": {
        "python3": "class Solution:\n    def add(self, left, right):\n        "
    },
    "example_testcases": "2\n3\n",
    "description_html": "<pre>Output: 5</pre>",
}


def test_run_problem_tests_compares_outputs(monkeypatch):
    async def fake_execute(*args, **kwargs):
        return '\n__CLARIO_RESULTS__[{"ok":true,"output":5}]', "", 0

    monkeypatch.setattr(service, "execute_on_piston", fake_execute)
    result = asyncio.run(
        service.run_problem_tests(
            problem=PROBLEM,
            language="python",
            source="class Solution:\n    def add(self, left, right):\n        return left + right",
            piston_url="http://unused",
            versions={"python": "*", "java": "*"},
        )
    )

    assert result.status == "Accepted"
    assert result.passed == result.total == 1
    assert result.cases[0]["output"] == "5"


def test_run_problem_tests_reports_timeout(monkeypatch):
    async def fake_execute(*args, **kwargs):
        return "", "Execution timed out.", 124

    monkeypatch.setattr(service, "execute_on_piston", fake_execute)
    result = asyncio.run(
        service.run_problem_tests(
            problem=PROBLEM,
            language="python",
            source="while True: pass",
            piston_url="http://unused",
            versions={"python": "*", "java": "*"},
        )
    )

    assert result.status == "Time Limit Exceeded"
    assert result.total == 1
    assert result.error == "Your code took too long to run."
