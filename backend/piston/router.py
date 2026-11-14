from __future__ import annotations

import logging
import time
from typing import Literal, Optional
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from config import settings
from auth import bearer_scheme, get_current_user
from db import supabase
from routers.sessions import get_owned_session
from leetcode import get_problem

from .service import (
    PistonServiceError,
    execute_on_piston,
    limit_output,
    run_problem_tests,
)

logger = logging.getLogger(__name__)
router = APIRouter()

PISTON_VERSIONS = {
    "python": settings.piston_python_version,
    "java": settings.piston_java_version,
}


class RunRequest(BaseModel):
    language: Literal["python", "java"]
    code: str = Field(min_length=1, max_length=50_000)


class RunResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int


@router.post("/run", response_model=RunResponse)
async def run_code(req: RunRequest):
    try:
        stdout, stderr, exit_code = await execute_on_piston(
            req.language,
            req.code,
            piston_url=settings.piston_url,
            versions=PISTON_VERSIONS,
        )
    except PistonServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return RunResponse(
        stdout=limit_output(stdout),
        stderr=limit_output(stderr),
        exit_code=exit_code,
    )


# Test cases do not change during an interview. Caching keeps every Run after the
# first independent of the free-tier LeetCode API (which can take seconds to wake).
PROBLEM_CACHE_SECONDS = 30 * 60
_problem_cache: dict[str, tuple[float, dict]] = {}


def load_problem(slug: str) -> Optional[dict]:
    """Load the same live-first/Supabase-fallback data used by problem routes."""
    cached = _problem_cache.get(slug)
    if cached and time.monotonic() - cached[0] < PROBLEM_CACHE_SECONDS:
        return cached[1]
    problem = get_problem(slug)
    if problem is not None:
        _problem_cache[slug] = (time.monotonic(), problem)
    return problem


class TestsRequest(BaseModel):
    slug: str
    language: Literal["python", "java"]
    code: str = Field(min_length=1, max_length=50_000)
    session_id: UUID | None = None


class CaseOut(BaseModel):
    case: int
    input: str
    expected: str
    output: Optional[str]
    passed: bool


class TestsResponse(BaseModel):
    status: str
    passed: int
    total: int
    cases: list[CaseOut]
    stdout: str
    error: Optional[str]
    stderr: str = ""
    exit_code: int | None = None


async def run_tests(req: TestsRequest):
    try:
        # Blocking HTTP: keep it off the event loop so a slow lookup cannot stall
        # other requests (including the interviewer's get_current_code tool).
        problem = await run_in_threadpool(load_problem, req.slug)
    except httpx.HTTPError as exc:
        logger.warning("Problem lookup failed for %s: %s", req.slug, exc)
        raise HTTPException(status_code=503, detail="Problem service unavailable") from exc
    if problem is None:
        raise HTTPException(status_code=404, detail="Problem not found")

    try:
        result = await run_problem_tests(
            problem=problem,
            language=req.language,
            source=req.code,
            piston_url=settings.piston_url,
            versions=PISTON_VERSIONS,
        )
    except PistonServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return TestsResponse(
        status=result.status,
        passed=result.passed,
        total=result.total,
        cases=[CaseOut(**case) for case in result.cases],
        stdout=result.stdout,
        error=result.error,
        stderr=result.stderr,
        exit_code=result.exit_code,
    )


def update_execution(execution_id: str, evidence: dict) -> None:
    try:
        rows = (supabase.table("code_executions").update(evidence)
                .eq("id", execution_id).execute().data)
        if not rows:
            raise RuntimeError("Execution row missing")
    except Exception as exc:
        logger.exception("Could not save execution results")
        raise HTTPException(503, "Run results could not be saved. Please retry before ending the interview.") from exc


@router.post("/run/tests", response_model=TestsResponse)
async def run_session_tests(
    req: TestsRequest,
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
):
    # Preserve standalone runs; session-linked runs require authenticated ownership.
    if req.session_id is None:
        return await run_tests(req)
    user = await get_current_user(creds)
    session_id = str(req.session_id)
    session = get_owned_session(session_id, user["sub"])
    if session["status"] != "in_progress":
        raise HTTPException(400, "Session already completed")
    if session["problem_slug"] != req.slug:
        raise HTTPException(400, "Run problem does not match session")
    language = {"python3": "python", "java": "java"}.get(session["language"])
    if language != req.language:
        raise HTTPException(400, "Run language does not match session")

    # Reserve a record before execution: storage failure must never silently allow
    # a session Run with no record. Results replace this initial status afterward.
    try:
        rows = (supabase.table("code_executions").insert({
            "session_id": session_id, "code": req.code, "language": session["language"],
            "status": "Running",
        }).execute().data)
        execution_id = rows[0]["id"]
    except Exception as exc:
        logger.exception("Could not create execution record")
        raise HTTPException(503, "Run logging is unavailable. Check the code_executions migration before retrying.") from exc
    started = time.monotonic()
    try:
        result = await run_tests(req)
    except Exception as exc:
        detail = str(exc.detail) if isinstance(exc, HTTPException) else "Code execution failed"
        update_execution(execution_id, {
            "status": "Execution Error", "stdout": "", "stderr": limit_output(detail),
            "exit_code": None, "test_results": [], "passed_count": None, "total_count": None,
            "execution_time_ms": round((time.monotonic() - started) * 1000),
        })
        if isinstance(exc, HTTPException):
            raise
        logger.exception("Session code execution failed")
        raise HTTPException(502, "Code execution failed") from exc
    update_execution(execution_id, {
        "status": result.status, "stdout": result.stdout,
        "stderr": result.stderr or result.error or "", "exit_code": result.exit_code,
        "test_results": [case.model_dump() for case in result.cases],
        "passed_count": result.passed, "total_count": result.total,
        "execution_time_ms": round((time.monotonic() - started) * 1000),
    })
    return result
