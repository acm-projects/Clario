from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Literal
from uuid import UUID, NAMESPACE_URL, uuid5

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel, Field, model_validator
from postgrest.exceptions import APIError

from auth import get_current_user
from db import supabase
from leetcode import get_problem

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sessions")


class SessionCreate(BaseModel):
    problem_slug: str
    mode: Literal["recommended", "custom", "surprise", "company"]
    language: Literal["python3", "java"]


class SnapshotCreate(BaseModel):
    code: str


EventType = Literal["step_completed", "step_skipped", "nudge_shown", "hint_shown"]
VALID_STEPS = ["understand", "match", "plan", "implement", "review", "evaluate"]
VALID_SOURCES = ("ai", "manual")


class EventCreate(BaseModel):
    type: EventType
    data: dict = Field(default_factory=dict)


def build_steps(events: list[dict]) -> dict:
    """Start every step as 'todo', then replay events oldest first.
    step_skipped marks a step 'skipped'; step_completed marks it 'done'
    (so a skipped step the user goes back to becomes 'done')."""
    steps = {step: "todo" for step in VALID_STEPS}
    for e in events:
        step = (e["metadata"] or {}).get("step")
        if step not in steps:
            continue
        if e["event_type"] == "step_skipped":
            steps[step] = "skipped"
        elif e["event_type"] == "step_completed":
            steps[step] = "done"
    return steps


def event_out(row: dict) -> dict:
    # The table columns are event_type / metadata; the API contract is type / data.
    return {
        "id": row["id"],
        "session_id": row["session_id"],
        "type": row["event_type"],
        "data": row["metadata"] or {},
        "created_at": row["created_at"],
    }


def get_owned_session(session_id: str, user_id: str) -> dict:
    rows = (
        supabase.table("interview_sessions")
        .select("*")
        .eq("id", session_id)
        .execute()
        .data
    )
    if not rows or rows[0]["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Session not found")
    return rows[0]

ALLOWED_MODES = {
    "recommended",
    "custom",
    "surprise",
    "company"
}


async def validate_session_mode(request: Request):
    try:
        body = await request.json()
    except (ValueError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="Invalid JSON request body")

    mode = body.get("mode") if isinstance(body, dict) else None

    if not isinstance(mode, str) or mode not in ALLOWED_MODES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid or missing mode. Allowed values: "
                "practice, company, full_mock, custom"
            ),
        )

def validate_interview_problem(problem_slug: str, mode: str):
    if mode == "company":
        rows = (
            supabase.table("scenario_questions")
            .select("slug")
            .eq("slug", problem_slug)
            .limit(1)
            .execute()
            .data
        )

        if not rows:
            raise HTTPException(
                status_code=404,
                detail="Company scenario not found",
            )
        return

    try:
        problem = get_problem(problem_slug)
    except httpx.HTTPError as e:
        logger.warning("Problem API failed: %s", e)
        raise HTTPException(
            status_code=503,
            detail="Problem service unavailable",
        )

    if problem is None:
        raise HTTPException(
            status_code=404,
            detail="Problem not found",
        )

@router.post("")
def create_session(
    body: SessionCreate,
    user: dict = Depends(get_current_user),
    _: None = Depends(validate_session_mode),
):
    validate_interview_problem(body.problem_slug, body.mode)
    problem_id = None
    if body.mode != "company":
        problems = supabase.table("problems").select("id").eq("slug", body.problem_slug).limit(1).execute().data
        if not problems:
            problem = get_problem(body.problem_slug)
            problems = supabase.table("problems").insert({
                "slug": body.problem_slug,
                "title": problem.get("title") or body.problem_slug,
                "description": problem.get("description_html") or "",
                "description_html": problem.get("description_html") or "",
                "starter_code": problem.get("starter_code") or {},
            }).execute().data
        problem_id = problems[0]["id"]

    row = (
        supabase.table("interview_sessions")
        .insert({
            "user_id": user["sub"],
            "problem_id": problem_id,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "problem_slug": body.problem_slug,
            "mode": body.mode,
            "language": body.language,
            "status": "in_progress",
        })
        .execute()
        .data
    )
    return row[0]


@router.get("")
def list_sessions(user: dict = Depends(get_current_user)):
    rows = (
        supabase.table("interview_sessions")
        .select("*")
        .eq("user_id", user["sub"])
        .order("started_at", desc=True)
        .execute()
        .data
    )
    return rows


