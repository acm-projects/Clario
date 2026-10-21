from __future__ import annotations

import logging
from typing import Literal, Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from config import settings
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


def load_problem(slug: str) -> Optional[dict]:
    """Load the same live-first/Supabase-fallback data used by problem routes."""
    return get_problem(slug)


class TestsRequest(BaseModel):
    slug: str
    language: Literal["python", "java"]
    code: str = Field(min_length=1, max_length=50_000)


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


@router.post("/run/tests", response_model=TestsResponse)
async def run_tests(req: TestsRequest):
    try:
        problem = load_problem(req.slug)
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
    )
