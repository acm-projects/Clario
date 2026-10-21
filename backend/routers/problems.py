import random
import httpx
from fastapi import APIRouter, HTTPException

from leetcode import get_problem_list, get_problem

router = APIRouter(prefix="/api/problems")


@router.get("")
def list_problems(difficulty: str | None = None, topic: str | None = None, search: str | None = None):
    try:
        return get_problem_list(difficulty, topic, search)
    except httpx.HTTPError:
        # live API failed AND there is nothing saved to fall back on
        raise HTTPException(status_code=503, detail="Problem service unavailable")


@router.get("/random")
def random_problem(difficulty: str | None = None, topic: str | None = None):
    try:
        problems = get_problem_list(difficulty, topic)
        if not problems:
            raise HTTPException(status_code=404, detail="No matching problems found")
        problem = get_problem(random.choice(problems)["slug"])
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="Problem service unavailable")
    if problem is None:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem


@router.get("/{slug}")
def problem_detail(slug: str):
    try:
        problem = get_problem(slug)
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="Problem service unavailable")
    if problem is None:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem