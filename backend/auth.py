import os

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]  # e.g. https://xxxx.supabase.co
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

# Update this if your project's JWT Signing Keys tab shows a different algorithm
ALGORITHMS = ["ES256"]

bearer_scheme = HTTPBearer()
jwk_client = PyJWKClient(JWKS_URL)


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    Verifies a Supabase-issued JWT and returns its payload
    (contains 'sub' = user id, 'email', 'role', etc).
    Raises 401 if the token is missing, expired, or invalid.
    """
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