@router.get("/{session_id}")
def get_session(session_id: str, user: dict = Depends(get_current_user)):
    session = get_owned_session(session_id, user["sub"])

    if session["mode"] == "company":
        rows = (
            supabase.table("scenario_questions")
            .select("slug, company, title, difficulty, prompt, starter_code")
            .eq("slug", session["problem_slug"])
            .limit(1)
            .execute()
            .data
        )

        if not rows:
            raise HTTPException(
                status_code=404,
                detail="Company scenario not found",
            )

        scenario = rows[0]

        # Adapt the scenario to the existing frontend Problem format.
        problem = {
            "slug": scenario["slug"],
            "leetcode_id": 0,
            "title": scenario["title"],
            "difficulty": scenario["difficulty"],
            "topics": [],
            "description_html": scenario["prompt"],
            "example_testcases": "",
            "starter_code": scenario["starter_code"] or {},
        }

    else:
        try:
            problem = get_problem(session["problem_slug"])
        except httpx.HTTPError as e:
            logger.warning(
                "Problem API failed in get_session: %s",
                e,
            )
            problem = None

    latest_snapshot = (
        supabase.table("code_snapshots")
        .select("code")
        .eq("session_id", session_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
        .data
    )
    latest_code = latest_snapshot[0]["code"] if latest_snapshot else None

    events = (
        supabase.table("session_events")
        .select("event_type, metadata")
        .eq("session_id", session_id)
        .order("created_at")
        .execute()
        .data
    )
    steps = build_steps(events)

    return {
        **session,
        "problem": problem,
        "latest_code": latest_code,
        "steps": steps,
    }


@router.post("/{session_id}/snapshots")
def create_snapshot(session_id: str, body: SnapshotCreate, user: dict = Depends(get_current_user)):
    session = get_owned_session(session_id, user["sub"])

    if session["status"] == "completed":
        raise HTTPException(status_code=400, detail="Session already completed")

    row = (
        supabase.table("code_snapshots")
        .insert({
            "session_id": session_id,
            "code": body.code,
            "language": session["language"],
        })
        .execute()
        .data
    )
    return {"created_at": row[0]["created_at"]}


@router.patch("/{session_id}/end")
def end_session(session_id: str, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    session = get_owned_session(session_id, user["sub"])

    if session["status"] == "completed":
        raise HTTPException(status_code=400, detail="Session already completed")

    row = (
        supabase.table("interview_sessions")
        .update({"status": "completed", "ended_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", session_id)
        .execute()
        .data
    )
    if session.get("conversation_id"):
        from config import settings
        if settings.elevenlabs_webhook_secret:
            from voice.webhooks import process_post_call
            background_tasks.add_task(process_post_call, session["conversation_id"])
    return row[0]


@router.post("/{session_id}/events")
def create_event(session_id: str, body: EventCreate, user: dict = Depends(get_current_user)):
    session = get_owned_session(session_id, user["sub"])

    if session["status"] == "completed":
        raise HTTPException(status_code=400, detail="Session already completed")

    if body.data.get("step") not in VALID_STEPS:
        raise HTTPException(status_code=400, detail="Invalid step")

    if body.type == "step_completed" and body.data.get("source") not in VALID_SOURCES:
        raise HTTPException(status_code=400, detail="Invalid source")

    row = (
        supabase.table("session_events")
        .insert({
            "session_id": session_id,
            "event_type": body.type,
            "metadata": body.data,
        })
        .execute()
        .data
    )
    return event_out(row[0])


@router.get("/{session_id}/events")
def list_events(session_id: str, user: dict = Depends(get_current_user)):
    get_owned_session(session_id, user["sub"])

    rows = (
        supabase.table("session_events")
        .select("*")
        .eq("session_id", session_id)
        .order("created_at")
        .execute()
        .data
    )
    return [event_out(r) for r in rows]


class ConversationLink(BaseModel):
    conversation_id: str = Field(min_length=1, max_length=200)


@router.patch("/{session_id}/conversation")
def link_conversation(session_id: UUID, body: ConversationLink, user: dict = Depends(get_current_user)):
    session_id = str(session_id)
    session = get_owned_session(session_id, user["sub"])
    if session["status"] != "in_progress":
        raise HTTPException(400, "Session is not in progress")
    if session.get("conversation_id") and session["conversation_id"] != body.conversation_id:
        raise HTTPException(409, "Session already has a different conversation")
    if session.get("conversation_id") == body.conversation_id:
        return session
    rows = (supabase.table("interview_sessions")
            .update({"conversation_id": body.conversation_id})
            .eq("id", session_id).eq("user_id", user["sub"])
            .eq("status", "in_progress").is_("conversation_id", "null").execute().data)
    if not rows:
        raise HTTPException(409, "Session changed while linking conversation")
    return rows[0]


class TranscriptCreate(BaseModel):
    speaker: Literal["user", "agent"]
    text: str = Field(min_length=1, max_length=50000)
    received_at: datetime
    sequence_number: int = Field(ge=0)

    @model_validator(mode="after")
    def require_timezone(self):
        if self.received_at.tzinfo is None:
            raise ValueError("received_at must include a timezone")
        return self


@router.post("/{session_id}/transcript")
def save_transcript(session_id: UUID, body: TranscriptCreate, user: dict = Depends(get_current_user)):
    session_id = str(session_id)
    session = get_owned_session(session_id, user["sub"])
    if not session.get("conversation_id"):
        raise HTTPException(409, "Link the conversation before saving transcript")
    # created_at is receipt time. Speech timing stays null until authoritative data arrives.
    row = {"session_id": session_id, "speaker": body.speaker, "text": body.text,
           "created_at": body.received_at.isoformat(), "sequence_number": body.sequence_number}
    row["id"] = str(uuid5(NAMESPACE_URL, f"clario:live-turn:{session_id}:{body.sequence_number}"))
    try:
        return supabase.rpc("save_live_transcript", {"p_session_id": session_id, "p_turn": row}).execute().data
    except APIError as error:
        if error.code != "PGRST202":
            raise
        # Keep existing live interviews usable while the additive post-call migration
        # is being applied. Once installed, the RPC serializes late/final turns.
        return supabase.table("transcript_events").upsert(row, on_conflict="id").execute().data[0]
