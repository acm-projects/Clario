from fastapi import APIRouter, Depends, HTTPException
from pydantic import ConfigDict, Field
from starlette.concurrency import run_in_threadpool

from auth import get_current_user
from piston.service import PistonServiceError
from services import repo_challenge_service as service
from interview_evidence import InterviewEvidence
from typing import Literal

router = APIRouter(prefix="/api/repo-challenges", tags=["repo-debugging"])


class RepositoryInput(InterviewEvidence):
    model_config = ConfigDict(extra="forbid")
    files: dict[str, str] = Field(min_length=1, max_length=20)
    language: Literal["python", "cpp", "javascript"] | None = None


@router.get("")
def list_challenges():
    return [service.metadata(manifest) for _, manifest in service.catalog().values()]


@router.get("/{challenge_id}")
def get_challenge(challenge_id: str, language: Literal["python", "cpp", "javascript"] | None = None):
    try:
        return service.detail(challenge_id, language)
    except KeyError:
        raise HTTPException(404, "Repository challenge not found")
    except service.InvalidRepository as error:
        raise HTTPException(422, str(error))


async def run(challenge_id: str, files: dict, language: str | None = None):
    try:
        return await service.evaluate(challenge_id, files, language)
    except KeyError:
        raise HTTPException(404, "Repository challenge not found")
    except service.InvalidRepository as error:
        raise HTTPException(422, str(error))
    except PistonServiceError:
        raise HTTPException(503, "Code execution is unavailable. Start Piston and install the selected language runtime.")


@router.post("/{challenge_id}/run")
async def run_challenge(challenge_id: str, body: RepositoryInput, user: dict = Depends(get_current_user)):
    return await run(challenge_id, body.files, body.language)


@router.post("/{challenge_id}/submit")
async def submit_challenge(challenge_id: str, body: RepositoryInput, user: dict = Depends(get_current_user)):
    try:
        service.validate_files(challenge_id, body.files, body.language)
    except KeyError:
        raise HTTPException(404, "Repository challenge not found")
    except service.InvalidRepository as error:
        raise HTTPException(422, str(error))
    # The browser sends the snapshot and review cue through the active voice call.
    # Submit never runs candidate code and never completes an interview.
    return {"review_requested": True}


@router.post("/{challenge_id}/finish")
async def finish_challenge(challenge_id: str, body: RepositoryInput, user: dict = Depends(get_current_user)):
    try:
        service.validate_files(challenge_id, body.files, body.language)
    except KeyError:
        raise HTTPException(404, "Repository challenge not found")
    except service.InvalidRepository as error:
        raise HTTPException(422, str(error))
    evidence = {"transcript": [turn.model_dump(mode="json", exclude_none=True) for turn in body.transcript], "communication": body.communication.model_dump(mode="json") if body.communication else None, "duration_seconds": body.duration_seconds, "run_events": [event.model_dump() for event in body.run_events]}
    submission = await run_in_threadpool(service.save_submission, user["sub"], challenge_id, body.files, evidence, body.language)
    if not submission["saved"]:
        raise HTTPException(503, submission["message"])
    return submission
