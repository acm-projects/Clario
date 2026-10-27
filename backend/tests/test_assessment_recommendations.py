from copy import deepcopy
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from auth import get_current_user
from main import app
from routers import assessment


USER = "recommendation-test-user"
ANSWERS = {
    "experience": "intermediate", "timeline": "later", "language": "python3",
    "struggle_topics": ["Hash Table"], "confident_topics": ["Array"], "companies": [],
}


class Database:
    def __init__(self, tables):
        self.tables = tables

    def table(self, name):
        assert name in self.tables
        return Query(self.tables[name])


class Query:
    def __init__(self, rows):
        self.rows = deepcopy(rows)

    def select(self, columns):
        return self

    def eq(self, key, value):
        self.rows = [row for row in self.rows if row.get(key) == value]
        return self

    def limit(self, count):
        self.rows = self.rows[:count]
        return self

    def order(self, key):
        self.rows.sort(key=lambda row: row.get(key, ""))
        return self

    def range(self, start, end):
        self.bounds = (start, end)
        return self

    def execute(self):
        start, end = getattr(self, "bounds", (0, len(self.rows)))
        return SimpleNamespace(data=deepcopy(self.rows[start:end + 1]))


@pytest.fixture
def setup(monkeypatch):
    tables = {
        "user_assessments": [{"user_id": USER, "answers": ANSWERS}],
        "problems": [
            {"id": str(i), "slug": f"problem-{i}", "title": f"Problem {i}",
             "difficulty": difficulty, "topics": topics}
            for i, (difficulty, topics) in enumerate(
                [("Medium", ["Hash Table"])] * 7
                + [("medium", ["Array"]), ("Easy", None), ("Hard", '["String"]')]
            )
        ],
        "interview_sessions": [
            {"id": "a", "user_id": USER, "status": "completed", "problem_slug": "problem-0"},
            {"id": "b", "user_id": USER, "status": "completed", "problem_id": "1"},
            {"id": "c", "user_id": "other", "status": "completed", "problem_slug": "problem-2"},
            {"id": "d", "user_id": USER, "status": "in_progress", "problem_slug": "problem-3"},
        ],
    }
    monkeypatch.setattr(assessment, "supabase", Database(tables))
    previous = app.dependency_overrides.copy()
    app.dependency_overrides[get_current_user] = lambda: {"sub": USER}
    with TestClient(app) as client:
        yield client, tables
    app.dependency_overrides.clear()
    app.dependency_overrides.update(previous)


def test_saved_assessment_limit_exclusion_and_reasons(setup):
    client, tables = setup
    tables["problems"].append(deepcopy(tables["problems"][2]))
    response = client.get("/api/recommendations?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["has_assessment"] is True
    problems = data["problems"]
    assert len(problems) == len({p["slug"] for p in problems}) == 5
    assert all(p["difficulty"] == "Medium" and p["reason"] for p in problems)
    assert {p["slug"] for p in problems} == {f"problem-{i}" for i in range(2, 7)}
    assert all("Hash Table" in p["reason"] for p in problems)


def test_scoring_and_conflicting_topics():
    answers = assessment.AssessmentAnswers(**ANSWERS)
    assert assessment.score_problem({"topics": ["Hash Table", "Hash Table"]}, answers) == 3
    assert assessment.score_problem({"topics": ["Array"]}, answers) == -2
    assert assessment.score_problem({"topics": ["String"]}, answers) == 0
    answers.confident_topics.append("Hash Table")
    assert assessment.score_problem({"topics": ["Hash Table", "Array"]}, answers) == 1


@pytest.mark.parametrize("experience,expected,urgent", [
    ("beginner", {"Easy"}, {"Easy", "Medium"}),
    ("intermediate", {"Medium"}, {"Medium", "Hard"}),
    ("advanced", {"Medium", "Hard"}, {"Easy", "Medium", "Hard"}),
])
def test_difficulty_rules(experience, expected, urgent):
    problems = [{"difficulty": d} for d in ("Easy", "Medium", "Hard", "Unknown")]
    answers = assessment.AssessmentAnswers(**{**ANSWERS, "experience": experience})
    assert {p["difficulty"] for p in assessment.filter_by_difficulty(problems, answers)} == expected
    answers.timeline = "this_month"
    assert {p["difficulty"] for p in assessment.filter_by_difficulty(problems, answers)} == urgent


def test_ties_shuffle_across_requests(setup):
    client, _ = setup
    orders = {tuple(p["slug"] for p in client.get("/api/recommendations").json()["problems"]) for _ in range(20)}
    assert len(orders) > 1


def test_shuffle_preserves_scores_and_input():
    scored = [(1, {"slug": "a"}), (3, {"slug": "b"}), (1, {"slug": "c"})]
    original = deepcopy(scored)
    assert assessment.shuffle_ties(scored)[0]["slug"] == "b"
    assert scored == original


def test_missing_assessment_fallback_and_fewer_available(setup):
    client, tables = setup
    tables["user_assessments"] = [{"user_id": "other", "answers": ANSWERS}]
    data = client.get("/api/recommendations?limit=20").json()
    assert data["has_assessment"] is False
    assert len(data["problems"]) == 7
    assert {p["difficulty"] for p in data["problems"]} == {"Easy", "Medium"}
    assert all(p["reason"] == "Suggested starting problem." for p in data["problems"])
    assert not {"problem-0", "problem-1", "problem-9"} & {p["slug"] for p in data["problems"]}
    mixed = client.get("/api/recommendations?limit=2").json()["problems"]
    assert {p["difficulty"] for p in mixed} == {"Easy", "Medium"}


@pytest.mark.parametrize("limit", ["0", "21", "-1", "five"])
def test_invalid_limits(setup, limit):
    client, _ = setup
    assert client.get(f"/api/recommendations?limit={limit}").status_code == 422


def test_empty_catalog_and_unsupported_assessment(setup):
    client, tables = setup
    tables["problems"] = []
    assert client.get("/api/recommendations").json() == {"has_assessment": True, "problems": []}
    tables["user_assessments"][0]["answers"] = {"leetcode": True, "coding": True}
    assert client.get("/api/recommendations").status_code == 409


def test_topics_normalization():
    for value in (None, {}, "invalid", 7):
        assert assessment.normalize_topics(value) == []
    assert assessment.normalize_topics('["Array", "Array", 1, null]') == ["Array"]


def test_pagination():
    rows = [{"id": f"{i:04d}"} for i in range(1100)]
    assert assessment.read_all_rows(Query(rows)) == rows
