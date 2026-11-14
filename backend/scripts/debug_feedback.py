"""Diagnose failing feedback reports.

Usage from backend/:
  venv/bin/python -m scripts.debug_feedback                      # recent sessions: job status + error
  venv/bin/python -m scripts.debug_feedback --ping               # is the configured Gemini model answering?
  venv/bin/python -m scripts.debug_feedback --dry-run SESSION_ID # build real evidence, call Gemini, save nothing

--ping costs one Gemini request and --dry-run up to two; free-tier keys allow only
about 20 requests per model per day, so use them sparingly.
"""
import argparse
import asyncio
import os
import time
from unittest.mock import patch

import httpx

from db import supabase


def show_recent(limit: int) -> None:
    sessions = (supabase.table("interview_sessions").select("id, status, conversation_id, started_at")
                .order("started_at", desc=True).limit(limit).execute().data)
    conversations = [s["conversation_id"] for s in sessions if s["conversation_id"]]
    jobs = {j["conversation_id"]: j for j in (supabase.table("post_call_jobs")
            .select("conversation_id, status, attempts, last_error, updated_at")
            .in_("conversation_id", conversations).execute().data if conversations else [])}
    reports = {r["session_id"] for r in supabase.table("feedback_reports").select("session_id")
               .in_("session_id", [s["id"] for s in sessions]).execute().data} if sessions else set()
    for s in sessions:
        job = jobs.get(s["conversation_id"])
        if not s["conversation_id"]:
            job_text = "no voice call (report generated on demand)"
        elif not job:
            job_text = "NO JOB: ElevenLabs webhook never arrived (is ngrok running?)"
        else:
            job_text = f"job {job['status']} (attempts {job['attempts']}) {job['last_error'] or ''}".strip()
        print(f"{s['started_at'][:16]}  {s['id']}  {s['status']:<11}  report={'yes' if s['id'] in reports else 'no ':<3}  {job_text}")


def ping() -> None:
    model = os.getenv("GEMINI_MODEL", "").strip() or "(unset: code default)"
    started = time.monotonic()
    try:
        response = httpx.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{os.getenv('GEMINI_MODEL', 'gemini-3.6-flash')}:generateContent",
            headers={"x-goog-api-key": os.getenv("GEMINI_API_KEY", "")}, timeout=30,
            json={"contents": [{"role": "user", "parts": [{"text": "Reply with OK."}]}]})
        print(f"model {model}: HTTP {response.status_code} in {time.monotonic() - started:.1f}s")
        if response.status_code != 200:
            print(response.json().get("error", {}).get("message", response.text)[:600])
    except httpx.TimeoutException:
        print(f"model {model}: no answer in 30s (overloaded or unavailable; try another GEMINI_MODEL)")


def dry_run(session_id: str) -> None:
    from routers import feedback
    import gemini_feedback
    session = supabase.table("interview_sessions").select("*").eq("id", session_id).limit(1).execute().data[0]
    captured = {}

    class Captured(Exception):
        pass

    async def capture(evidence):
        captured["evidence"] = evidence
        raise Captured
    # Build evidence through the app's own code path, stopping before Gemini and saving.
    with patch.object(feedback, "generate_feedback", capture), patch.object(feedback, "get_saved_report", return_value=None):
        try:
            asyncio.run(feedback.generate_feedback_for_session(session, refresh=True))
        except Captured:
            pass
    evidence = captured["evidence"]
    print(f"evidence: {len(evidence['code'])} code chars, {len(evidence['session_evidence']['transcript'])} transcript turns, "
          f"{len(evidence.get('executions') or [])} runs")
    started = time.monotonic()
    try:
        report = asyncio.run(gemini_feedback.generate_feedback(evidence))
        print(f"OK in {time.monotonic() - started:.1f}s with {report['model']}: scores "
              f"{report['technical_score']}/{report['reasoning_score']}/{report['communication_score']}")
        print("verdict:", report["details"]["verdict"])
    except Exception as error:  # noqa: BLE001 - diagnostic output
        print(f"FAILED in {time.monotonic() - started:.1f}s:", getattr(error, "detail", error))
        print("The warning lines above show Gemini's exact reason.")


if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.WARNING, format="%(message)s")
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--limit", type=int, default=8)
    parser.add_argument("--ping", action="store_true")
    parser.add_argument("--dry-run", metavar="SESSION_ID")
    args = parser.parse_args()
    if args.ping:
        ping()
    elif args.dry_run:
        dry_run(args.dry_run)
    else:
        show_recent(args.limit)
