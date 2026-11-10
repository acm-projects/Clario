"""Manifest-backed repositories; candidate code only runs in Piston."""
from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from uuid import uuid4
from pathlib import Path

from config import settings
from piston.service import execute_files_on_piston

logger = logging.getLogger(__name__)
CHALLENGES = Path(__file__).resolve().parents[1] / "challenges"
MAX_FILE_BYTES = 50_000
MAX_SOURCE_BYTES = 150_000
RUNNER_NAME = "_clario_runner.py"
TEST_NAME = "_clario_tests.py"
MARKER = "__CLARIO_REPO_RESULTS__"


class InvalidRepository(ValueError):
    pass


def safe_path(base: Path, name: str) -> Path:
    # MVP execution is intentionally flat; rejects Windows and POSIX traversal.
    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]*\.(py|js|cpp|hpp|md|txt)", name):
        raise InvalidRepository("Only manifest-defined, flat repository files are supported.")
    target = (base / name).resolve()
    if not target.is_relative_to(base.resolve()):
        raise InvalidRepository("Invalid repository file path.")
    return target


def catalog() -> dict[str, tuple[Path, dict]]:
    entries = {}
    for manifest_path in sorted(CHALLENGES.glob("*/challenge.json")):
        folder = manifest_path.parent.resolve()
        if not folder.is_relative_to(CHALLENGES.resolve()) or not manifest_path.resolve().is_relative_to(folder):
            raise InvalidRepository("Invalid challenge manifest.")
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        identifier = manifest["id"]
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", identifier) or identifier in entries:
            raise InvalidRepository("Invalid or duplicate challenge ID.")
        editable, readonly = manifest["editableFiles"], manifest["readOnlyFiles"]
        names = editable + readonly
        if not editable or len(names) > 20 or len(names) != len(set(names)) or manifest["entrypoint"] not in editable:
            raise InvalidRepository("Invalid challenge file configuration.")
        if manifest["language"] not in {"python", "javascript"}:
            raise InvalidRepository("Unsupported repository language.")
        for name in names:
            safe_path(folder / "starter", name)
        test_names = manifest["testNames"]
        if not test_names or len(test_names) > 30 or len(test_names) != len(set(test_names)):
            raise InvalidRepository("Invalid test configuration.")
        entries[identifier] = (folder, manifest)
    return entries


def load(identifier: str, language: str | None = None) -> tuple[Path, dict]:
    # Never interpolate a request ID into a host path.
    entry = catalog().get(identifier)
    if entry is None:
        raise KeyError(identifier)
    folder, manifest = entry
    if language is not None and language != manifest["language"]:
        if language not in {"python", "cpp"}:
            raise InvalidRepository("Unsupported repository language.")
        folder = folder / language
        variant = folder / "challenge.json"
        if not variant.is_file():
            raise InvalidRepository("This repository is unavailable in that language.")
        manifest = json.loads(variant.read_text(encoding="utf-8"))
    return folder, manifest


def metadata(manifest: dict) -> dict:
    data = {key: manifest[key] for key in ("id", "title", "difficulty", "language", "category", "estimatedMinutes", "description", "objective", "expectedBehavior", "constraints", "entrypoint")}
    data["languages"] = ["python", "cpp"]
    topics = json.loads((CHALLENGES / "topics.json").read_text(encoding="utf-8"))
    data["topics"] = topics.get(manifest["id"], [])
    return data


def detail(identifier: str, language: str | None = None) -> dict:
    folder, manifest = load(identifier, language)
    files = []
    for name in manifest["editableFiles"] + manifest["readOnlyFiles"]:
        files.append({"path": name, "content": safe_path(folder / "starter", name).read_text(encoding="utf-8"),
                      "language": "python" if name.endswith(".py") else "javascript" if name.endswith(".js") else "cpp" if name.endswith((".cpp", ".hpp")) else "markdown", "readOnly": name in manifest["readOnlyFiles"]})
    return {**metadata(manifest), "files": files}


