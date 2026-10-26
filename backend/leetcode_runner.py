
import json

from judge0_client import execute_code


def run_python_test(
    solution_code: str,
    method_name: str,
    test_input: list,
) -> dict:
    """
    Execute a LeetCode-style Python Solution method
    against one test case using Judge0.

    Supports JSON-compatible inputs and outputs.
    """

    if not method_name.isidentifier():
        raise ValueError("Invalid method name")

    arguments_json = json.dumps(test_input)

    runner_code = f"""
import json
from typing import *

{solution_code}

args = json.loads({arguments_json!r})

if "Solution" in globals():
    solution = Solution()
    method = getattr(solution, {method_name!r})
else:
    method = globals().get({method_name!r})

if not callable(method):
    raise AttributeError("Solution method not found")

result = method(*args)
print(json.dumps(result))
"""

    result = execute_code(
        source_code=runner_code,
        language="python3",
    )

    if result["status"] != "Accepted":
        return {
            "passed": False,
            "status": result["status"],
            "error": (
                result.get("stderr")
                or result.get("compile_output")
                or "Execution failed"
            ),
        }

    try:
        actual = json.loads((result["stdout"] or "").strip())
    except json.JSONDecodeError:
        return {
            "passed": False,
            "status": "Invalid Output",
            "error": "Solution did not return valid JSON output",
        }

    return {
        "status": result["status"],
        "actual": actual,
    }


import ast


def get_python_method_name(starter_code: str) -> str:
    """Extract the expected function name from trusted starter code."""
    if not starter_code or not starter_code.strip():
        raise ValueError("Python starter code is missing")

    try:
        tree = ast.parse(starter_code)

    except SyntaxError:
        # LeetCode starter code may end with an empty method body.
        lines = starter_code.rstrip().splitlines()

    if not lines:
        raise ValueError("Python starter code is empty")

    last_line = lines[-1]

    if not last_line.lstrip().startswith("def "):
        raise ValueError("Invalid Python starter code")

    indentation = len(last_line) - len(last_line.lstrip())

    parseable_code = (
        starter_code.rstrip()
        + "\n"
        + " " * (indentation + 4)
        + "pass\n"
    )

    try:
        tree = ast.parse(parseable_code)
    except SyntaxError as exc:
        raise ValueError(
            "Invalid Python starter code"
        ) from exc

    # LeetCode format: class Solution with a method
    for node in tree.body:
        if isinstance(node, ast.ClassDef) and node.name == "Solution":
            methods = [
                item.name
                for item in node.body
                if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef))
                and not item.name.startswith("_")
            ]
            if len(methods) != 1:
                raise ValueError("Expected exactly one Solution method")
            return methods[0]

    # Clario format: standalone function
    functions = [
        node.name
        for node in tree.body
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
        and not node.name.startswith("_")
    ]

    if len(functions) != 1:
        raise ValueError("Expected exactly one standalone function")

    return functions[0]

def run_scenario_tests(
    solution_code: str,
    method_name: str,
    test_cases: list[dict],
    problem_slug: str | None = None,
) -> dict:
    """
    Execute a Python LeetCode solution against all
    supplied scenario test cases using Judge0.
    """

    if not test_cases:
        raise ValueError("No test cases provided")

    
    if len(test_cases) > 10:
        raise ValueError(
            "Maximum 10 test cases allowed per execution"
        )

    if len(solution_code) > 20000:
        raise ValueError(
            "Solution exceeds maximum allowed size"
        )


    results = []

    for index, test_case in enumerate(test_cases, start=1):
        execution = run_python_test(
            solution_code=solution_code,
            method_name=method_name,
            test_input=test_case["input"],
        )

        actual = execution.get("actual")
        expected = test_case["expected"]

        passed = (
            execution.get("status") == "Accepted"
            and compare_test_output(
                actual,
                expected,
                problem_slug,
            )
        )

        results.append({
            "test_number": index,
            "passed": passed,
            "expected": expected,
            "actual": actual,
            "status": execution.get("status"),
            "error": execution.get("error"),
        })

    passed_count = sum(
        result["passed"]
        for result in results
    )

    return {
        "total": len(results),
        "passed": passed_count,
        "failed": len(results) - passed_count,
        "all_passed": passed_count == len(results),
        "results": results,
    }


def compare_test_output(
    actual,
    expected,
    problem_slug: str | None = None,
) -> bool:
    """
    Compare execution output against expected output.

    Two Sum permits either ordering of the same two indices.
    Other problems use exact equality by default.
    """

    if problem_slug == "two-sum":
        return (
            isinstance(actual, list)
            and isinstance(expected, list)
            and len(actual) == len(expected) == 2
            and all(type(value) is int for value in actual)
            and all(type(value) is int for value in expected)
            and sorted(actual) == sorted(expected)
        )

    return actual == expected
