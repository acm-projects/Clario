from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth import get_current_user
from routers.problems import router as problems_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(problems_router)

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