def interviewer_root_cause(identifier: str, language: str | None = None) -> str:
    """Private, language-specific diagnosis; excluded from public challenge data."""
    _, manifest = load(identifier, language)
    notes = json.loads((CHALLENGES / "interviewer-notes.json").read_text(encoding="utf-8"))
    cause = notes.get(identifier, {}).get(manifest["language"])
    if not isinstance(cause, str) or not cause.strip():
        raise InvalidRepository("Interviewer notes are unavailable for this repository language.")
    return cause.strip()


def validate_files(identifier: str, submitted: dict[str, str], language: str | None = None) -> tuple[Path, dict, dict[str, str]]:
    folder, manifest = load(identifier, language)
    expected = set(manifest["editableFiles"])
    if set(submitted) != expected:
        raise InvalidRepository("Send exactly the editable files listed in this challenge. Read-only and unexpected files are rejected.")
    sizes = [len(source.encode("utf-8")) for source in submitted.values()]
    if any(size > MAX_FILE_BYTES for size in sizes) or sum(sizes) > MAX_SOURCE_BYTES:
        raise InvalidRepository("Repository source exceeds the 50 KB per-file or 150 KB total limit.")
    files = dict(submitted)
    for name in manifest["readOnlyFiles"]:
        files[name] = safe_path(folder / "starter", name).read_text(encoding="utf-8")
    return folder, manifest, files


def candidate_diagnostic(stderr: str, filenames: list[str]) -> str | None:
    """Return compiler locations in editable files without exposing private test source."""
    lines = []
    for line in stderr.splitlines():
        for name in filenames:
            match = re.search(r"(?:^|[/\\])" + re.escape(name) + r":\d+(?::\d+)?:.*", line)
            if match and "_clario_tests" not in line:
                lines.append(match.group().lstrip("/\\")[:1000])
                break
    return "\n".join(lines)[:4000] or None


