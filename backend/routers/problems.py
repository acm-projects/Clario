from fastapi import APIRouter, HTTPException

from leetcode import get_problem_list, get_problem

router = APIRouter(prefix="/api/problems")


@router.get("")
def list_problems(difficulty: str | None = None, topic: str | None = None, search: str | None = None):
    return get_problem_list(difficulty, topic, search)


@router.get("/{slug}")
def problem_detail(slug: str):
    problem = get_problem(slug)
    if problem is None:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem