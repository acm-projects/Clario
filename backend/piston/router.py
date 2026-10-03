import httpx
from typing import Literal #lets us restrict possible values for language field
from fastapi import APIRouter, HTTPException 
from pydantic import BaseModel #how fastapi defines what incoming/outgoing JSON should look like

#create the router!!
router = APIRouter()

PISTON_URL = "http://localhost:2000/api/v2/execute"

FILE_NAMES = {"python": "main.py", "java": "Main.java"}

#defines what something must send to /run
class RunRequest(BaseModel):
    language: Literal["python", "java"]
    code: str

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
        "version": "*",
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
    data = r.json()
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
    run = data["run"]
    code = run.get("code")
    #if piston killed the program, treat it as a timeout
    if code is None:
        code = 124
        run["stderr"] = (run.get("stderr") or "") + f"\nTerminated ({run.get('signal')})"
    
    #finally return our result!
    return RunResponse(stdout=run.get("stdout", ""), stderr=run.get("stderr", ""), exit_code=code)