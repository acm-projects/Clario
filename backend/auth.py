import jwt
import time
from fastapi import Depends, HTTPException, status
from fastapi import Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
import os

from config import settings, require_setting

SUPABASE_URL = require_setting("SUPABASE_URL", settings.supabase_url)
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

# Update this if your project's JWT Signing Keys tab shows a different algorithm
ALGORITHMS = ["ES256"]

bearer_scheme = HTTPBearer(auto_error=False)
jwk_client = PyJWKClient(JWKS_URL)

async def get_current_user(
    request: Request,
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    if (
        os.getenv("APP_ENV") == "development"
        and os.getenv("DEV_BYPASS_AUTH") == "true"
    ):
        return {
            "sub": os.getenv("DEV_USER_ID"),
            "email": os.getenv("DEV_USER_EMAIL"),
        }

    if creds is None:
        raise HTTPException(status_code=401, detail="Missing token")

    token = creds.credentials

    # Local development session: short-lived and signed.
    if (
        os.getenv("APP_ENV") == "development"
        and request.client is not None
        and request.client.host in ("127.0.0.1", "::1")
    ):
        secret = os.getenv("DEV_SESSION_SECRET")
        if secret:
            try:
                payload = jwt.decode(
                    token,
                    secret,
                    algorithms=["HS256"],
                    audience="clario-dev",
                    issuer="clario-local-vite",
                    options={"require": ["sub", "exp", "iat", "aud", "iss"]},
                    leeway=5,
                )
                if (
                    payload.get("sub") == os.getenv("DEV_USER_ID")
                    and payload.get("iat", 0) <= time.time()
                    and payload.get("exp", 0) - payload.get("iat", 0) <= 60
                ):
                    return payload
            except jwt.PyJWTError:
                pass

    # Standard Supabase authentication.
    try:
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=ALGORITHMS,
            audience="authenticated",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload
