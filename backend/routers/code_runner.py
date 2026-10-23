import logging
import time

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger("uvicorn.error")

from auth import get_current_user
from db import supabase
from leetcode_runner import (
    run_scenario_tests,
    get_python_method_name,
)
from routers.scenarios import require_internal_key


limiter = Limiter(key_func=get_remote_address)

router = APIRouter(
    prefix="/api/run",
    tags=["Code Runner"],
)


class RunRequest(BaseModel):
    scenario_slug: str = Field(min_length=1, max_length=200)
    solution_code: str = Field(min_length=1, max_length=20000)



def execute_scenario(payload: RunRequest):
    """Execute server-stored tests and return candidate-safe results."""

    started = time.monotonic()

    logger.info(
        "CLA-68: Starting scenario execution for %s",
        payload.scenario_slug,
    )

    # --------------------------------------------------
    # Step 1: Load scenario and hidden tests from Supabase
    # --------------------------------------------------
    logger.info("CLA-68: Loading scenario from Supabase")

    try:
        rows = (
            supabase.table("scenario_questions")
            .select(
                "slug, base_problem_slug, test_cases, starter_code"
            )
            .eq("slug", payload.scenario_slug)
            .limit(1)
            .execute()
            .data
        )

        logger.info(
            "CLA-68: Supabase query completed in %.2f seconds",
            time.monotonic() - started,
        )

    except Exception:
        logger.exception("CLA-68: Supabase query failed")
        raise HTTPException(
            status_code=502,
            detail="Scenario storage service unavailable",
        )

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="Scenario not found",
        )

    scenario = rows[0]
    test_cases = scenario.get("test_cases") or []

    # --------------------------------------------------
    # Step 2: Validate hidden test cases
    # --------------------------------------------------
    if not test_cases:
        raise HTTPException(
            status_code=422,
            detail="Scenario has no executable test cases",
        )

    if len(test_cases) > 10:
        raise HTTPException(
            status_code=422,
            detail="Scenario exceeds supported test limit",
        )

    for index, case in enumerate(test_cases, start=1):
        if not isinstance(case, dict):
            raise HTTPException(
                status_code=422,
                detail=f"Test case {index} must be an object",
            )

        if "input" not in case or "expected" not in case:
            raise HTTPException(
                status_code=422,
                detail=f"Test case {index} is missing input or expected",
            )

        if not isinstance(case["input"], list):
            raise HTTPException(
                status_code=422,
                detail=f"Test case {index} input must be a list",
            )

    # --------------------------------------------------
    # Step 3: Determine method from trusted starter code
    # --------------------------------------------------
    starter_code = scenario.get("starter_code") or {}
    python_starter = starter_code.get("python3")

    if not isinstance(python_starter, str) or not python_starter.strip():
        raise HTTPException(
            status_code=422,
            detail="Python starter code is unavailable",
        )

    try:
        expected_method = get_python_method_name(python_starter)

    except ValueError:
        logger.exception("CLA-68: Invalid scenario starter code")
        raise HTTPException(
            status_code=422,
            detail="Invalid scenario starter code",
        )

    logger.info(
        "CLA-68: Scenario validated in %.2f seconds; %d tests",
        time.monotonic() - started,
        len(test_cases),
    )

    # --------------------------------------------------
    # Step 4: Execute tests through Judge0
    # --------------------------------------------------
    judge0_started = time.monotonic()

    logger.info("CLA-68: Starting Judge0 execution")

    try:
        result = run_scenario_tests(
            solution_code=payload.solution_code,
            method_name=expected_method,
            test_cases=test_cases,
            problem_slug=scenario.get("base_problem_slug"),
        )

    except ValueError:
        logger.exception("CLA-68: Invalid execution request")
        raise HTTPException(
            status_code=422,
            detail="Invalid code execution request",
        )

    except RuntimeError as error:
        logger.warning(
            "CLA-68: Judge0 execution unavailable: %s",
            error,
        )
        raise HTTPException(
            status_code=503,
            detail=(
                "Code execution is temporarily unavailable. "
                "Please try again later. "
                "Your solution has not been evaluated."
            ),
        ) from error

    except Exception:
        logger.exception("CLA-68: Unexpected execution failure")
        raise HTTPException(
            status_code=502,
            detail="Code execution service unavailable",
    )

    logger.info(
        "CLA-68: Judge0 completed in %.2f seconds",
        time.monotonic() - judge0_started,
    )

    logger.info(
        "CLA-68: Total execution time %.2f seconds",
        time.monotonic() - started,
    )

    # --------------------------------------------------
    # Step 5: Return candidate-safe results
    # --------------------------------------------------
    return {
        "scenario_slug": payload.scenario_slug,
        "total": result["total"],
        "passed": result["passed"],
        "failed": result["failed"],
        "all_passed": result["all_passed"],
        "results": [
            {
                "test_number": test["test_number"],
                "passed": test["passed"],
                "status": test["status"],
            }
            for test in result["results"]
        ],
    }


@router.post("/tests")
@limiter.limit("5/minute")
def run_tests(
    request: Request,
    payload: RunRequest,
    x_internal_key: str | None = Header(default=None),
):
    require_internal_key(x_internal_key)
    return execute_scenario(payload)


@router.post("/candidate/tests")
@limiter.limit("5/minute")
def run_candidate_tests(
    request: Request,
    payload: RunRequest,
    user: dict = Depends(get_current_user),
):
    return execute_scenario(payload)
