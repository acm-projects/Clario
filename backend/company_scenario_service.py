
import logging
import random
import re
import uuid

from leetcode_test_cases import extract_test_cases
from company_questions import get_company_problem_slugs
from db import supabase
from leetcode import get_problem, _db_problem
from scenario_generator import generate_scenario_framing

logger = logging.getLogger(__name__)


def get_cached_scenario(company: str, problem_slug: str) -> dict | None:
    """
    Return an existing generated scenario for a company
    and LeetCode problem, if one exists.
    """
    rows = (
        supabase.table("scenario_questions")
        .select("*")
        .ilike("company", company)
        .eq("base_problem_slug", problem_slug)
        .eq("source", "generated")
        .limit(1)
        .execute()
        .data
    )

    return rows[0] if rows else None

def save_generated_scenario(scenario: dict) -> dict:
    """
    Save a generated scenario to Supabase.

    Reuse an existing scenario if the same company and
    LeetCode problem have already been generated.
    """

    company = scenario["company"].strip()
    problem_slug = scenario["base_problem_slug"]

    # Check the cache before inserting.
    cached = get_cached_scenario(company, problem_slug)

    if cached:
        return cached

    # Validate required data before saving.
    test_cases = scenario.get("test_cases")
    starter_code = scenario.get("starter_code")

    if (
        not isinstance(test_cases, list)
        or not test_cases
        or not all(
            isinstance(case, dict)
            and "input" in case
            and "expected" in case
            and isinstance(case["input"], list)
            for case in test_cases
        )
    ):
        raise ValueError("Invalid or missing test cases")

    if not isinstance(starter_code, dict) or not starter_code:
        raise ValueError("Missing LeetCode starter code")

    company_slug = re.sub(
        r"[^a-z0-9]+",
        "-",
        company.lower(),
    ).strip("-")

    unique_id = uuid.uuid4().hex[:8]

    slug = f"{company_slug}-{problem_slug}-{unique_id}"

    record = {
        "slug": slug,
        "company": company,
        "title": scenario["title"],
        "difficulty": scenario["difficulty"],
        "base_problem_slug": problem_slug,
        "prompt": scenario["prompt"],
        "hidden_details": scenario["hidden_details"],
        "starter_code": starter_code,
        "test_cases": test_cases,
        "source": "generated",
    }

    try:
        result = (
            supabase.table("scenario_questions")
            .insert(record)
            .execute()
        )
        return result.data[0]

    except Exception:
        # Another request may have inserted the same scenario.
        cached = get_cached_scenario(company, problem_slug)

        if cached:
            return cached

        raise


def build_company_scenario(company: str) -> dict:
    """
    Retrieve or generate a company-specific interview scenario.

    1. Reuse an existing generated scenario.
    2. Retrieve company-tagged LeetCode problems.
    3. Prefer problems saved in Supabase.
    4. Generate scenario framing with Gemini.
    5. Save and return the generated scenario.
    """

    company = company.strip()

    if not company:
        raise ValueError("Company name cannot be empty")

    # Step 1: Check for any previously generated scenario
    # for this company before calling external services.
    existing = (
        supabase.table("scenario_questions")
        .select("*")
        .ilike("company", company)
        .eq("source", "generated")
        .limit(1)
        .execute()
        .data
    )

    if existing:
        logger.info(
            "Returning cached scenario for %s",
            company,
        )
        return existing[0]

    # Step 2: Retrieve company-tagged LeetCode problems.
    slugs = get_company_problem_slugs(company)

    if not slugs:
        raise ValueError(
            f"No LeetCode questions found for {company}"
        )

    # Step 3: Find tagged problems saved in Supabase.
    saved_rows = (
        supabase.table("problems")
        .select("slug")
        .in_("slug", slugs)
        .execute()
        .data
    ) or []

    saved_slugs = [
        row["slug"]
        for row in saved_rows
        if row.get("slug")
    ]

    saved_slug_set = set(saved_slugs)

    other_slugs = [
        slug
        for slug in slugs
        if slug not in saved_slug_set
    ]

    random.shuffle(saved_slugs)
    random.shuffle(other_slugs)

    candidate_slugs = saved_slugs + other_slugs

    logger.info(
        "Company %s: %d tagged questions, %d saved locally",
        company,
        len(slugs),
        len(saved_slugs),
    )

    # Step 4: Try up to five problems.
    for slug in candidate_slugs[:5]:
        try:
            # Reuse an existing scenario for this problem.
            cached = get_cached_scenario(company, slug)

            if cached:
                return cached

            # Prefer Supabase to avoid Alfa API rate limits.
            problem = _db_problem(slug)

            if not problem:
                problem = get_problem(slug)

            if not problem or not problem.get("description_html"):
                continue

            # Extract executable test cases.
            test_cases = extract_test_cases(problem)

            if not test_cases:
                logger.warning(
                    "Skipping %s: no supported test cases",
                    slug,
                )
                continue

            # Ensure original starter code is available.
            starter_code = problem.get("starter_code") or {}

            if not starter_code:
                logger.warning(
                    "Skipping %s: missing starter code",
                    slug,
                )
                continue

            # Generate framing only.
            framing = generate_scenario_framing(
                company=company,
                problem=problem,
            )

            scenario = {
                "company": company,
                "base_problem_slug": problem["slug"],
                "title": framing["title"],
                "prompt": framing["prompt"],
                "difficulty": problem["difficulty"],
                "hidden_details": framing["hidden_details"],
                "starter_code": starter_code,
                "test_cases": test_cases,
            }

            return save_generated_scenario(scenario)

        except Exception as exc:
            logger.warning(
                "Scenario generation failed for %s/%s: %s",
                company,
                slug,
                exc,
            )

            # Find the original exception, including wrapped
            # Gemini API errors.
            root_error = exc
            while root_error.__cause__ is not None:
                root_error = root_error.__cause__

            # Do not retry when the Gemini quota is exhausted.
            if (
                getattr(root_error, "code", None) == 429
                and "RESOURCE_EXHAUSTED" in str(root_error)
            ):
                raise RuntimeError(
                    "Gemini API quota exhausted. "
                    "Use a cached or hand-written scenario."
                ) from exc

    raise RuntimeError(
        f"Could not generate a scenario for {company}"
    )
