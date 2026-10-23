from __future__ import annotations

"""Shared Piston execution and LeetCode test orchestration."""

import json
from dataclasses import dataclass
from typing import Any

import httpx

from .harness import split_output, wrap_python
from .testcases import UnsupportedProblem, build_test_cases, parse_signature

MAX_OUTPUT_LENGTH = 100_000
FILE_NAMES = {"python": "main.py", "java": "Main.java"}


class PistonServiceError(RuntimeError):
    """Raised when Piston returns an unusable response."""


@dataclass
class TestRunResult:
    status: str
    passed: int
    total: int
    cases: list[dict[str, Any]]
    stdout: str
    error: str | None


def limit_output(value: str) -> str:
    if len(value) <= MAX_OUTPUT_LENGTH:
        return value
    return value[:MAX_OUTPUT_LENGTH] + "\n[output truncated]"


async def execute_on_piston(
    language: str,
    source: str,
    *,
    piston_url: str,
    versions: dict[str, str],
) -> tuple[str, str, int]:
    return await execute_files_on_piston(
        language, [{"name": FILE_NAMES[language], "content": source}],
        piston_url=piston_url, versions=versions,
    )


async def execute_files_on_piston(
    language: str,
    files: list[dict[str, str]],
    *,
    piston_url: str,
    versions: dict[str, str],
    bounded: bool = False,
) -> tuple[str, str, int]:
    """First file is the entry point. Callers must validate names and contents."""
    payload = {
        "language": language,
        "version": versions[language],
        "files": files,
        "run_timeout": 5000 if bounded else 3000,
        "compile_timeout": 10000,
    }
    if bounded:
        payload.update(run_memory_limit=128 * 1024 * 1024, compile_memory_limit=256 * 1024 * 1024,
                       run_cpu_time=5000, compile_cpu_time=10000)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(piston_url, json=payload)
            response.raise_for_status()
    except httpx.TimeoutException:
        return "", "Execution timed out.", 124
    except httpx.HTTPError as exc:
        raise PistonServiceError("Code execution service unavailable") from exc

    try:
        data = response.json()
    except ValueError as exc:
        raise PistonServiceError(
            "Invalid response from code execution service"
        ) from exc

    compile_stage = data.get("compile")
    if compile_stage and compile_stage.get("code") not in (0, None):
        return (
            compile_stage.get("stdout", ""),
            compile_stage.get("stderr", ""),
            compile_stage["code"],
        )

    run = data.get("run")
    if not isinstance(run, dict):
        raise PistonServiceError("Invalid response from code execution service")

    code = run.get("code")
    if code is None:
        return (
            run.get("stdout", ""),
            (run.get("stderr") or "") + f"\nTerminated ({run.get('signal')})",
            124,
        )
    return run.get("stdout", ""), run.get("stderr", ""), code


async def run_problem_tests(
    *,
    problem: dict,
    language: str,
    source: str,
    piston_url: str,
    versions: dict[str, str],
) -> TestRunResult:
    if language == "java":
        return TestRunResult(
            "Unsupported", 0, 0, [], "", "Java test cases not supported for this problem yet"
        )

    try:
        method_name, param_names = parse_signature(
            problem["starter_code"]["python3"]
        )
        cases = build_test_cases(problem)
    except UnsupportedProblem as exc:
        return TestRunResult("Unsupported", 0, 0, [], "", str(exc))

    script = wrap_python(source, method_name, [case["input"] for case in cases])
    stdout, stderr, exit_code = await execute_on_piston(
        language, script, piston_url=piston_url, versions=versions
    )
    user_stdout, results = split_output(stdout)
    user_stdout = limit_output(user_stdout)
    total = len(cases)

    if results is None:
        if exit_code == 124:
            return TestRunResult(
                "Time Limit Exceeded",
                0,
                total,
                [],
                user_stdout,
                "Your code took too long to run.",
            )
        return TestRunResult(
            "Runtime Error",
            0,
            total,
            [],
            user_stdout,
            limit_output(stderr) or "Your code crashed.",
        )

    case_rows: list[dict[str, Any]] = []
    passed = 0
    first_error = None
    for index, (case, result) in enumerate(zip(cases, results), start=1):
        input_text = ", ".join(
            f"{name} = {_format(value)}"
            for name, value in zip(param_names, case["input"])
        )
        if not result["ok"]:
            first_error = first_error or result["error"]
            case_rows.append(
                {
                    "case": index,
                    "input": input_text,
                    "expected": _format(case["expected"]),
                    "output": None,
                    "passed": False,
                }
            )
            continue
        is_correct = result["output"] == case["expected"]
        passed += is_correct
        case_rows.append(
            {
                "case": index,
                "input": input_text,
                "expected": _format(case["expected"]),
                "output": _format(result["output"]),
                "passed": is_correct,
            }
        )

    status = (
        "Runtime Error"
        if first_error
        else "Accepted"
        if passed == total
        else "Wrong Answer"
    )
    return TestRunResult(
        status, passed, total, case_rows, user_stdout, first_error
    )


def _format(value: Any) -> str:
    return json.dumps(value, separators=(",", ":"))
