from fastapi import Depends, FastAPI

from auth import get_current_user

app = FastAPI()

@app.get("/")
async def root():
    return {"status": "ok"}


@app.get("/api/me")
async def read_me(user: dict = Depends(get_current_user)):
    """
    Protected route. Requires a valid Supabase access token in the
    Authorization header: 'Bearer <token>'.
    """
    return {"user_id": user["sub"], "email": user.get("email")}