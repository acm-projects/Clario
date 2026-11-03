from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo
import json
import logging
import httpx
import random
from typing import Annotated, Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, ValidationError, field_validator, model_validator
from auth import get_current_user
from db import supabase
from leetcode import get_problem_list

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")
Rating = Annotated[int, Field(ge=1, le=10, strict=True)]


def today_chicago() -> date:
    return datetime.now(ZoneInfo("America/Chicago")).date()


def language_key(value: str) -> str:
    key = value.strip().lower()
    return "python" if key == "python3" else key


class AssessmentAnswers(BaseModel):
    experience: Literal["beginner", "intermediate", "advanced"]
    confident_topics: list[str] = []
    struggle_topics: list[str] = []
    companies: list[str] = []
    language: Literal["python3", "java"]
    timeline: Literal["this_month", "one_to_three_months", "later"] | None = None
    preferred_language: str | None = None
    other_language_used: str | None = None
    language_comfort: dict[str, Rating] | Rating | None = None
    interview_date: str | None = None
    has_leetcode_experience: bool | None = None
    has_coding_experience: bool | None = None
    languages_used: Literal["Python", "Java", "both", "neither", "other"] | None = None
    weekly_interview_goal: Annotated[int, Field(ge=1, le=5)] | None = None
    interview_confidence: Annotated[int, Field(ge=0, le=10)] | None = None

    @field_validator("interview_date")
    @classmethod
    def valid_date(cls, value):
        if value is not None:
            try:
                parsed = date.fromisoformat(value)
            except ValueError:
                raise ValueError("Choose a valid interview date in YYYY-MM-DD format.")
            if parsed.isoformat() != value:
                raise ValueError("Use YYYY-MM-DD for the interview date.")
        return value

    @field_validator("language_comfort")
    @classmethod
    def normalize_rating_keys(cls, value):
        if isinstance(value, dict):
            normalized = {}
            for key, rating in value.items():
                key = language_key(key)
                if not key or key in normalized:
                    raise ValueError("Language rating names must be unique and nonempty.")
                normalized[key] = rating
            return normalized
        return value


class AssessmentSubmission(AssessmentAnswers):
    interview_date: str
    language_comfort: dict[str, Rating]

    @model_validator(mode="after")
    def required_answers(self):
        if date.fromisoformat(self.interview_date) < today_chicago():
            raise ValueError("Choose today or a future interview date.")
        applicable = {"python", "java"}
        for language in (self.preferred_language, self.other_language_used):
            if language and language.strip():
                applicable.add(language_key(language))
        if not applicable.issubset(self.language_comfort):
            raise ValueError("Rate Python, Java, and each custom language from 1 to 10.")
        # Removed custom languages must not retain a rating in the saved JSON.
        self.language_comfort = {key: value for key, value in self.language_comfort.items() if key in applicable}
        return self


@router.post("/assessment")
def save_assessment(body: AssessmentSubmission, user=Depends(get_current_user)):
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


def interview_is_close(answers: AssessmentAnswers) -> bool:
    if not answers.interview_date:
        return False
    days = (date.fromisoformat(answers.interview_date) - today_chicago()).days
    return 0 <= days <= 21


def filter_by_difficulty(problems: list[dict], answers: AssessmentAnswers | None) -> list[dict]:
    allowed = {"Easy", "Medium"}
    if answers is not None:
        normal = {"beginner": {"Easy"}, "intermediate": {"Easy", "Medium"}, "advanced": {"Medium"}}
        close = {"beginner": {"Easy", "Medium"}, "intermediate": {"Medium", "Hard"}, "advanced": {"Medium", "Hard"}}
        allowed = (close if interview_is_close(answers) else normal)[answers.experience]
    return [problem for problem in problems if problem["difficulty"] in allowed]


# Related topics broaden practice without outweighing a direct struggle match.
RELATED_TOPIC_GROUPS = (
    {"Array", "String", "Hash Table", "Two Pointers", "Sliding Window"},
    {"Sorting", "Binary Search", "Array"},
    {"Linked List", "Stack", "Queue"},
    {"Tree", "Binary Tree", "Binary Search Tree", "Recursion", "Depth-First Search", "Breadth-First Search"},
    {"Graph", "Union Find", "Depth-First Search", "Breadth-First Search"},
    {"Dynamic Programming", "Backtracking", "Recursion"},
)


def related_struggle_topics(answers: AssessmentAnswers) -> set[str]:
    struggling = set(answers.struggle_topics)
    return set().union(*(group for group in RELATED_TOPIC_GROUPS if group & struggling)) - struggling


