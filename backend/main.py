from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.feedback import router as feedback_router
from routers.progress import router as progress_router
from routers.repo_challenges import router as repo_challenges_router
from routers.assessment import router as assessment_router
from routers.companies import router as companies_router
from routers.system_design import router as system_design_router
from routers.code_runner import router as company_runner_router, limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from auth import get_current_user
from piston.router import router as piston_router
from routers.problems import router as problems_router
from routers.scenarios import router as scenarios_router
from routers.sessions import router as sessions_router
from voice.router import router as voice_router

#where our python app starts
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assessment_router)
app.include_router(companies_router)
app.include_router(system_design_router)
app.include_router(company_runner_router)
app.include_router(piston_router)
app.include_router(voice_router)
app.include_router(problems_router)
app.include_router(sessions_router)
app.include_router(scenarios_router)
app.include_router(feedback_router)
app.include_router(progress_router)
app.include_router(repo_challenges_router)

#routers


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
