# Piston Code Execution

Clario uses [Piston](https://github.com/engineer-man/piston) to run code submitted from the Interview Room. Piston runs locally in a Docker container and currently supports Python and Java for Clario.

## Setup

Make sure Docker Desktop is installed and running.

From the repository root, create and start the Piston container:

```powershell
docker compose -f backend/piston/compose.yaml up -d
```

Piston will be available at:

```text
http://localhost:2000
```

## Install Python

Install runtimes once after starting the container. Installed packages persist
in the Compose volume if the container is recreated.

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:2000/api/v2/packages `
  -ContentType "application/json" `
  -Body '{"language":"python","version":"*"}'
```

## Install Java

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:2000/api/v2/packages `
  -ContentType "application/json" `
  -Body '{"language":"java","version":"*"}'
```

## Check Installed Runtimes

To confirm that Python and Java are installed:

```powershell
Invoke-RestMethod http://localhost:2000/api/v2/runtimes
```

## Restarting Piston

If the Piston container already exists but is stopped, you do not need to create it again.

Start it with:

```bash
docker compose -f backend/piston/compose.yaml start
```

## Stopping Piston

```bash
docker compose -f backend/piston/compose.yaml stop
```

## Removing the Container

If you need to completely remove the Piston container:

```bash
docker compose -f backend/piston/compose.yaml down
```

The named Compose volume preserves installed runtimes. To remove those too and
start fresh, run:

```bash
docker compose -f backend/piston/compose.yaml down --volumes
```

## Clario API

Clario's FastAPI backend communicates with Piston through the `/run` endpoint.

The endpoint accepts:

```json
{
  "language": "python",
  "code": "print(\"hi\")"
}
```

and returns:

```json
{
  "stdout": "hi\n",
  "stderr": "",
  "exit_code": 0
}
```

Both Python and Java are supported.

Code execution has a timeout so programs such as infinite loops cannot hang the server.

## Notes

- Docker Desktop must be running before starting Piston.
- Piston listens on `127.0.0.1:2000`, so the code execution API is not exposed to other machines on the network.
- The container runs privileged because Piston uses Linux isolation features for untrusted code. Keep it on a trusted development machine.
- Clario's FastAPI backend runs separately and communicates with Piston.
- Do not commit API keys or `.env` files.
- Java programs currently need a `public static void main` method to run. A test harness for LeetCode-style `class Solution` code will be added later.

## How to get backend started
1. From the repository root, start Piston with `docker compose -f backend/piston/compose.yaml up -d`.
2. Install Python and Java packages using the commands above (once per Piston data volume).
3. Start the backend using the commands in [backend/README.md](../README.md).

## Backend dependencies and tests

The backend dependency source of truth is `backend/requirements.txt`.
From the repository root:

```bash
python3 -m venv backend/venv
backend/venv/bin/python -m pip install -r backend/requirements.txt
```

Copy `backend/.env.example` to `backend/.env` and provide the Supabase,
Gemini, and ElevenLabs values before starting the API. The development
authentication bypass remains available with `DEV_BYPASS_AUTH=true`.

Start the API from `backend/` so its existing import paths continue to work:

```bash
cd backend
../backend/venv/bin/uvicorn main:app --reload
```

Run the backend unit tests from the repository root:

```bash
backend/venv/bin/python -m pytest backend/tests -q
```