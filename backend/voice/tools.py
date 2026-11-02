"""Authenticated server-to-server tools called by the ElevenLabs interviewer."""
import secrets
from uuid import UUID

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import JSONResponse

from config import settings
from db import supabase

router = APIRouter(prefix="/api/voice-tools", tags=["voice tools"])


@router.get("/sessions/{session_id}/code")
def get_current_code(
    session_id: UUID,
    x_elevenlabs_tool_secret: str | None = Header(default=None),
    x_conversation_id: str | None = Header(default=None),
):
    expected = settings.elevenlabs_tool_secret
    if not expected:
        raise HTTPException(503, "Voice tools are not configured")
    
    if not x_elevenlabs_tool_secret or not secrets.compare_digest(
        x_elevenlabs_tool_secret.encode(), expected.encode()
    ):
        raise HTTPException(401, "Invalid tool credentials")
    
    if not x_conversation_id:
        raise HTTPException(401, "Conversation identity is required")

    session_id = str(session_id)
    sessions = (supabase.table("interview_sessions")
                .select("id, language, status, conversation_id")
                .eq("id", session_id).eq("conversation_id", x_conversation_id)
                .limit(1).execute().data)
    
    if not sessions:
        raise HTTPException(404, "Session not found for this conversation")
    
    if sessions[0]["status"] != "in_progress":
        raise HTTPException(400, "Session is no longer in progress")
    
    snapshots = (supabase.table("code_snapshots")
                 .select("id, code, language, created_at")
                 .eq("session_id", session_id)
                 .order("created_at", desc=True).order("id", desc=True)
                 .limit(1).execute().data)
    
    snapshot = snapshots[0] if snapshots else None
    
    return JSONResponse({
        "session_id": session_id,
        "available": snapshot is not None,
        "code": snapshot["code"] if snapshot else None,
        "language": snapshot["language"] if snapshot else sessions[0]["language"],
        "snapshot_id": snapshot["id"] if snapshot else None,
        "saved_at": snapshot["created_at"] if snapshot else None,
    }, headers={"Cache-Control": "no-store"})
