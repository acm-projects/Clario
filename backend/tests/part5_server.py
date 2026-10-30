"""Isolated E2E server: real routes/ranking; in-memory storage; no Supabase writes.

Run: python -m uvicorn tests.part5_server:app --app-dir backend --port 8001
This module is never imported by the application or the regular pytest suite.
"""
from copy import deepcopy
from datetime import datetime, timezone
from threading import RLock
from types import SimpleNamespace
from uuid import uuid4

from fastapi import HTTPException

from auth import get_current_user
from main import app
from routers import assessment, problems, sessions
from piston import router as execution
from piston import service

USER = "part5-isolated-user"
CATALOG = [
    ("hash-lookup", "Hash Lookup", ["Hash Table"]),
    ("binary-lookup", "Binary Lookup", ["Binary Search"]),
    ("hash-search", "Hash Search", ["Hash Table", "Binary Search"]),
    ("table-counts", "Table Counts", ["Hash Table"]),
    ("sorted-lookup", "Sorted Lookup", ["Binary Search"]),
    ("dynamic-paths", "Dynamic Paths", ["Dynamic Programming"]),
    ("tree-paths", "Tree Paths", ["Tree"]),
    ("dynamic-tree", "Dynamic Tree", ["Dynamic Programming", "Tree"]),
    ("dynamic-count", "Dynamic Count", ["Dynamic Programming"]),
    ("tree-count", "Tree Count", ["Tree"]),
    ("array-count", "Array Count", ["Array"]),
]
PROBLEMS = [{
    "id": str(index), "slug": slug, "title": title, "difficulty": "Medium", "topics": topics,
    "leetcode_id": index + 1,
    "description_html": "<p>Return the sum of two integers.</p><pre>Input: left = 2, right = 3\nOutput: 5</pre>",
    "starter_code": {"python3": "class Solution:\n    def add(self, left: int, right: int):\n        pass", "java": "class Solution {}"},
    "example_testcases": "2\n3\n",
} for index, (slug, title, topics) in enumerate(CATALOG)]


class Store:
    def __init__(self):
        self.lock = RLock()
        self.tables = {"user_assessments": [], "problems": deepcopy(PROBLEMS), "interview_sessions": [], "code_snapshots": [], "session_events": []}

    def table(self, name):
        if name not in self.tables:
            raise AssertionError(f"Unexpected isolated table: {name}")
        return Query(self, name)


class Query:
    def __init__(self, store, table):
        self.store, self.name = store, table
        self.filters, self.sorts = [], []
        self.bounds, self.maximum = None, None
        self.action, self.payload, self.conflict = None, None, None

    def select(self, _columns):
        return self

    def eq(self, key, value):
        self.filters.append((key, value))
        return self

    def order(self, key, desc=False):
        self.sorts.append((key, desc))
        return self

    def range(self, start, end):
        self.bounds = (start, end)
        return self

    def limit(self, count):
        self.maximum = count
        return self

    def upsert(self, row, on_conflict):
        self.action, self.payload, self.conflict = "upsert", row, on_conflict
        return self

    def insert(self, row):
        self.action, self.payload = "insert", row
        return self

    def update(self, row):
        self.action, self.payload = "update", row
        return self

    def execute(self):
        with self.store.lock:
            table = self.store.tables[self.name]
            rows = [row for row in table if all(row.get(key) == value for key, value in self.filters)]
            if self.action in ("insert", "upsert"):
                row = next((row for row in table if row.get(self.conflict) == self.payload.get(self.conflict)), None) if self.conflict else None
                if row is None:
                    now = datetime.now(timezone.utc).isoformat()
                    row = {"id": str(uuid4()), "created_at": now, "started_at": now, "ended_at": None}
                    table.append(row)
                row.update(deepcopy(self.payload))
                rows = [row]
            elif self.action == "update":
                for row in rows:
                    row.update(deepcopy(self.payload))
            for key, reverse in reversed(self.sorts):
                rows.sort(key=lambda row: row.get(key) or "", reverse=reverse)
            if self.bounds:
                start, end = self.bounds
                rows = rows[start:end + 1]
            if self.maximum is not None:
                rows = rows[:self.maximum]
            return SimpleNamespace(data=deepcopy(rows))


store = Store()
assessment.supabase = store
sessions.supabase = store
app.dependency_overrides[get_current_user] = lambda: {"sub": USER, "email": "isolated@example.test"}


def lookup(slug):
    return deepcopy(next((row for row in PROBLEMS if row["slug"] == slug), None))


sessions.get_problem = lookup
problems.get_problem = lookup
problems.get_problem_list = lambda *_args: deepcopy(PROBLEMS)
execution.load_problem = lookup


async def unavailable_executor(*_args, **_kwargs):
    # Never execute browser input on the host or contact a real execution service.
    raise service.PistonServiceError("Isolated test: external code execution is disabled")


service.execute_on_piston = unavailable_executor
execution.execute_on_piston = unavailable_executor


@app.get("/__part5/state")
def state():
    with store.lock:
        return deepcopy(store.tables)


@app.get("/__part5/profile")
def profile():
    return {"user": {"id": USER, "email": "isolated@example.test"}, "profile": {
        "id": USER, "display_name": "Isolated Part 5", "preferred_language": "Python",
        "starting_difficulty": "Medium", "assessment_completed": False, "weekly_interview_goal": 3,
    }}


# Voice is intentionally not invoked by this test; block it if a test clicks it.
from voice import router as voice  # noqa: E402


def unavailable_voice():
    raise HTTPException(503, "Voice is disabled in the isolated test")


voice.get_elevenlabs = unavailable_voice
