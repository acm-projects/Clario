
from fastapi import APIRouter, Depends
from auth import get_current_user
from db import supabase

router = APIRouter(prefix="/api/progress", tags=["progress"])

UMPIRE_STEPS = [
    "understand", "match", "plan",
    "implement", "review", "evaluate"
]


def _average(values):
    valid = [float(v) for v in values if v is not None]
    return round(sum(valid) / len(valid), 1) if valid else None


def get_counted_sessions(user_id: str):
    rows = (
        supabase.table("interview_sessions")
        .select(
            "id, problem_slug, mode, started_at, "
            "ended_at, feedback_reports(*)"
        )
        .eq("user_id", user_id)
        .eq("status", "completed")
        .execute()
        .data
    )

    counted = []

    for row in rows:
        reports = row.get("feedback_reports")

        if isinstance(reports, list):
            report = reports[0] if reports else None
        else:
            report = reports

        if not report:
            continue

        row["feedback"] = report
        row["date"] = row.get("ended_at") or row.get("started_at")
        counted.append(row)

    return sorted(counted, key=lambda s: s["date"] or "")


def get_problem_lookup(slugs):
    unique = list({slug for slug in slugs if slug})

    if not unique:
        return {}

    rows = (
        supabase.table("problems")
        .select("slug, title, difficulty, topics")
        .in_("slug", unique)
        .execute()
        .data
    )

    return {row["slug"]: row for row in rows}


def _umpire_rates(sessions):
    if not sessions:
        return {step: None for step in UMPIRE_STEPS}

    session_ids = [s["id"] for s in sessions]

    events = (
        supabase.table("session_events")
        .select("session_id, event_type, metadata, created_at")
        .in_("session_id", session_ids)
        .in_("event_type", ["step_completed", "step_skipped"])
        .order("created_at")
        .execute()
        .data
    )

    # Latest event determines each step's state.
    states = {}

    for event in events:
        metadata = event.get("metadata") or {}
        step = metadata.get("step")

        if step not in UMPIRE_STEPS:
            continue

        key = (event["session_id"], step)
        states[key] = event["event_type"]

    rates = {}

    for step in UMPIRE_STEPS:
        known = [
            state for (sid, name), state in states.items()
            if name == step
        ]

        rates[step] = (
            round(
                sum(s == "step_skipped" for s in known) / len(known),
                2
            )
            if known else None
        )

    return rates


@router.get("/history")
def get_history(user=Depends(get_current_user)):
    sessions = get_counted_sessions(user["sub"])
    problems = get_problem_lookup(
        s["problem_slug"] for s in sessions
    )

    history = []

    for session in sessions:
        report = session["feedback"]
        problem = problems.get(session["problem_slug"]) or {}

        history.append({
            "session_id": session["id"],
            "date": session["date"],
            "problem_slug": session["problem_slug"],
            "problem_title": problem.get("title"),
            "difficulty": problem.get("difficulty"),
            "mode": session["mode"],
            "overall_score": report.get("overall_score"),
            "problem_solving_score": report.get("reasoning_score"),
            "technical_score": report.get("technical_score"),
            "communication_score": report.get("communication_score"),
        })

    return history


@router.get("/summary")
def get_summary(user=Depends(get_current_user)):
    sessions = get_counted_sessions(user["sub"])
    reports = [s["feedback"] for s in sessions]

    if not reports:
        return {
            "total_sessions": 0,
            "average_overall": None,
            "average_by_category": {
                "problem_solving": None,
                "technical": None,
                "communication": None,
            },
            "latest_overall": None,
            "change_vs_first": None,
            "umpire_miss_rate": {
                step: None for step in UMPIRE_STEPS
            },
        }

    first = reports[0].get("overall_score")
    latest = reports[-1].get("overall_score")

    change = (
        round(float(latest) - float(first), 1)
        if len(reports) >= 2
        and first is not None
        and latest is not None
        else None
    )

    return {
        "total_sessions": len(reports),
        "average_overall": _average(
            r.get("overall_score") for r in reports
        ),
        "average_by_category": {
            "problem_solving": _average(
                r.get("reasoning_score") for r in reports
            ),
            "technical": _average(
                r.get("technical_score") for r in reports
            ),
            "communication": _average(
                r.get("communication_score") for r in reports
            ),
        },
        "latest_overall": latest,
        "change_vs_first": change,
        "umpire_miss_rate": _umpire_rates(sessions),
    }


def get_topic_stats(user_id: str):
    sessions = get_counted_sessions(user_id)
    problems = get_problem_lookup(
        s["problem_slug"] for s in sessions
    )

    scores_by_topic = {}

    for session in sessions:
        problem = problems.get(session["problem_slug"])

        if not problem:
            continue

        score = session["feedback"].get("overall_score")

        if score is None:
            continue

        for topic in problem.get("topics") or []:
            name = (
                topic.get("name")
                if isinstance(topic, dict)
                else topic
            )

            if name:
                scores_by_topic.setdefault(name, []).append(
                    float(score)
                )

    stats = [
        {
            "topic": topic,
            "attempts": len(scores),
            "average_overall": _average(scores),
        }
        for topic, scores in scores_by_topic.items()
    ]

    return sorted(stats, key=lambda x: x["average_overall"])


def get_weak_topics(user_id: str, limit=3, min_attempts=2):
    return [
        item["topic"]
        for item in get_topic_stats(user_id)
        if item["attempts"] >= min_attempts
    ][:limit]


@router.get("/topics")
def get_topics(user=Depends(get_current_user)):
    stats = get_topic_stats(user["sub"])

    return {
        "topics": stats,
        "weak_topics": [
            item["topic"]
            for item in stats
            if item["attempts"] >= 2
        ][:3],
    }
