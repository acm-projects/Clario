
import os
from io import BytesIO

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from google import genai
load_dotenv()

router = APIRouter(prefix="/voice", tags=["voice"])

elevenlabs = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])
gemini = genai.Client(
    api_key=os.environ["GEMINI_API_KEY"]
)

@router.post("/turn")
def voice_turn(audio: UploadFile = File(...)):
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

    # Step 2: gemini generates interviewer response
    response = gemini.models.generate_content(
        model="gemini-2.5-flash",
        contents=user_text,
        config={
            "system_instruction": (
                "You are Clario, a friendly technical interviewer. "
                "Ask one concise follow-up question at a time. "
                "Keep responses short and conversational."
            )
        }
    )

    response_text = response.text

    if not response_text:
        raise HTTPException(502, "Gemini returned no response")

    # Step 3: Convert gemini response to speech
    audio_stream = elevenlabs.text_to_speech.convert(
        text=response_text,
        voice_id="JBFqnCBsd6RMkjVDRZzb",
        model_id="eleven_v3",
        output_format="mp3_44100_128",
    )

    audio_output = b"".join(audio_stream)

    # Step 4: Return playable audio
    return Response(
        content=audio_output,
        media_type="audio/mpeg",
        #headers={
            #"X-Transcript": "available-server-side"
        #},
    )
