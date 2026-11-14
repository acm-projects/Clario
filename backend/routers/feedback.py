import asyncio
import os
from collections.abc import Awaitable, Callable
from datetime import datetime, timezone
from uuid import NAMESPACE_URL, UUID, uuid5

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from auth import get_current_user
from db import supabase
from gemini_feedback import generate_feedback
from feedback_fallback import review_with_fallback
from communication import summarize_captures, transcript_fillers
from routers.sessions import get_owned_session

router = APIRouter(prefix="/api/feedback")
sessions_feedback_router = APIRouter(prefix="/api/sessions")
# Serialize generation in this process; deterministic report IDs also prevent
# duplicate saved reports across workers. Existing reports are returned for free.
generation_lock = asyncio.Lock()
session_generation_locks: dict[str, asyncio.Lock] = {}
# A job claimed longer ago than this died with its worker (restart, --reload, crash):
# Gemini is bounded at ~120s, so a healthy claim is always refreshed sooner.
STALE_PROCESSING_SECONDS = 180
# How long to wait for ElevenLabs' post-call webhook before reporting from the
# transcript captured live during the call.
LIVE_FALLBACK_AFTER_SECONDS = 60
RESUMABLE_STATUSES = ("failed", "pending", "waiting_for_end", "waiting_for_session", "stalled")
LIVE_FALLBACK_LIMITATION = ("The interviewer's final transcript had not arrived, so this report uses the transcript "
                            "captured live during the call. It is regenerated automatically if the final transcript arrives.")

# Share a pending generation for one interview without blocking other interviews.
# Deterministic report IDs also prevent duplicate saved rows across workers.
pending_reports: dict[str, asyncio.Task] = {}


async def singleflight(key: str, generate: Callable[[], Awaitable[dict]]) -> dict:
    task = pending_reports.get(key)
    if task is None:
        task = asyncio.create_task(generate())
        pending_reports[key] = task
        def finished(done):
            if pending_reports.get(key) is done:
                pending_reports.pop(key, None)
            if not done.cancelled():
                done.exception()
        task.add_done_callback(finished)
    return await asyncio.shield(task)
REPORT_COLUMNS = "id, session_id, technical_score, reasoning_score, communication_score, overall_score, strengths, weaknesses, recommendations, report, created_at"


def get_saved_report(session_id: str) -> dict | None:
    rows = supabase.table("feedback_reports").select(REPORT_COLUMNS).eq("session_id", session_id).order("created_at", desc=True).limit(1).execute().data
    return rows[0] if rows else None


def get_stored_problem(session: dict) -> dict | None:
    if session.get("mode") == "company":
        from routers.scenarios import fetch_scenario
        scenario = fetch_scenario(session["problem_slug"])
        if not scenario: return None
        return {"slug": scenario["slug"], "title": scenario["title"], "difficulty": scenario["difficulty"], "description": scenario["prompt"], "topics": []}
    if (session.get("problem_slug") or "").startswith("system-design:"):
        from voice.router import system_design_scenario
        try:
            scenario = system_design_scenario(session["problem_slug"].split(":", 1)[1])
        except HTTPException:
            return None
        return {"slug": session["problem_slug"], "title": scenario["title"], "difficulty": scenario["difficulty"], "description": scenario["prompt"], "topics": scenario.get("topics", [])}
    if (session.get("problem_slug") or "").startswith("repo-debugging:"):
        from services.repo_challenge_service import detail
        try:
            language = session.get("language")
            challenge = detail(session["problem_slug"].split(":", 1)[1], "python" if language == "python3" else language)
        except KeyError:
            return None
        return {"slug": session["problem_slug"], "title": challenge["title"], "difficulty": challenge["difficulty"], "topics": challenge.get("topics", []),
                "description": "\n\n".join([challenge["description"], challenge["objective"], challenge["expectedBehavior"]])}
    query = supabase.table("problems").select("id, slug, title, difficulty, description_html, topics")
    if session.get("problem_slug"):
        query = query.eq("slug", session["problem_slug"])
    elif session.get("problem_id"):
        query = query.eq("id", session["problem_id"])
    else:
        return None
    rows = query.limit(1).execute().data
    if not rows:
        from problem_fallbacks import bundled_problem
        fallback = bundled_problem(session.get("problem_slug"))
        return {"slug": fallback["slug"], "title": fallback["title"], "difficulty": fallback["difficulty"], "description": fallback["description_html"], "topics": fallback.get("topics", [])} if fallback else None
    row = rows[0]
    return {"slug": row["slug"], "title": row["title"], "difficulty": row["difficulty"], "description": (row.get("description_html") or "")[:15000], "topics": row.get("topics") or []}


@router.get("")
def list_feedback(user: dict = Depends(get_current_user)):
    sessions = supabase.table("interview_sessions").select("id, problem_slug, problem_id, mode, language, status, started_at, ended_at").eq("user_id", user["sub"]).eq("status", "completed").order("ended_at", desc=True).limit(100).execute().data
    if not sessions:
        return []
    ids = [session["id"] for session in sessions]
    reports = supabase.table("feedback_reports").select(REPORT_COLUMNS).in_("session_id", ids).order("created_at", desc=True).execute().data
    by_session = {}
    for report in reports:
        by_session.setdefault(report["session_id"], report)
    slugs = list({session["problem_slug"] for session in sessions if session.get("problem_slug")})
    problem_ids = list({session["problem_id"] for session in sessions if not session.get("problem_slug") and session.get("problem_id")})
    columns = "id, slug, title, difficulty"
    problems = supabase.table("problems").select(columns).in_("slug", slugs).execute().data if slugs else []
    if problem_ids:
        problems += supabase.table("problems").select(columns).in_("id", problem_ids).execute().data
    by_slug = {problem["slug"]: problem for problem in problems}
    by_id = {problem["id"]: problem for problem in problems}
    return [{"session": session, "problem": get_stored_problem(session) if session.get("mode") == "company" or (session.get("problem_slug") or "").startswith(("repo-debugging:", "system-design:")) else by_slug.get(session.get("problem_slug")) or by_id.get(session.get("problem_id")), "feedback": by_session.get(session["id"])} for session in sessions]


@router.post("/preview/two-sum")
async def preview_two_sum(request: Request, user: dict = Depends(get_current_user)):
    # This diagnostic never creates sessions or writes reports to the database.
    if os.getenv("DEV_BYPASS_AUTH") != "true" or not request.client or request.client.host not in {"127.0.0.1", "::1", "testclient"}:
        raise HTTPException(status_code=404, detail="Not found")
    from feedback_preview import TWO_SUM_PREVIEW
    report = await singleflight("preview:" + user["sub"], lambda: review_with_fallback(TWO_SUM_PREVIEW, generate_feedback))
    return {"synthetic": True, "saved": False, "evidence": TWO_SUM_PREVIEW, "report": report}


def seconds_since(timestamp: str | None) -> float:
    try:
        moment = datetime.fromisoformat(str(timestamp).replace("Z", "+00:00"))
        if moment.tzinfo is None:
            moment = moment.replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - moment).total_seconds()
    except (TypeError, ValueError):
        return float("inf")


def get_processing_status(session: dict) -> dict | None:
    if not session.get("conversation_id"):
        return None
    rows = (supabase.table("post_call_jobs").select("status, last_error, updated_at")
            .eq("conversation_id", session["conversation_id"]).limit(1).execute().data)
    if not rows:
        return {"status": "waiting_for_transcript", "error": None}
    status = rows[0]["status"]
    if status == "processing" and seconds_since(rows[0].get("updated_at")) > STALE_PROCESSING_SECONDS:
        # Surface it so the client asks us to resume instead of polling forever.
        status = "stalled"
    return {"status": status, "error": rows[0].get("last_error")}


@router.get("/{session_id}")
def read_feedback(session_id: UUID, user: dict = Depends(get_current_user)):
    session = get_owned_session(str(session_id), user["sub"])
    if session["status"] != "completed" or not session.get("ended_at"):
        raise HTTPException(status_code=409, detail="Finish your interview before viewing its report.")
    saved = get_saved_report(str(session_id))
    if saved:
        saved = {**saved, "report": dict(saved.get("report") or {})}
        if "submitted_code" not in saved["report"]:
            snapshots = supabase.table("code_snapshots").select("code").eq("session_id", str(session_id)).order("created_at", desc=True).limit(1).execute().data
            saved["report"]["submitted_code"] = (snapshots[0].get("code") or "")[:40000] if snapshots else ""
    return {"session": session, "problem": get_stored_problem(session), "feedback": saved, "processing": get_processing_status(session)}


@router.post("/{session_id}")
@sessions_feedback_router.post("/{session_id}/feedback")
async def create_feedback(session_id: UUID, background_tasks: BackgroundTasks, refresh_details: bool = False,
                          user: dict = Depends(get_current_user)):
    session_id = str(session_id)
    session = get_owned_session(session_id, user["sub"])
    if session["status"] != "completed" or not session.get("ended_at"):
        raise HTTPException(status_code=409, detail="Finish your interview before generating feedback.")
    if session.get("conversation_id"):
        status = get_processing_status(session)["status"]
        saved = get_saved_report(session_id)
        if saved and status in ("completed", "metrics_failed", "waiting_for_transcript"):
            return saved
        if status == "waiting_for_transcript":
            if seconds_since(session.get("ended_at")) < LIVE_FALLBACK_AFTER_SECONDS:
                return JSONResponse({"status": "waiting_for_transcript"}, status_code=202)
            # The webhook never arrived (no public URL, wrong agent ID, bad signature...).
            # Report from the live transcript rather than leaving the user waiting.
            return await generate_feedback_for_session({**session, "id": session_id}, live_fallback=True)
        if status in RESUMABLE_STATUSES:
            if status == "failed":
                (supabase.table("post_call_jobs").update({"status": "pending", "last_error": None})
                 .eq("conversation_id", session["conversation_id"]).eq("status", "failed").execute())
            from voice.webhooks import process_post_call
            background_tasks.add_task(process_post_call, session["conversation_id"])
        return JSONResponse({"status": "processing"}, status_code=202)
    return await generate_feedback_for_session({**session, "id": session_id}, refresh=refresh_details)


async def generate_feedback_for_session(session: dict, *, refresh: bool = False,
                                        final_metrics: dict | None = None, final_transcript: bool = False,
                                        live_fallback: bool = False):
    """Shared trusted service; HTTP callers must authorize ownership first."""
    session_id = session["id"]
    if session["status"] != "completed" or not session.get("ended_at"):
        raise HTTPException(status_code=409, detail="Finish your interview before generating feedback.")
    lock = session_generation_locks.setdefault(session_id, asyncio.Lock())
    async with lock:
        if session.get("conversation_id") and not final_transcript:
            rows = (supabase.table("communication_metrics")
                    .select("filler_word_count, questions_asked, average_response_time_seconds, words_per_minute")
                    .eq("session_id", session_id).limit(1).execute().data)
            final_metrics = rows[0] if rows else None
            final_transcript = True
        saved = get_saved_report(session_id)
        if saved and not refresh:
            return saved
        problem = get_stored_problem(session)
        snapshots = supabase.table("code_snapshots").select("code, language, created_at").eq("session_id", session_id).order("created_at", desc=True).limit(1).execute().data
        transcript = supabase.table("transcript_events").select("id, speaker, text, sequence_number, started_at, created_at").eq("session_id", session_id).order("sequence_number").limit(400).execute().data
        events = supabase.table("session_events").select("event_type, metadata, created_at").eq("session_id", session_id).order("created_at").limit(200).execute().data
        code = (snapshots[0].get("code") or "")[:40000] if snapshots else ""
        candidate_speakers = {"user", "candidate", "interviewee", "human"}
        speech = [row["text"][:4000] for row in transcript if (row.get("speaker") or "").lower() in candidate_speakers and (row.get("text") or "").strip()]
        speech = "\n".join(speech)[:50000]
        # Load communication separately so ordinary step events cannot hide it.
        captures = supabase.table("session_events").select("event_type, metadata, created_at").eq("session_id", session_id).eq("event_type", "communication_summary").order("created_at", desc=True).limit(1000).execute().data
        communication = summarize_captures(reversed(captures)) if not final_transcript else None
        if final_transcript:
            # Never replace unavailable final timing with browser volume estimates.
            communication = final_metrics
        if communication and communication.get("candidate_transcript"):
            speech = "\n".join(filter(None, [speech, communication["candidate_transcript"]]))[:50000]
        if not code.strip() and not speech:
            raise HTTPException(status_code=422, detail="This interview has no saved code or candidate transcript to review.")
        evidence = {"problem": problem, "code": code, "language": session.get("language"), "candidate_transcript": speech, "session_events": [event for event in events if event.get("event_type") != "communication_summary"], "code_was_executed": False, "communication_metrics": {k: v for k, v in communication.items() if k not in {"candidate_transcript", "silent_seconds", "silence_percent", "longest_pause_seconds"}} if communication else None}
        from report_evidence import build_evidence
        evidence["session_evidence"] = build_evidence(session, transcript, list(reversed(captures)))
        # Send candidate words once when session_evidence already holds all of them.
        evidence["speech_in_session_evidence"] = bool(speech) and not (communication and communication.get("candidate_transcript")) \
            and sum(len(turn["text"]) for turn in evidence["session_evidence"]["transcript"]) >= sum(min(len(row.get("text") or ""), 4000) for row in transcript)
        if live_fallback:
            evidence["transcript_source"] = "live"
        try:
            evidence["executions"] = supabase.table("code_executions").select("id, code, language, status, test_results, passed_count, total_count, stdout, stderr, created_at").eq("session_id", session_id).order("created_at", desc=True).limit(10).execute().data
        except Exception:
            evidence["executions"] = []
            evidence["execution_evidence_unavailable"] = True
        report = await review_with_fallback(evidence, generate_feedback)
        if report.get("is_fallback"):
            # Keep provider outages out of saved grades and allow the next request to retry.
            return {"id": "temporary-fallback", "session_id": session_id,
                    **{key: report[key] for key in ("technical_score", "reasoning_score", "communication_score", "overall_score", "strengths", "weaknesses", "recommendations")}, "report": report}
        report["submitted_code"] = code
        if live_fallback and LIVE_FALLBACK_LIMITATION not in report["evidence_limitations"]:
            report["evidence_limitations"].append(LIVE_FALLBACK_LIMITATION)
        if communication:
            report["communication_metrics"] = {k: v for k, v in communication.items() if k not in {"candidate_transcript", "silent_seconds", "silence_percent", "longest_pause_seconds"}}
        row = {"id": saved["id"] if saved else str(uuid5(NAMESPACE_URL, "clario:gemini-feedback:" + session_id)), "session_id": session_id, **{key: report[key] for key in ("technical_score", "reasoning_score", "communication_score", "overall_score", "strengths", "weaknesses", "recommendations")}, "report": report}
        supabase.table("feedback_reports").upsert(row, on_conflict="session_id").execute()
        saved = get_saved_report(session_id)
        if not saved:
            raise HTTPException(status_code=503, detail="Could not save the feedback report. Please try again.")
        return saved
