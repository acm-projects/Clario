from __future__ import annotations

import secrets
from typing import Optional

from fastapi import APIRouter, Header, HTTPException

from db import supabase
from config import settings

router = APIRouter(prefix="/api/scenarios")

# Columns that are safe to send to the browser. The public endpoints select ONLY
# these, so hidden_details, base_problem_slug and test_cases never leave the
# database layer for a public request, even if someone edits the code later.
LIST_COLUMNS = "slug, company, title, difficulty"
DETAIL_COLUMNS = "slug, company, title, difficulty, prompt, starter_code"


def fetch_scenario(slug: str) -> Optional[dict]:
    """Full row, including hidden_details, base_problem_slug and test_cases.

    BACKEND USE ONLY. The interviewer prompt, the feedback report and /run/tests
    can import this directly instead of calling the HTTP endpoint:
        from routers.scenarios import fetch_scenario
    """
    rows = (
        supabase.table("scenario_questions")
        .select("*")
        .eq("slug", slug)
        .execute()
        .data
    )
    return rows[0] if rows else None


def require_internal_key(x_internal_key: Optional[str]) -> None:
    expected = settings.internal_api_key
    if not expected:
        # Fail closed: with no key configured, nobody gets in.
        raise HTTPException(status_code=503, detail="Internal endpoint not configured")
    if not x_internal_key or not secrets.compare_digest(
        x_internal_key.encode(), expected.encode()
    ):
        raise HTTPException(status_code=403, detail="Forbidden")


@router.get("")
def list_scenarios(company: Optional[str] = None):
    query = supabase.table("scenario_questions").select(LIST_COLUMNS)
    if company:
        # ilike with no wildcards is a case-insensitive match: "bumble" finds "Bumble"
        query = query.ilike("company", company)
    return query.order("company").order("title").execute().data


@router.get("/{slug}")
def get_scenario(slug: str):
    rows = (
        supabase.table("scenario_questions")
        .select(DETAIL_COLUMNS)
        .eq("slug", slug)
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return rows[0]


@router.get("/{slug}/internal")
def get_scenario_internal(
    slug: str, x_internal_key: Optional[str] = Header(default=None)
):
    require_internal_key(x_internal_key)
    row = fetch_scenario(slug)
    if row is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return row
