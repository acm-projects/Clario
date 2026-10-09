import os
from typing import Literal, Optional

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


# =====================================================================
# NEW: POST /run/tests  (LeetCode-style "run against test cases")
# Everything below is added to the bottom of the file. /run above is untouched.
# =====================================================================
import json  # noqa: E402
from typing import Any  # noqa: E402

from .harness import split_output, wrap_python  # noqa: E402
from .testcases import UnsupportedProblem, build_test_cases, parse_signature  # noqa: E402


async def execute_on_piston(language: str, source: str) -> tuple[str, str, int]:
    """Sends source code to Piston. Returns (stdout, stderr, exit_code)."""
    #here we're constructing the JSON request that piston expects
    payload = {
        "language": language,
        "version": PISTON_VERSIONS[language],
        "files": [{"name": FILE_NAMES[language], "content": source}],
        "run_timeout": 3000,
        "compile_timeout": 10000,
    }
    #now sending the code to our piston server
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(PISTON_URL, json=payload)
            r.raise_for_status()
    except httpx.TimeoutException:
        return "", "Execution timed out.", 124
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Code execution service unavailable")

    #convert Piston's JSON response into python dict for data
    try:
        data = r.json()
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="Invalid response from code execution service") from exc

    compile_stage = data.get("compile")
    if compile_stage and compile_stage.get("code") not in (0, None):
        return compile_stage.get("stdout", ""), compile_stage.get("stderr", ""), compile_stage["code"]

    run = data.get("run")
    if not isinstance(run, dict):
        raise HTTPException(status_code=502, detail="Invalid response from code execution service")

    code = run.get("code")
    if code is None:                       # Piston killed it (e.g. infinite loop)
        return run.get("stdout", ""), (run.get("stderr") or ""), 124
    return run.get("stdout", ""), run.get("stderr", ""), code


def load_problem(slug: str) -> Optional[dict]:
    """
    TEMPORARY. Replace the body with a call to get_problem(slug) from CLA-37
    once it's in the backend
    """
    from .fake_problems import FAKE_PROBLEMS
    return FAKE_PROBLEMS.get(slug)


class TestsRequest(BaseModel):
    slug: str
    language: Literal["python", "java"]
    code: str = Field(min_length=1, max_length=50_000)


class CaseOut(BaseModel):
    case: int
    input: str
    expected: str
    output: Optional[str]
    passed: bool


class TestsResponse(BaseModel):
    status: str            # Accepted | Wrong Answer | Runtime Error | Time Limit Exceeded | Compile Error | Unsupported
    passed: int
    total: int
    cases: list[CaseOut]
    stdout: str
    error: Optional[str]


def _fmt(value: Any) -> str:
    """[0, 1] -> '[0,1]' so it looks like LeetCode."""
    return json.dumps(value, separators=(",", ":"))


def _empty(status: str, error: Optional[str] = None, stdout: str = "", total: int = 0) -> TestsResponse:
    return TestsResponse(status=status, passed=0, total=total, cases=[], stdout=stdout, error=error)

#this is out actual run/tests endpoint
@router.post("/run/tests", response_model=TestsResponse)
async def run_tests(req: TestsRequest):
    # 1. Java isn't supported yet (Step 4 of the ticket)
    if req.language == "java":
        return _empty("Unsupported", "Java test cases not supported for this problem yet")

    # 2. Look up the problem
    problem = load_problem(req.slug)
    if problem is None:
        raise HTTPException(status_code=404, detail="Problem not found")

    # 3. Build test cases (or bail out gracefully)
    try:
        method_name, param_names = parse_signature(problem["starter_code"]["python3"])
        cases = build_test_cases(problem)
    except UnsupportedProblem as e:
        return _empty("Unsupported", str(e))

    # 4. Wrap the user's code + run it in ONE Piston call
    script = wrap_python(req.code, method_name, [c["input"] for c in cases])
    stdout, stderr, exit_code = await execute_on_piston("python", script)
    user_stdout, results = split_output(stdout)
    user_stdout = limit_output(user_stdout)
    total = len(cases)

    # 5. No results line => the program died or timed out before finishing
    if results is None:
        if exit_code == 124:
            return _empty("Time Limit Exceeded", "Your code took too long to run.", user_stdout, total)
        return _empty("Runtime Error", limit_output(stderr) or "Your code crashed.", user_stdout, total)

    # 6. Compare each output with the expected answer
    case_rows, passed, first_error = [], 0, None
    for i, (case, res) in enumerate(zip(cases, results), start=1):
        input_text = ", ".join(f"{n} = {_fmt(v)}" for n, v in zip(param_names, case["input"]))
        if not res["ok"]:
            first_error = first_error or res["error"]
            case_rows.append(CaseOut(case=i, input=input_text, expected=_fmt(case["expected"]),
                                     output=None, passed=False))
            continue
        ok = res["output"] == case["expected"]       # compares real values, so [0, 1] == [0,1]
        passed += ok
        case_rows.append(CaseOut(case=i, input=input_text, expected=_fmt(case["expected"]),
                                 output=_fmt(res["output"]), passed=ok))

    if first_error:
        status = "Runtime Error"
    elif passed == total:
        status = "Accepted"
    else:
        status = "Wrong Answer"

    return TestsResponse(status=status, passed=passed, total=total, cases=case_rows,
                         stdout=user_stdout, error=first_error)