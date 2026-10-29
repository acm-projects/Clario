
import json
import logging

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from leetcode import get_problem
from leetcode_runner import (
    get_python_method_name,
    run_scenario_tests,
)
from leetcode_test_cases import extract_test_cases

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/run", tags=["Standard Code Runner"])


class StandardRunRequest(BaseModel):
    slug: str = Field(min_length=1, max_length=200)
    language: str
    code: str = Field(min_length=1, max_length=20000)


@router.post("/tests")
def run_standard_tests(payload: StandardRunRequest):
    if payload.language != "python":
        raise HTTPException(
            status_code=422,
            detail="Standard test execution currently supports Python only",
        )

    try:
        problem = get_problem(payload.slug)
    except httpx.HTTPError:
        raise HTTPException(
            status_code=503,
            detail="Problem service unavailable",
        )

    if problem is None:
        raise HTTPException(
            status_code=404,
            detail="Problem not found",
        )

    starter_code = (
        (problem.get("starter_code") or {}).get("python3") or ""
    )

    try:
        method_name = get_python_method_name(starter_code)
        test_cases = extract_test_cases(problem)
    except (ValueError, SyntaxError) as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Unable to prepare problem tests: {exc}",
        )

    if not test_cases:
        raise HTTPException(
            status_code=422,
            detail="No supported example test cases found",
        )

    try:
        execution = run_scenario_tests(
            solution_code=payload.code,
            method_name=method_name,
            test_cases=test_cases[:10],
            problem_slug=payload.slug,
        )
    except (ValueError, KeyError, TypeError) as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Unable to execute tests: {exc}",
        )
    except Exception:
        logger.exception("Standard problem execution failed")
        raise HTTPException(
            status_code=502,
            detail="Code execution service unavailable",
        )

    cases = []
    for index, result in enumerate(execution["results"]):
        original = test_cases[index]
        cases.append({
            "case": result["test_number"],
            "input": json.dumps(original["input"]),
            "expected": json.dumps(original["expected"]),
            "output": (
                json.dumps(result["actual"])
                if result.get("actual") is not None
                else None
            ),
            "passed": result["passed"],
        })

    statuses = [item.get("status") for item in execution["results"]]

    if execution["all_passed"]:
        status = "Accepted"
    elif "Time Limit Exceeded" in statuses:
        status = "Time Limit Exceeded"
    elif "Compile Error" in statuses:
        status = "Compile Error"
    elif "Runtime Error" in statuses:
        status = "Runtime Error"
    else:
        status = "Wrong Answer"

    errors = [
        item["error"]
        for item in execution["results"]
        if item.get("error")
    ]

    return {
        "status": status,
        "passed": execution["passed"],
        "total": execution["total"],
        "cases": cases,
        "stdout": "",
        "error": errors[0] if errors else None,
    }