def safe_recommendation_pool(problems: list[dict], answers: AssessmentAnswers | None) -> list[dict]:
    # Intermediate Hard is reserved for the existing 21-day window. Beginners
    # may broaden from Easy to Medium but never to Hard to fill their list.
    allowed = {"Easy", "Medium"}
    if answers and answers.experience == "advanced":
        allowed = {"Medium", "Hard"}
    elif answers and answers.experience == "intermediate" and interview_is_close(answers):
        allowed = {"Easy", "Medium", "Hard"}
    return [problem for problem in problems if problem["difficulty"] in allowed]


def select_recommendations(problems: list[dict], answers: AssessmentAnswers | None, limit: int) -> list[dict]:
    primary = filter_by_difficulty(problems, answers)
    selected = rank_recommendations(primary, answers, limit)
    if len(selected) < limit:
        primary_slugs = {problem["slug"] for problem in primary}
        adjacent = [problem for problem in safe_recommendation_pool(problems, answers) if problem["slug"] not in primary_slugs]
        selected.extend(rank_recommendations(adjacent, answers, limit - len(selected)))
    return selected


def difficulty_bonus(problem: dict, answers: AssessmentAnswers) -> int:
    # A small preference shapes the mix; topic matches (3 points each) stay stronger.
    preferred = {"beginner": "Easy", "intermediate": "Medium", "advanced": "Hard" if interview_is_close(answers) else "Medium"}[answers.experience]
    return int(problem["difficulty"] == preferred)


def score_problem(problem: dict, answers: AssessmentAnswers) -> int:
    topics = set(normalize_topics(problem.get("topics")))
    struggling = set(answers.struggle_topics)
    # Struggling wins when a topic is selected in both lists; count each topic once.
    confident = set(answers.confident_topics) - struggling
    return 3 * len(topics & struggling) - 2 * len(topics & confident)


def shuffle_ties(scored: list[tuple[float, dict]]) -> list[dict]:
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


def load_additional_problems() -> list[dict]:
    """Use the same public, supported source as the Problem Library; no writes."""
    try:
        return get_problem_list()
    except (httpx.HTTPError, ValueError, TypeError) as error:
        logger.warning("Recommendation pool expansion unavailable: %s", type(error).__name__)
        return []


def collect_eligible_records(records: list[dict], completed_slugs: set[str], seen: set[str]) -> list[dict]:
    problems = []
    for row in records:
        slug = row.get("slug")
        title = row.get("title")
        difficulty = str(row.get("difficulty") or "").strip().title()
        if not isinstance(slug, str) or not slug.strip() or not isinstance(title, str) or not title.strip():
            continue
        slug = slug.strip()
        if slug in seen or slug in completed_slugs or difficulty not in {"Easy", "Medium", "Hard"}:
            continue
        seen.add(slug)
        problems.append({"slug": slug, "title": title.strip(), "difficulty": difficulty, "topics": normalize_topics(row.get("topics"))})
    return problems


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
    # Company matching is unavailable: the audited problems schema and public
    # source expose no company tags/mapping (CLA-68). Preserve saved preferences
    # without inventing associations or claiming company-based ranking.
    ranked = shuffle_ties([((score_problem(problem, answers) + difficulty_bonus(problem, answers) + (0.5 if set(problem["topics"]) & related_struggle_topics(answers) else 0)) if answers else 0, problem) for problem in problems])
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
        related = [topic for topic in problem["topics"] if topic in related_struggle_topics(answers)]
        if related:
            return f"Builds related skills in {', '.join(related)} for your focus topics."
        if problem not in filter_by_difficulty([problem], answers):
            return "Adds practice at a suitable adjacent difficulty for your experience."
        return "Matches your current difficulty level."
    return "Suggested starting problem."


@router.get("/recommendations")
def get_recommendations(
    limit: int = Query(default=25, ge=20, le=25),
    user=Depends(get_current_user),
):
    answers = load_assessment(user["sub"])
    records = load_problems()
    completed_slugs = get_completed_problem_slugs(user["sub"], records)
    seen = set()
    problems = collect_eligible_records(records, completed_slugs, seen)
    if len(safe_recommendation_pool(problems, answers)) < limit:
        problems.extend(collect_eligible_records(load_additional_problems(), completed_slugs, seen))
    eligible = safe_recommendation_pool(problems, answers)
    selected = select_recommendations(problems, answers, limit)
    for problem in selected:
        problem["reason"] = generate_reason(problem, answers)
    shortfall = None
    if len(selected) < 20:
        shortfall = (
            f"Only {len(selected)} unique, uncompleted problems suitable for your practice level are available. "
            "The saved catalog and available library source contain too few suitable problems after completed problems and unsuitable difficulty levels are excluded."
        )
    return {
        "has_assessment": answers is not None, "problems": selected,
        "target_count": limit, "minimum_count": 20, "eligible_count": len(eligible),
        "shortfall_message": shortfall,
    }
