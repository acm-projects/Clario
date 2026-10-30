"""Application configuration loaded from environment variables."""

import os
from dataclasses import dataclass

from dotenv import load_dotenv

from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env.local")
load_dotenv(BACKEND_DIR / ".env")


def _optional(name: str, default: str = "") -> str:
    return os.getenv(name, default)

#reading env variables and packaging them into settings

@dataclass(frozen=True)
class Settings:
    supabase_url: str = _optional("SUPABASE_URL")
    supabase_service_role_key: str = _optional("SUPABASE_SERVICE_ROLE_KEY")
    piston_url: str = _optional(
        "PISTON_URL", "http://localhost:2000/api/v2/execute"
    )
    leetcode_api_url: str = _optional(
        "LEETCODE_API_URL", "https://alfa-leetcode-api.onrender.com"
    )
    piston_python_version: str = _optional("PISTON_PYTHON_VERSION", "*")
    piston_javascript_version: str = _optional("PISTON_JAVASCRIPT_VERSION", "*")
    piston_java_version: str = _optional("PISTON_JAVA_VERSION", "*")
    elevenlabs_api_key: str = _optional("ELEVENLABS_API_KEY")
    elevenlabs_agent_id: str = _optional("ELEVENLABS_AGENT_ID")
    elevenlabs_voice_id: str = _optional(
        "ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb"
    )
    gemini_api_key: str = _optional("GEMINI_API_KEY")
    dev_bypass_auth: bool = _optional("DEV_BYPASS_AUTH").lower() == "true"
    dev_user_id: str = _optional("DEV_USER_ID")
    dev_user_email: str = _optional("DEV_USER_EMAIL")
    internal_api_key: str = _optional("INTERNAL_API_KEY")


settings = Settings()


def require_setting(name: str, value: str) -> str:
    """Return a configured value or raise an actionable startup/runtime error."""
    if not value:
        raise RuntimeError(
            f"Missing required environment variable {name}. "
            "Set it in backend/.env or the process environment."
        )
    return value
