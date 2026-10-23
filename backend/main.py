from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from auth import get_current_user

from routers.problems import router as problems_router
from routers.sessions import router as sessions_router
from routers.scenarios import router as scenarios_router
from routers.code_runner import router as code_runner_routers
from routers.companies import router as companies_router

app = FastAPI()

from routers.code_runner import limiter

app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(problems_router)
app.include_router(sessions_router)
app.include_router(scenarios_router)
app.include_router(companies_router)
app.include_router(code_runner_routers)

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
