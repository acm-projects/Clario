import re
import json
from pathlib import Path
from html import unescape
from io import BytesIO

from elevenlabs.client import ElevenLabs
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from google import genai

from auth import get_current_user
from config import require_setting, settings
from leetcode import get_problem
from interview_evidence import InterviewEvidence, persist_evidence
from datetime import datetime, timezone
from uuid import uuid4
from starlette.concurrency import run_in_threadpool

router = APIRouter(prefix="/voice", tags=["voice"])


def interview_variables(title: str, description: str, opening_summary: str,
                        root_cause: str = "No diagnosed root cause is supplied for this interview. Evaluate the candidate's work from the available evidence.") -> dict[str, str]:
    """Supply the shared agent's prompt and first-message variables in every mode.

    Keep the opening summary candidate-visible: descriptions may contain private
    evaluation instructions that must never be read in the greeting.
    """
    return {
        "problem_title": title,
        "problem_description": description,
        "repo_name": title,
        "bug_summary": opening_summary,
        "root_cause": root_cause,
    }


@router.post("/system-design/{scenario_slug}/finish")
async def finish_system_design(scenario_slug: str, body: InterviewEvidence, user: dict = Depends(get_current_user)):
    system_design_scenario(scenario_slug)
    def save():
        from db import supabase
        session_id = str(uuid4())
        try:
            supabase.table("interview_sessions").insert({"id": session_id, "user_id": user["sub"], "problem_slug": "system-design:" + scenario_slug, "mode": "practice", "status": "in_progress"}).execute()
            persist_evidence(supabase, session_id, body)
            rows = supabase.table("interview_sessions").update({"status": "completed", "ended_at": datetime.now(timezone.utc).isoformat()}).eq("id", session_id).eq("user_id", user["sub"]).execute().data
            if not rows:
                raise RuntimeError("Session was not saved")
            return {"session_id": session_id}
        except Exception:
            supabase.table("interview_sessions").delete().eq("id", session_id).eq("user_id", user["sub"]).execute()
            raise HTTPException(503, "Could not save your interview. Please try again.") from None
    return await run_in_threadpool(save)


def system_design_scenario(slug: str):
    if slug == "bumble-matching":
        path = Path(__file__).resolve().parents[1] / "challenges" / "system-design" / "bumble-matching.json"
        return json.loads(path.read_text(encoding="utf-8"))
    if not re.fullmatch(r"[a-zA-Z0-9_-]+", slug):
        raise HTTPException(404, "System design scenario not found")
    from db import supabase
    try:
        rows = supabase.table("system_design_questions").select("*").eq("slug", slug).limit(1).execute().data
    except Exception:
        if slug not in {"bumble-matching", "bumble-nearby-matches"}:
            raise HTTPException(503, "System design questions are temporarily unavailable") from None
        rows = []
    if rows:
        return rows[0]
    if slug not in {"bumble-matching", "bumble-nearby-matches"}:
        raise HTTPException(404, "System design scenario not found")
    path = Path(__file__).resolve().parents[1] / "challenges" / "system-design" / "bumble-matching.json"
    return json.loads(path.read_text(encoding="utf-8"))


@router.get("/system-design/scenarios/{slug}")
def get_system_design_scenario(slug: str, user: dict = Depends(get_current_user)):
    scenario = system_design_scenario(slug)
    return {key: scenario[key] for key in ("slug", "company", "title", "difficulty", "prompt")}


