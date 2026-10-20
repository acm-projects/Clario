import os
import re
from html import unescape
from io import BytesIO

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from google import genai

from auth import get_current_user
from piston.router import load_problem

load_dotenv()

router = APIRouter(prefix="/voice", tags=["voice"])

elevenlabs = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])
gemini = genai.Client(api_key=os.environ["GEMINI_API_KEY"])


def html_to_text(html: str) -> str:
    """Strip tags so the agent gets readable plain text."""
    text = re.sub(r"<br\s*/?>|</p>|</pre>", "\n", html)
    text = re.sub(r"<[^>]+>", "", text)
    return unescape(text).strip()


@router.get("/session")
def get_session(problem_slug: str):
    """Returns a signed URL + problem variables for the frontend to start a session."""
    problem = load_problem(problem_slug)
    if problem is None:
        raise HTTPException(404, "Problem not found")

    try:
        signed = elevenlabs.conversational_ai.conversations.get_signed_url(
            agent_id=os.environ["ELEVENLABS_AGENT_ID"]
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

    transcript = elevenlabs.speech_to_text.convert(
        file=recording,
        model_id="scribe_v2",
    )
    user_text = transcript.text

    if not user_text.strip():
        raise HTTPException(400, "No speech detected")

    # Step 2: Gemini generates interviewer response
    response = gemini.models.generate_content(
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
    audio_stream = elevenlabs.text_to_speech.convert(
        text=response_text,
        voice_id="JBFqnCBsd6RMkjVDRZzb",
        model_id="eleven_v3",
        output_format="mp3_44100_128",
    )
    audio_output = b"".join(audio_stream)

    # Step 4: Return playable audio
    return Response(content=audio_output, media_type="audio/mpeg")