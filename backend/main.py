from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth import get_current_user
from piston.router import router as piston_router
from routers.problems import router as problems_router
from routers.scenarios import router as scenarios_router
from routers.sessions import router as sessions_router
from voice.router import router as voice_router

#where our python app starts
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(piston_router)
app.include_router(voice_router)
app.include_router(problems_router)
app.include_router(sessions_router)
app.include_router(scenarios_router)



@app.get("/")
async def root():
    return {"status": "ok"}


@app.get("/api/me")
async def read_me(user: dict = Depends(get_current_user)):
    """
    Protected route. Requires a valid Supabase access token in the
    Authorization header: '******'.
    """
    return {"user_id": user["sub"], "email": user.get("email")}