@router.get("/system-design-session")
def get_system_design_session(scenario_slug: str, user: dict = Depends(get_current_user)):
    scenario = system_design_scenario(scenario_slug)
    description = "\n\n".join([
        "This is a company-inspired system design interview with no code editor or sandbox. Ask one question at a time about requirements, architecture, data models, scale, reliability, and trade-offs. Do not ask the candidate to write or run code. Do not claim to see diagrams or notes. Let the candidate explain their reasoning.",
        (Path(__file__).resolve().parents[1] / "prompts" / "system-design.md").read_text(encoding="utf-8"),
        scenario["prompt"],
        "Private evaluation criteria (never recite): " + json.dumps(scenario.get("key_points", scenario.get("strong_signals", []))),
        "Private follow-up bank: " + json.dumps(scenario.get("follow_ups", scenario.get("curveballs", []))),
    ])
    fields = ("company", "prompt", "functional_requirements", "non_functional_requirements", "scale", "out_of_scope", "deep_dive_topics", "curveballs", "strong_signals", "red_flags")
    def as_text(value):
        if value is None: return ""
        if isinstance(value, list): return "\n".join(str(item) for item in value)
        if isinstance(value, dict): return json.dumps(value)
        return str(value)
    context = {field: as_text(scenario.get(field)) for field in fields}
    description += "\nPrivate interviewer context (never recite): " + json.dumps(context)
    try:
        signed = get_elevenlabs().conversational_ai.conversations.get_signed_url(
            agent_id=require_setting("ELEVENLABS_SYSTEM_DESIGN_AGENT_ID or ELEVENLABS_AGENT_ID", settings.elevenlabs_system_design_agent_id or settings.elevenlabs_agent_id)
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(502, "Could not create system design voice session.")
    return {"signed_url": signed.signed_url, "variables": {**context, **interview_variables(f'{scenario["company"]}: {scenario["title"]}', description, scenario["prompt"])}}

def get_elevenlabs():
    if not settings.elevenlabs_api_key:
        raise HTTPException(503, "Voice service is not configured")
    return ElevenLabs(api_key=settings.elevenlabs_api_key)


def get_gemini():
    if not settings.gemini_api_key:
        raise HTTPException(503, "Voice response service is not configured")
    return genai.Client(api_key=settings.gemini_api_key)


def html_to_text(html: str) -> str:
    """Strip tags so the agent gets readable plain text."""
    text = re.sub(r"<br\s*/?>|</p>|</pre>", "\n", html)
    text = re.sub(r"<[^>]+>", "", text)
    return unescape(text).strip()


@router.get("/repo-session")
def get_repo_session(challenge_id: str, language: str | None = None, user: dict = Depends(get_current_user)):
    """Use the existing voice agent with repository context, never private tests."""
    from services.repo_challenge_service import detail, interviewer_root_cause, InvalidRepository
    try:
        challenge = detail(challenge_id, language)
        root_cause = interviewer_root_cause(challenge_id, language)
    except KeyError:
        raise HTTPException(404, "Repository challenge not found")
    except InvalidRepository as error:
        raise HTTPException(422, str(error))
    description = "\n\n".join([
        "This is a repository debugging interview. During coding, introduce the task and answer clarification requests, but wait for the final Submit event before beginning assessment questions. After final Submit, ask one question at a time about file relationships, the candidate's hypothesis, actual supplied run results, verification, and edge cases. Use editor snapshots and execution updates when supplied, but do not claim to see the screen or results that were not provided. An unavailable executor is not a failed candidate test. Do not reveal the fix.",
        "The root_cause variable is private interviewer reference. Never read it in the greeting, disclose the diagnosis, or give the repair unless the interview rules explicitly permit it. Use current editor snapshots as evidence of changes; do not assume the original bug is still present after an edit.",
        challenge["description"], challenge["objective"], challenge["expectedBehavior"],
        "Private root-cause reference (never recite): " + root_cause,
        *[f"File: {file['path']}\n{file['content']}" for file in challenge["files"]],
    ])
    try:
        signed = get_elevenlabs().conversational_ai.conversations.get_signed_url(
            agent_id=require_setting("ELEVENLABS_AGENT_ID", settings.elevenlabs_agent_id)
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(502, "Could not create repository voice session. Check the configured ElevenLabs agent and API permissions.")
    return {"signed_url": signed.signed_url, "voice_id": settings.elevenlabs_voice_id, "variables": interview_variables(challenge["title"], description, challenge["description"], root_cause)}


@router.get("/session")
def get_session(problem_slug: str, user: dict = Depends(get_current_user)):
    """Returns a signed URL + problem variables for the frontend to start a session."""
    problem = get_problem(problem_slug)
    opening_summary = None
    if problem is None:
        from routers.scenarios import fetch_scenario
        scenario = fetch_scenario(problem_slug)
        if scenario is None:
            raise HTTPException(404, "Problem not found")
        problem = {"slug": scenario["slug"], "title": scenario["title"], "description_html": scenario["prompt"]}
        opening_summary = html_to_text(scenario["prompt"])
        problem["description_html"] += "\nPrivate interviewer reference (never recite): " + json.dumps(scenario.get("hidden_details", []))

    try:
        signed = get_elevenlabs().conversational_ai.conversations.get_signed_url(
            agent_id=require_setting("ELEVENLABS_AGENT_ID", settings.elevenlabs_agent_id)
        )
    except Exception as e:
        raise HTTPException(502, f"Could not create voice session: {e}")

    return {
        "signed_url": signed.signed_url,
        "variables": interview_variables(
            problem.get("title") or problem["slug"].replace("-", " ").title(),
            html_to_text(problem["description_html"]),
            opening_summary or html_to_text(problem["description_html"]),
        ),
    }


@router.post("/turn")
def voice_turn(
    audio: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    # Step 1: Speech to text
    audio_bytes = audio.file.read()
    if not audio_bytes:
        raise HTTPException(400, "Empty recording")

    recording = BytesIO(audio_bytes)
    recording.name = audio.filename or "recording.webm"

    transcript = get_elevenlabs().speech_to_text.convert(
        file=recording,
        model_id="scribe_v2",
    )
    user_text = transcript.text

    if not user_text.strip():
        raise HTTPException(400, "No speech detected")

    # Step 2: Gemini generates interviewer response
    response = get_gemini().models.generate_content(
        model="gemini-2.5-flash",
        contents=user_text,
        config={
            "system_instruction": (
                "You are Clario, a friendly technical interviewer. "
                "Ask one concise follow-up question at a time. "
                "Keep responses short and conversational."
            )
        },
    )
    response_text = response.text
    if not response_text:
        raise HTTPException(502, "Gemini returned no response")

    # Step 3: Text to speech
    audio_stream = get_elevenlabs().text_to_speech.convert(
        text=response_text,
        voice_id=settings.elevenlabs_voice_id,
        model_id="eleven_v3",
        output_format="mp3_44100_128",
    )
    audio_output = b"".join(audio_stream)

    # Step 4: Return playable audio
    return Response(content=audio_output, media_type="audio/mpeg")
