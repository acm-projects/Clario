# Piston Code Execution

Clario uses [Piston](https://github.com/engineer-man/piston) to run code submitted from the Interview Room. Piston runs locally in a Docker container and currently supports Python and Java for Clario.

## Setup

Make sure Docker Desktop is installed and running.

From the `backend/piston` directory, create and start the Piston container:

```bash
docker run --privileged \
  -v $PWD/piston_data:/piston \
  -dit \
  -p 2000:2000 \
  --name piston_api \
  ghcr.io/engineer-man/piston
```

Piston will be available at:

```text
http://localhost:2000
```

## Install Python

Run this once after creating the container:

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language":"python","version":"*"}'
```

## Install Java

Run this once after creating the container:

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language":"java","version":"*"}'
```

## Check Installed Runtimes

To confirm that Python and Java are installed:

```bash
curl http://localhost:2000/api/v2/runtimes
```

## Starting Piston Again

If the Piston container already exists but is stopped, you do not need to create it again.

Start it with:

```bash
docker start piston_api
```

## Stopping Piston

```bash
docker stop piston_api
```

## Removing the Container

If you need to completely remove the Piston container:

```bash
docker rm -f piston_api
```

After removing it, run the setup steps above again to recreate it.

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
- Piston runs locally on port `2000`.
- Clario's FastAPI backend runs separately and communicates with Piston.
- Do not commit API keys or `.env` files.
- Java programs currently need a `public static void main` method to run. A test harness for LeetCode-style `class Solution` code will be added later.

## How to get backend started
1. cd backend
2. docker start piston_api
3. source venv/bin/activate
4. uvicorn main:app --reload