
import os

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Query

from db import supabase
from auth import get_current_user

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

router = APIRouter(prefix="/api/voice", tags=["System Design Voice"])

FIELDS = [
    "company", "prompt", "functional_requirements",
    "non_functional_requirements", "scale", "out_of_scope",
    "deep_dive_topics", "curveballs", "strong_signals", "red_flags"
]


def as_text(value):
    if value is None:
        return ""
    if isinstance(value, list):
        return "\n".join(str(item) for item in value)
    if isinstance(value, dict):
        import json
        return json.dumps(value)
    return str(value)


@router.get("/system-design-session")
async def get_system_design_session(
    slug: str = Query(..., min_length=1),
    user: dict = Depends(get_current_user),
):
    api_key = os.getenv("ELEVENLABS_API_KEY")
    agent_id = os.getenv("ELEVENLABS_SYSTEM_DESIGN_AGENT_ID")

    if not api_key or not agent_id:
        raise HTTPException(503, "ElevenLabs is not configured")

    try:
        result = (
            supabase.table("system_design_questions")
            .select("*")
            .eq("slug", slug)
            .limit(1)
            .execute()
        )
    except Exception:
        raise HTTPException(500, "Failed to load System Design question")

    if not result.data:
        raise HTTPException(404, "System Design question not found")

    question = result.data[0]
    variables = {
        field: as_text(question.get(field))
        for field in FIELDS
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url",
                params={"agent_id": agent_id},
                headers={"xi-api-key": api_key},
            )
            response.raise_for_status()
            signed_url = response.json()["signed_url"]
    except (httpx.HTTPError, KeyError, ValueError):
        raise HTTPException(502, "Failed to start ElevenLabs voice session")

    return {
        "signed_url": signed_url,
        "variables": variables,
    }
