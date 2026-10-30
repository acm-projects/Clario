"""Progress derived from the signed-in user's saved interviews and reports."""
from collections import defaultdict
from fastapi import APIRouter, Depends
from auth import get_current_user
from db import supabase
from routers.feedback import get_stored_problem

router = APIRouter(prefix="/api/progress", tags=["progress"])
STEPS = ("understand", "match", "plan", "implement", "review", "evaluate")


def all_rows(query):
    rows, offset = [], 0
    while True:
        page = query.range(offset, offset + 499).execute().data
        rows.extend(page)
        if len(page) < 500:
            return rows
        offset += 500


def progress_rows(user_id):
    sessions = all_rows(supabase.table("interview_sessions").select("id,problem_slug,problem_id,mode,ended_at").eq("user_id", user_id).eq("status", "completed").order("ended_at").order("id"))
    reports, events = {}, []
    for start in range(0, len(sessions), 200):
        ids = [s["id"] for s in sessions[start:start + 200]]
        saved = all_rows(supabase.table("feedback_reports").select("id,session_id,overall_score,technical_score,reasoning_score,communication_score,created_at").in_("session_id", ids).order("created_at", desc=True).order("id"))
        for report in saved:
            reports.setdefault(report["session_id"], report)
        events.extend(all_rows(supabase.table("session_events").select("session_id,event_type,metadata,created_at").in_("session_id", ids).in_("event_type", ["step_completed", "step_skipped"]).order("created_at").order("id")))
    problems = {}
    history = []
    for session in sessions:
        if not session.get("ended_at"):
            continue
        key = session.get("problem_slug") or session.get("problem_id")
        if key not in problems:
            problems[key] = get_stored_problem(session) if key else None
        problem = problems[key] or {}
        report = reports.get(session["id"], {})
        slug = session.get("problem_slug")
        history.append({"session_id": session["id"], "date": session["ended_at"], "problem_slug": slug,
            "problem_title": problem.get("title"), "difficulty": problem.get("difficulty"),
            "mode": "repo_debugging" if (slug or "").startswith("repo-debugging:") else "system_design" if (slug or "").startswith("system-design:") else session["mode"],
            "overall_score": report.get("overall_score"), "problem_solving_score": report.get("reasoning_score"),
            "technical_score": report.get("technical_score"), "communication_score": report.get("communication_score")})
    return history, problems, events


def mean(values):
    values = [v for v in values if v is not None]
    return round(sum(values) / len(values), 1) if values else None


def summarize(history, events):
    latest_steps = {}
    for event in events:
        step = (event.get("metadata") or {}).get("step")
        if step in STEPS:
            latest_steps[(event["session_id"], step)] = event["event_type"]
    rates = {}
    for step in STEPS:
        observed = [value for (_, key), value in latest_steps.items() if key == step]
        rates[step] = round(observed.count("step_skipped") / len(observed), 2) if observed else None
    scored = [row["overall_score"] for row in history if row["overall_score"] is not None]
    return {"total_sessions": len(history), "average_overall": mean(scored),
        "average_by_category": {"problem_solving": mean([r["problem_solving_score"] for r in history]), "technical": mean([r["technical_score"] for r in history]), "communication": mean([r["communication_score"] for r in history])},
        "latest_overall": scored[-1] if scored else None, "change_vs_first": round(scored[-1] - scored[0], 1) if len(scored) > 1 else None, "umpire_miss_rate": rates}


@router.get("/history")
def history(user: dict = Depends(get_current_user)):
    return progress_rows(user["sub"])[0]


@router.get("/summary")
def summary(user: dict = Depends(get_current_user)):
    rows, _, events = progress_rows(user["sub"])
    return summarize(rows, events)


@router.get("/topics")
def topics(user: dict = Depends(get_current_user)):
    rows, _, _ = progress_rows(user["sub"])
    scores = defaultdict(list)
    slugs = list({r["problem_slug"] for r in rows if r.get("problem_slug") and not r["problem_slug"].startswith("repo-debugging:")})
    tags = {}
    for start in range(0, len(slugs), 200):
        for problem in all_rows(supabase.table("problems").select("slug,topics").in_("slug", slugs[start:start + 200]).order("id")):
            tags[problem["slug"]] = problem.get("topics") or []
    for row in rows:
        if row["overall_score"] is not None:
            for topic in set(tags.get(row["problem_slug"], [])):
                scores[topic].append(row["overall_score"])
    topics = sorted([{"topic": topic, "attempts": len(values), "average_overall": mean(values)} for topic, values in scores.items()], key=lambda r: (r["average_overall"], r["topic"]))
    return {"topics": topics, "weak_topics": [r["topic"] for r in topics if r["attempts"] >= 2 and r["average_overall"] < 60][:3]}
