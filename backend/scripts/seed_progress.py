
import argparse
import json
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from dotenv import load_dotenv

load_dotenv(BACKEND / ".env")

from db import supabase

MANIFEST = Path(__file__).with_name("progress_seed_manifest.json")

STEPS = [
    "understand", "match", "plan",
    "implement", "review", "evaluate"
]

SAMPLES = [
    ("two-sum", "surprise", 21, 55, 60, 45,
     ["plan", "review", "evaluate"]),
    ("valid-palindrome", "recommended", 19, 62, 70, 50,
     ["plan", "review"]),
    ("valid-anagram", "recommended", 17, 50, 58, 52,
     ["match", "plan", "evaluate"]),
    ("climbing-stairs", "custom", 14, 48, 55, 58,
     ["plan", "review"]),
    ("3sum", "recommended", 12, 72, 78, 64,
     ["review"]),
    ("group-anagrams", "surprise", 9, 58, 64, 66,
     ["plan"]),
    ("maximum-depth-of-binary-tree", "custom", 6, 82, 88, 74,
     ["evaluate"]),
    ("house-robber", "recommended", 3, 60, 62, 76,
     []),
    (None, "company", 1, 80, 84, 82,
     []),
]


def user_id():
    value = os.getenv("DEV_USER_ID")

    if not value:
        raise RuntimeError(
            "DEV_USER_ID is missing from backend/.env"
        )

    return str(uuid.UUID(value))


def cleanup():
    if not MANIFEST.exists():
        print("No seed manifest found. Nothing deleted.")
        return

    data = json.loads(MANIFEST.read_text())
    ids = data.get("session_ids", [])

    if not ids:
        print("Manifest contains no session IDs.")
        return

    # Verify ownership before deleting anything.
    rows = (
        supabase.table("interview_sessions")
        .select("id, user_id")
        .in_("id", ids)
        .execute()
        .data
    )

    if any(str(r["user_id"]) != data["user_id"] for r in rows):
        raise RuntimeError("Ownership mismatch. Cleanup aborted.")

    for table in ("session_events", "feedback_reports"):
        (
            supabase.table(table)
            .delete()
            .in_("session_id", ids)
            .execute()
        )

    (
        supabase.table("interview_sessions")
        .delete()
        .in_("id", ids)
        .execute()
    )

    MANIFEST.unlink()
    print(f"Cleanup complete: {len(ids)} seeded session IDs.")


def seed():
    if MANIFEST.exists():
        raise RuntimeError(
            "Seed manifest already exists. "
            "Run --cleanup before seeding again."
        )

    uid = user_id()
    now = datetime.now(timezone.utc)

    # Write the manifest before inserting records so
    # partial failures can still be cleaned up.
    session_ids = [str(uuid.uuid4()) for _ in range(11)]

    manifest = {
        "user_id": uid,
        "session_ids": session_ids,
    }

    MANIFEST.write_text(json.dumps(manifest, indent=2))

    for index, sample in enumerate(SAMPLES):
        slug, mode, days, ps, tech, comm, missed = sample
        sid = session_ids[index]

        started = now - timedelta(days=days)
        ended = started + timedelta(minutes=45)

        session = {
            "id": sid,
            "user_id": uid,
            "problem_slug": slug,
            "mode": mode,
            "status": "completed",
            "language": "python3",
            "started_at": started.isoformat(),
            "ended_at": ended.isoformat(),
        }

        supabase.table("interview_sessions").insert(
            session
        ).execute()

        overall = round(
            ps * 0.35 + tech * 0.40 + comm * 0.25, 1
        )

        feedback = {
            "session_id": sid,
            "reasoning_score": ps,
            "technical_score": tech,
            "communication_score": comm,
            "overall_score": overall,
            "strengths": [],
            "weaknesses": [],
            "recommendations": [],
            "report": {
                "source": "progress_seed",
                "reasoning_score": ps,
                "technical_score": tech,
                "communication_score": comm,
                "overall_score": overall,
                "umpire": {
                    step: step not in missed
                    for step in STEPS
                },
            },
        }

        supabase.table("feedback_reports").insert(
            feedback
        ).execute()

        events = [
            {
                "session_id": sid,
                "event_type": (
                    "step_skipped"
                    if step in missed
                    else "step_completed"
                ),
                "metadata": {"step": step},
                "created_at": (
                    started + timedelta(minutes=i * 5)
                ).isoformat(),
            }
            for i, step in enumerate(STEPS)
        ]

        supabase.table("session_events").insert(
            events
        ).execute()

        print(f"Created {index + 1}/9: {slug or 'company'}")

    excluded = [
        ("two-sum", "surprise", "completed", 2),
        ("valid-anagram", "custom", "in_progress", 0),
    ]

    for offset, (slug, mode, status, days) in enumerate(excluded):
        started = now - timedelta(days=days)

        row = {
            "id": session_ids[9 + offset],
            "user_id": uid,
            "problem_slug": slug,
            "mode": mode,
            "status": status,
            "language": "python3",
            "started_at": started.isoformat(),
            "ended_at": (
                (started + timedelta(minutes=30)).isoformat()
                if status == "completed"
                else None
            ),
        }

        supabase.table("interview_sessions").insert(
            row
        ).execute()

    print("Seed complete: 11 sessions, 9 reports.")
    print("Use --cleanup to remove the seeded records.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--cleanup", action="store_true")
    args = parser.parse_args()

    if args.cleanup:
        cleanup()
    else:
        seed()
