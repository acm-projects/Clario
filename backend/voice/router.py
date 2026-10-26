import re
from html import unescape
from io import BytesIO

from elevenlabs.client import ElevenLabs
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from google import genai

from auth import get_current_user
from config import require_setting, settings
from leetcode import get_problem

router = APIRouter(prefix="/voice", tags=["voice"])

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
def get_repo_session(challenge_id: str, user: dict = Depends(get_current_user)):
    """Use the existing voice agent with repository context, never private tests."""
    from services.repo_challenge_service import detail
    try:
        challenge = detail(challenge_id)
    except KeyError:
        raise HTTPException(404, "Repository challenge not found")
    description = "\n\n".join([
        "This is a repository debugging interview. Ask one question at a time about file relationships, the candidate's hypothesis, verification, and edge cases. Do not reveal the fix or claim to see live edits or test results. Ask the candidate to describe their changes and results.",
        challenge["description"], challenge["objective"], challenge["expectedBehavior"],
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
    return {"signed_url": signed.signed_url, "variables": {"problem_title": challenge["title"], "problem_description": description}}


@router.get("/session")
def get_session(problem_slug: str, user: dict = Depends(get_current_user)):
    """Returns a signed URL + problem variables for the frontend to start a session."""
    problem = get_problem(problem_slug)
    if problem is None:
        raise HTTPException(404, "Problem not found")

    try:
        signed = get_elevenlabs().conversational_ai.conversations.get_signed_url(
            agent_id=require_setting("ELEVENLABS_AGENT_ID", settings.elevenlabs_agent_id)
        )
    except Exception as e:
        raise HTTPException(502, f"Could not create voice session: {e}")

    return {
        "signed_url": signed.signed_url,
        "variables": {
            "problem_title": problem["slug"].replace("-", " ").title(),
            "problem_description": html_to_text(problem["description_html"]),
        },
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
