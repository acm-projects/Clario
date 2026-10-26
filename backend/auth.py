import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from config import settings, require_setting

SUPABASE_URL = require_setting("SUPABASE_URL", settings.supabase_url)
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

# Update this if your project's JWT Signing Keys tab shows a different algorithm
ALGORITHMS = ["ES256"]

bearer_scheme = HTTPBearer(auto_error=False)
jwk_client = PyJWKClient(JWKS_URL)


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    Verifies a Supabase-issued JWT and returns its payload
    (contains 'sub' = user id, 'email', 'role', etc).
    Raises 401 if the token is missing, expired, or invalid.
    """
    if settings.dev_bypass_auth:
        return {"sub": settings.dev_user_id, "email": settings.dev_user_email}

    if creds is None:
        raise HTTPException(status_code=401, detail="Missing token")

    token = creds.credentials

    try:
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=ALGORITHMS,
            audience="authenticated",
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload