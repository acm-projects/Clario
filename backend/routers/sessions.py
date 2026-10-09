import logging
from datetime import datetime, timezone
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from auth import get_current_user
from db import supabase
from leetcode import get_problem

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sessions")


class SessionCreate(BaseModel):
    problem_slug: str
    mode: Literal["practice", "full_mock"]
    language: Literal["python3", "java"]


class SnapshotCreate(BaseModel):
    code: str


EventType = Literal["step_change", "checklist_toggle", "nudge_shown", "nudge_response", "hint_shown"]
VALID_STEPS = {"understand", "match", "plan", "implement", "review", "evaluate"}
STEP_EVENTS = {"step_change", "checklist_toggle", "nudge_shown", "hint_shown"}
VALID_CHOICES = {"back_to_planning", "skip_to_code"}


class EventCreate(BaseModel):
    type: EventType
    data: dict = Field(default_factory=dict)


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


@router.post("")
def create_session(body: SessionCreate, user: dict = Depends(get_current_user)):
    try:
        problem = get_problem(body.problem_slug)
    except httpx.HTTPError as e:
        logger.warning("Problem API failed in create_session: %s", e)
        raise HTTPException(status_code=503, detail="Problem service unavailable")
    if problem is None:
        raise HTTPException(status_code=404, detail="Problem not found")

    row = (
        supabase.table("interview_sessions")
        .insert({
            "user_id": user["sub"],
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

    try:
        problem = get_problem(session["problem_slug"])
    except httpx.HTTPError as e:
        logger.warning("Problem API failed in get_session: %s", e)
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

    latest_step_event = (
        supabase.table("session_events")
        .select("metadata")
        .eq("session_id", session_id)
        .eq("event_type", "step_change")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
        .data
    )
    current_step = "understand"
    if latest_step_event:
        current_step = (latest_step_event[0]["metadata"] or {}).get("step", "understand")

    return {
        **session,
        "problem": problem,
        "latest_code": latest_code,
        "current_step": current_step,
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
def end_session(session_id: str, user: dict = Depends(get_current_user)):
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
    return row[0]


@router.post("/{session_id}/events")
def create_event(session_id: str, body: EventCreate, user: dict = Depends(get_current_user)):
    session = get_owned_session(session_id, user["sub"])

    if session["status"] == "completed":
        raise HTTPException(status_code=400, detail="Session already completed")

    if body.type in STEP_EVENTS and body.data.get("step") not in VALID_STEPS:
        raise HTTPException(status_code=400, detail="Invalid step")

    if body.type == "nudge_response" and body.data.get("choice") not in VALID_CHOICES:
        raise HTTPException(status_code=400, detail="Invalid choice")

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