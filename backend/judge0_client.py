
import os
import time

import httpx
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")

JUDGE0_URL = os.getenv(
    "JUDGE0_URL",
    "https://ce.judge0.com",
).rstrip("/")

LANGUAGE_IDS = {
    "python3": 92,
    "java": 91,
}

# Maximum total time allowed for one Judge0 execution.
EXECUTION_TIMEOUT = 20

# Delay between status checks.
POLL_INTERVAL = 1


def execute_code(
    source_code: str,
    language: str = "python3",
    stdin: str = "",
) -> dict:
    """
    Execute code using Judge0 submission tokens and polling.

    Returns execution status, stdout, stderr,
    compilation output, execution time, and memory.
    """

    if language not in LANGUAGE_IDS:
        raise ValueError(
            f"Unsupported language: {language}"
        )

    if not source_code.strip():
        raise ValueError("Source code cannot be empty")

    payload = {
        "language_id": LANGUAGE_IDS[language],
        "source_code": source_code,
        "stdin": stdin,
        "cpu_time_limit": 5,
        "wall_time_limit": 10,
        "memory_limit": 128000,
    }

    deadline = time.monotonic() + EXECUTION_TIMEOUT

    with httpx.Client(
        timeout=httpx.Timeout(
            connect=5.0,
            read=5.0,
            write=5.0,
            pool=5.0,
        )
    ) as client:

        # -----------------------------------------
        # Step 1: Submit code without waiting
        # -----------------------------------------
        try:
            response = client.post(
                f"{JUDGE0_URL}/submissions/",
                params={
                    "base64_encoded": "false",
                    "wait": "false",
                },
                json=payload,
            )

            response.raise_for_status()
            submission = response.json()

        except httpx.TimeoutException as error:
            raise RuntimeError(
                "Judge0 submission request timed out"
            ) from error

        token = submission.get("token")

        if not token:
            raise RuntimeError(
                "Judge0 did not return a submission token"
            )

        # -----------------------------------------
        # Step 2: Poll Judge0 for execution result
        # -----------------------------------------
        while time.monotonic() < deadline:

            remaining = deadline - time.monotonic()

            if remaining <= 0:
                break

            try:
                response = client.get(
                    f"{JUDGE0_URL}/submissions/{token}",
                    params={
                        "base64_encoded": "false",
                    },
                    timeout=min(5.0, remaining),
                )

                response.raise_for_status()
                result = response.json()

            except httpx.TimeoutException:
                # Temporary timeout; retry while deadline remains.
                continue

            status = result.get("status") or {}
            status_id = status.get("id")

            # Judge0 status:
            # 1 = In Queue
            # 2 = Processing
            # 3+ = Completed (success or failure)
            if status_id not in (1, 2, None):
                return {
                    "status": status.get("description"),
                    "stdout": result.get("stdout"),
                    "stderr": result.get("stderr"),
                    "compile_output": result.get(
                        "compile_output"
                    ),
                    "time": result.get("time"),
                    "memory": result.get("memory"),
                }

            time.sleep(
                min(
                    POLL_INTERVAL,
                    max(0, deadline - time.monotonic()),
                )
            )

    raise RuntimeError(
        "Judge0 execution did not complete within "
        f"{EXECUTION_TIMEOUT} seconds"
    )
