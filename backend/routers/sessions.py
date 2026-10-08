from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from db import supabase
from leetcode import get_problem

router = APIRouter(prefix="/api/sessions")


class SessionCreate(BaseModel):
    problem_slug: str
    mode: Literal["practice", "full_mock"]
    language: Literal["python3", "java"]


class SnapshotCreate(BaseModel):
    code: str


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
    problem = get_problem(body.problem_slug)
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

    problem = get_problem(session["problem_slug"])

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

    return {
        **session,
        "problem": problem,
        "latest_code": latest_code,
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