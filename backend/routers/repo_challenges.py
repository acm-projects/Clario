from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from starlette.concurrency import run_in_threadpool

from auth import get_current_user
from piston.service import PistonServiceError
from services import repo_challenge_service as service

router = APIRouter(prefix="/api/repo-challenges", tags=["repo-debugging"])


class TranscriptTurn(BaseModel):
    source: str = Field(max_length=30)
    message: str = Field(max_length=4000)


class RepositoryInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    files: dict[str, str] = Field(min_length=1, max_length=20)
    transcript: list[TranscriptTurn] = Field(default_factory=list, max_length=400)


@router.get("")
def list_challenges():
    return [service.metadata(manifest) for _, manifest in service.catalog().values()]


@router.get("/{challenge_id}")
def get_challenge(challenge_id: str):
    try:
        return service.detail(challenge_id)
    except KeyError:
        raise HTTPException(404, "Repository challenge not found")


async def run(challenge_id: str, files: dict):
    try:
        return await service.evaluate(challenge_id, files)
    except KeyError:
        raise HTTPException(404, "Repository challenge not found")
    except service.InvalidRepository as error:
        raise HTTPException(422, str(error))
    except PistonServiceError:
        raise HTTPException(503, "Piston is unavailable or Python is not installed. Start Piston and install its Python runtime.")


@router.post("/{challenge_id}/run")
async def run_challenge(challenge_id: str, body: RepositoryInput, user: dict = Depends(get_current_user)):
    return await run(challenge_id, body.files)


@router.post("/{challenge_id}/submit")
async def submit_challenge(challenge_id: str, body: RepositoryInput, user: dict = Depends(get_current_user)):
    evaluation = await run(challenge_id, body.files)
    # Candidate failures still finish an interview. Infrastructure outages raise
    # from run() before we save anything.
    stored_evaluation = {**evaluation, "transcript": [turn.model_dump() for turn in body.transcript]}
    submission = await run_in_threadpool(service.save_submission, user["sub"], challenge_id, body.files, stored_evaluation)
    return {**evaluation, "submission": submission}
