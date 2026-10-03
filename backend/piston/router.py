import os
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

#create the router!!
router = APIRouter()

PISTON_URL = os.getenv("PISTON_URL", "http://localhost:2000/api/v2/execute")
PISTON_VERSIONS = {
    "python": os.getenv("PISTON_PYTHON_VERSION", "*"),
    "java": os.getenv("PISTON_JAVA_VERSION", "*"),
}
MAX_OUTPUT_LENGTH = 100_000

FILE_NAMES = {"python": "main.py", "java": "Main.java"}


def limit_output(value: str) -> str:
    if len(value) <= MAX_OUTPUT_LENGTH:
        return value
    return value[:MAX_OUTPUT_LENGTH] + "\n[output truncated]"

#defines what something must send to /run
class RunRequest(BaseModel):
    language: Literal["python", "java"]
    code: str = Field(min_length=1, max_length=50_000)

#defines what we send back from the piston sandbox
class RunResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int

@router.post("/run", response_model=RunResponse)
async def run_code(req: RunRequest):
    #taking our req and converting it into what Piston expects
    payload = {
        "language": req.language,
        "version": PISTON_VERSIONS[req.language],
        "files": [{"name": FILE_NAMES[req.language], "content": req.code}],
        "run_timeout": 3000,       # ms, kills infinite loops
        "compile_timeout": 10000,
    }
    #here were actually calling piston
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            #send payload to piston, r is Pistons HTTP response
            r = await client.post(PISTON_URL, json=payload)
            #check whether the http request succceeded
            r.raise_for_status()
    except httpx.TimeoutException:
        return RunResponse(stdout="", stderr="Execution timed out.", exit_code=124)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Code execution service unavailable")

    #convert Piston's JSON to Python
    try:
        data = r.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="Invalid response from code execution service") from exc
    #get compiling data for Java envs
    compile_stage = data.get("compile")
    #immediately return compiler error
    if compile_stage and compile_stage.get("code") not in (0, None):
        return RunResponse(
            stdout=compile_stage.get("stdout", ""),
            stderr=compile_stage.get("stderr", ""),
            exit_code=compile_stage["code"],
        )

    #get the actual execution and code
    run = data.get("run")
    if not isinstance(run, dict):
        raise HTTPException(status_code=502, detail="Invalid response from code execution service")

    code = run.get("code")
    #if piston killed the program, treat it as a timeout
    if code is None:
        code = 124
        stderr = (run.get("stderr") or "") + f"\nTerminated ({run.get('signal')})"
    else:
        stderr = run.get("stderr", "")
    
    #finally return our
    return RunResponse(
        stdout=limit_output(run.get("stdout", "")),
        stderr=limit_output(stderr),
        exit_code=code,
    )