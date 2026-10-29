
import logging

from fastapi import APIRouter

from company_questions import get_available_companies
from db import supabase

router = APIRouter(prefix="/api/companies", tags=["Companies"])

logger = logging.getLogger(__name__)


@router.get("")
def list_companies():
    # Step 1: Retrieve companies with existing scenarios.
    rows = (
        supabase.table("scenario_questions")
        .select("company")
        .execute()
        .data
    ) or []

    companies = {
        row["company"].strip()
        for row in rows
        if row.get("company") and row["company"].strip()
    }

    # Step 2: Add companies from the GitHub repository.
    try:
        github_companies = get_available_companies()
        companies.update(github_companies)

    except Exception as exc:
        logger.warning(
            "GitHub company lookup failed: %s",
            exc,
        )

    # Step 3: Remove case-insensitive duplicates.
    unique_companies = {}

    for company in companies:
        key = company.casefold()

        if key not in unique_companies:
            unique_companies[key] = company

    return sorted(
        unique_companies.values(),
        key=str.casefold,
    )