async def evaluate(identifier: str, submitted: dict[str, str], language: str | None = None) -> dict:
    folder, manifest, files = validate_files(identifier, submitted, language)
    tests_path = safe_path(folder / "tests", manifest["testFile"])
    language = manifest["language"]
    extension = {"python": "py", "javascript": "js", "cpp": "cpp"}[language]
    runner_name, test_name = f"_clario_runner.{extension}", ("_clario_tests.hpp" if language == "cpp" else f"_clario_tests.{extension}")
    runner = (CHALLENGES / f"runner.{extension}").read_text(encoding="utf-8")
    if language == "python":
        runner = runner.replace("CANDIDATE_FILES = []", "CANDIDATE_FILES = " + repr(manifest["editableFiles"])).replace("ENTRYPOINT = None", "ENTRYPOINT = " + repr(manifest["entrypoint"]))
    payload = [{"name": runner_name, "content": runner},
               {"name": test_name, "content": tests_path.read_text(encoding="utf-8")},
               *({"name": name, "content": content} for name, content in files.items())]
    if language == "cpp":
        # Piston's C++ runtime treats every submitted file as a translation unit
        # and appends .cpp. Inline manifest-local headers into one source file;
        # never read candidate-specified includes from the API host filesystem.
        sources = {file["name"]: file["content"] for file in payload}
        included = set()
        def expand(name):
            if name in included:
                return ""
            included.add(name)
            source = re.sub(r"^\s*#\s*pragma\s+once\s*$", "", sources[name], flags=re.MULTILINE)
            return re.sub(r'^\s*#\s*include\s*"([^"\n]+)"[^\n]*$',
                          lambda match: ('\n#line 1 "' + match[1] + '"\n' + expand(match[1]) + '\n#line 1 "' + name + '"\n') if match[1] in sources else match[0],
                          source, flags=re.MULTILINE)
        payload = [{"name": runner_name, "content": expand(runner_name)}]
    stdout, stderr, code = await execute_files_on_piston(
        language, payload, piston_url=settings.piston_url,
        versions={"python": settings.piston_python_version, "javascript": settings.piston_javascript_version, "cpp": settings.piston_cpp_version}, bounded=True,
    )
    total = len(manifest["testNames"])
    error = None
    rows = []
    if code == 124:
        error = "Execution timed out or exceeded a resource limit. Check for infinite loops and excessive output."
    elif code != 0:
        error = candidate_diagnostic(stderr, manifest["editableFiles"]) or "Execution failed. Check your syntax, imports, and resource usage."
    else:
        try:
            # Only structured unit-test diagnostics or candidate-file compiler errors are returned.
            data = json.loads(stdout.split(MARKER, 1)[1])
            if isinstance(data, dict) and isinstance(data.get("error"), str):
                error = data["error"][:3000]
                data = data.get("tests", [])
            if error:
                return {"success": False, "passed": 0, "failed": 0, "total": total, "not_run": total, "tests": [], "error": error}
            if not isinstance(data, list) or len(data) != total or [row["name"] for row in data] != sorted(manifest["testNames"]):
                raise ValueError("Unexpected tests")
            if any(type(row["passed"]) is not bool for row in data):
                raise ValueError("Invalid test status")
            rows = [{"name": row["name"], "passed": row["passed"],
                     "status": "passed" if row["passed"] else ("error" if row.get("status") == "error" else "failed"),
                     "message": None if row["passed"] else (row.get("message")[:3000] if isinstance(row.get("message"), str) and row["message"] else "AssertionError: Behavior did not satisfy this unit test; review the documented contract.")} for row in data]
        except (ValueError, IndexError, KeyError, TypeError):
            error = "The test runner could not finish. Check syntax, imports, and unexpected process exits."
    passed = sum(row["passed"] for row in rows)
    return {"success": error is None and passed == total, "passed": passed, "failed": len(rows) - passed, "not_run": total - len(rows),
            "total": total, "tests": rows, "error": error}


def save_submission(user_id: str, identifier: str, files: dict, evaluation: dict, language: str | None = None) -> dict:
    """Save a repository interview in the existing session/report infrastructure."""
    session_id = str(uuid4())
    try:
        from db import supabase
        challenge = detail(identifier, language)
        language = "python3" if challenge["language"] == "python" else challenge["language"]
        supabase.table("interview_sessions").insert({
            "id": session_id, "user_id": user_id, "problem_slug": "repo-debugging:" + identifier,
            "mode": "practice", "language": language, "status": "in_progress",
        }).execute()
        supabase.table("code_snapshots").insert({"session_id": session_id, "language": language,
            "code": "\n\n".join(f"File: {path}\n{content}" for path, content in files.items())}).execute()
        from interview_evidence import InterviewEvidence, persist_evidence
        persist_evidence(supabase, session_id, InterviewEvidence.model_validate({key: evaluation[key] for key in ("transcript", "communication", "duration_seconds", "run_events") if key in evaluation}))
        # Only publish a completed interview after all report evidence is saved.
        result = supabase.table("interview_sessions").update({"status": "completed", "ended_at": datetime.now(timezone.utc).isoformat()}).eq("id", session_id).eq("user_id", user_id).execute()
        if not result.data:
            raise RuntimeError("No completed session returned")
        return {"saved": True, "submission_id": session_id, "message": "Interview saved. Preparing your feedback report."}
    except Exception:
        logger.warning("Repository submission storage unavailable")
        # Do not leave a partially saved interview or its evidence behind.
        try:
            supabase.table("interview_sessions").delete().eq("id", session_id).eq("user_id", user_id).execute()
        except Exception:
            logger.warning("Could not remove incomplete repository session")
        return {"saved": False, "submission_id": None, "message": "Evaluated, but account storage is unavailable. Your files remain in this browser; download a copy before leaving."}
