import os
import secrets

from company_scenario_service import build_company_scenario
from fastapi import APIRouter, Header, HTTPException

from db import supabase

router = APIRouter(prefix="/api/scenarios")

# Columns that are safe to send to the browser. The public endpoints select ONLY
# these, so hidden_details, base_problem_slug and test_cases never leave the
# database layer for a public request, even if someone edits the code later.
LIST_COLUMNS = "slug, company, title, difficulty"
DETAIL_COLUMNS = "slug, company, title, difficulty, prompt, starter_code"

PUBLIC_FIELDS = (
    "slug",
    "company",
    "title",
    "difficulty",
    "prompt",
    "starter_code",
)


def to_public_scenario(row: dict) -> dict:
    """Return only fields safe for the frontend."""
    return {
        field: row.get(field)
        for field in PUBLIC_FIELDS
    }

def fetch_scenario(slug: str) -> dict | None:
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


def require_internal_key(x_internal_key: str | None) -> None:
    expected = os.getenv("INTERNAL_API_KEY")
    if not expected:
        # Fail closed: with no key configured, nobody gets in.
        raise HTTPException(status_code=503, detail="Internal endpoint not configured")
    if not x_internal_key or not secrets.compare_digest(
        x_internal_key.encode(), expected.encode()
    ):
        raise HTTPException(status_code=403, detail="Forbidden")


@router.get("")
def list_scenarios(company: str | None = None):
    query = supabase.table("scenario_questions").select(LIST_COLUMNS)
    if company:
        # ilike with no wildcards is a case-insensitive match: "bumble" finds "Bumble"
        query = query.ilike("company", company)
    return query.order("company").order("title").execute().data


@router.get("/generate")
def generate_scenario(company: str):
    company = company.strip()

    if not company:
        raise HTTPException(
            status_code=400,
            detail="Company name cannot be empty",
        )

    try:
        # Retrieve a cached scenario or generate a new one.
        scenario = build_company_scenario(company)

        # Return only public fields.
        return to_public_scenario(scenario)

    except Exception as exc:
        # Log the failure without exposing internal errors.
        import logging

        logging.getLogger(__name__).warning(
            "Generation failed for %s: %s",
            company,
            exc,
        )

        # First fallback: hand-written scenario for this company.
        rows = (
            supabase.table("scenario_questions")
            .select("*")
            .ilike("company", company)
            .eq("source", "hand_written")
            .limit(1)
            .execute()
            .data
        )

        # Second fallback: any available hand-written scenario.
        if not rows:
            rows = (
                supabase.table("scenario_questions")
                .select("*")
                .eq("source", "hand_written")
                .limit(1)
                .execute()
                .data
            )

        if not rows:
            raise HTTPException(
                status_code=503,
                detail="No scenarios currently available",
            )

        return to_public_scenario(rows[0])


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
def get_scenario_internal(slug: str, x_internal_key: str | None = Header(default=None)):
    require_internal_key(x_internal_key)
    row = fetch_scenario(slug)
    if row is None:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return row
