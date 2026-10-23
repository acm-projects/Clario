import random
from typing import Literal

from fastapi import HTTPException, Query
from db import supabase

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
def get_random_problem(
    difficulty: Literal["Easy", "Medium", "Hard"] | None = Query(default=None),
):
    query = supabase.table("problems").select("slug")

    if difficulty is not None:
        query = query.eq("difficulty", difficulty)

    rows = query.execute().data

    if not rows:
        raise HTTPException(
            status_code=404,
            detail="No problems found for the selected difficulty"
        )

    selected_slug = random.choice(rows)["slug"]

    result = (
        supabase.table("problems")
        .select(
            "slug, leetcode_id, title, difficulty, topics, "
            "description_html, example_testcases, starter_code"
        )
        .eq("slug", selected_slug)
        .execute()
        .data
    )

    if not result:
        raise HTTPException(status_code=404, detail="Problem not found")

    return result[0]

@router.get("/{slug}")
def problem_detail(slug: str):
    try:
        problem = get_problem(slug)
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="Problem service unavailable")
    if problem is None:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem