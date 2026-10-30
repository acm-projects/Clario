from datetime import datetime, timezone
import json
import random
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ValidationError
from auth import get_current_user
from db import supabase

router = APIRouter(prefix="/api")


class AssessmentAnswers(BaseModel):
    experience: Literal["beginner", "intermediate", "advanced"]
    confident_topics: list[str] = []
    struggle_topics: list[str] = []
    companies: list[str] = []
    language: Literal["python3", "java"]
    timeline: Literal["this_month", "one_to_three_months", "later"]


@router.post("/assessment")
def save_assessment(body: AssessmentAnswers, user=Depends(get_current_user)):
    row = {
        "user_id": user["sub"],
        "answers": body.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    result = (
        supabase.table("user_assessments")
        .upsert(row, on_conflict="user_id")
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save assessment")

    return result.data[0]


@router.get("/assessment/me")
def get_my_assessment(user=Depends(get_current_user)):
    result = (
        supabase.table("user_assessments")
        .select("*")
        .eq("user_id", user["sub"])
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="No assessment yet")

    return result.data[0]


def normalize_topics(value) -> list[str]:
    """JSONB normally arrives decoded; tolerate JSON-encoded lists too."""
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except ValueError:
            return []
    if not isinstance(value, list):
        return []
    return list(dict.fromkeys(topic for topic in value if isinstance(topic, str) and topic))


def filter_by_difficulty(problems: list[dict], answers: AssessmentAnswers | None) -> list[dict]:
    allowed = {"Easy", "Medium"}
    if answers is not None:
        allowed = {
            "beginner": {"Easy"},
            "intermediate": {"Medium"},
            "advanced": {"Medium", "Hard"},
        }[answers.experience].copy()
        if answers.timeline == "this_month":
            # Expand upward first; advanced already includes Hard, so add Easy.
            additional = {"beginner": "Medium", "intermediate": "Hard", "advanced": "Easy"}
            allowed.add(additional[answers.experience])
    return [problem for problem in problems if problem["difficulty"] in allowed]


def score_problem(problem: dict, answers: AssessmentAnswers) -> int:
    topics = set(normalize_topics(problem.get("topics")))
    struggling = set(answers.struggle_topics)
    # Struggling wins when a topic is selected in both lists; count each topic once.
    confident = set(answers.confident_topics) - struggling
    return 3 * len(topics & struggling) - 2 * len(topics & confident)


def shuffle_ties(scored: list[tuple[int, dict]]) -> list[dict]:
    """Shuffle first, then use stable sorting to preserve randomness within ties."""
    shuffled = list(scored)
    random.shuffle(shuffled)
    shuffled.sort(key=lambda item: item[0], reverse=True)
    return [problem for _, problem in shuffled]


def read_all_rows(query) -> list[dict]:
    """Page past PostgREST's row limit for catalogs and completed history."""
    rows = []
    page_size = 500
    while True:
        page = query.order("id").range(len(rows), len(rows) + page_size - 1).execute().data or []
        rows.extend(page)
        if len(page) < page_size:
            return rows


def load_assessment(user_id: str) -> AssessmentAnswers | None:
    assessments = (
        supabase.table("user_assessments").select("answers")
        .eq("user_id", user_id).limit(1).execute().data
    )
    if assessments:
        try:
            return AssessmentAnswers.model_validate(assessments[0]["answers"])
        except ValidationError:
            raise HTTPException(status_code=409, detail="Saved assessment format is unsupported. Please retake the assessment.")
    return None


def load_problems() -> list[dict]:
    return read_all_rows(supabase.table("problems").select("id,slug,title,difficulty,topics"))


def get_completed_problem_slugs(user_id: str, problems: list[dict]) -> set[str]:
    """Resolve both slug-based sessions and older sessions linked by problem ID."""
    completed = read_all_rows(
        supabase.table("interview_sessions").select("problem_slug,problem_id")
        .eq("user_id", user_id).eq("status", "completed")
    )
    completed_slugs = {row.get("problem_slug") for row in completed if row.get("problem_slug")}
    completed_ids = {row.get("problem_id") for row in completed if row.get("problem_id")}
    completed_slugs.update(
        row["slug"] for row in problems if row.get("id") in completed_ids and row.get("slug")
    )
    return completed_slugs


def rank_recommendations(problems: list[dict], answers: AssessmentAnswers | None, limit: int) -> list[dict]:
    # TODO: companies - integrate CLA-68 company tags
    ranked = shuffle_ties([(score_problem(problem, answers) if answers else 0, problem) for problem in problems])
    selected = ranked[:limit]
    if answers is None and limit >= 2:
        # Keep the fallback a mix when both levels are available in the catalog.
        for difficulty in ("Easy", "Medium"):
            if not any(problem["difficulty"] == difficulty for problem in selected):
                alternative = next((problem for problem in ranked if problem["difficulty"] == difficulty), None)
                if alternative is not None:
                    selected[-1] = alternative
    return selected


def generate_reason(problem: dict, answers: AssessmentAnswers | None) -> str:
    matches = [topic for topic in problem["topics"] if answers and topic in answers.struggle_topics]
    if matches:
        return f"You said you struggle with {', '.join(matches)}."
    if answers:
        return "Matches your current difficulty level."
    return "Suggested starting problem."


@router.get("/recommendations")
def get_recommendations(
    limit: int = Query(default=5, ge=1, le=20),
    user=Depends(get_current_user),
):
    answers = load_assessment(user["sub"])
    records = load_problems()
    completed_slugs = get_completed_problem_slugs(user["sub"], records)
    problems = []
    seen = set()
    for row in records:
        slug = row.get("slug")
        if not slug or slug in seen or slug in completed_slugs:
            continue
        seen.add(slug)
        problems.append({
            "slug": slug,
            "title": row["title"],
            "difficulty": str(row.get("difficulty") or "").strip().title(),
            "topics": normalize_topics(row.get("topics")),
        })
    eligible = filter_by_difficulty(problems, answers)
    selected = rank_recommendations(eligible, answers, limit)
    for problem in selected:
        problem["reason"] = generate_reason(problem, answers)
    return {"has_assessment": answers is not None, "problems": selected}
