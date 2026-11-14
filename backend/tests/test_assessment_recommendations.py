from copy import deepcopy
from datetime import date, datetime, timedelta, timezone
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
    monkeypatch.setattr(assessment, "load_additional_problems", lambda: [])
    previous = app.dependency_overrides.copy()
    app.dependency_overrides[get_current_user] = lambda: {"sub": USER}
    with TestClient(app) as client:
        yield client, tables
    app.dependency_overrides.clear()
    app.dependency_overrides.update(previous)


def test_saved_assessment_limit_exclusion_and_reasons(setup):
    client, tables = setup
    tables["problems"].append(deepcopy(tables["problems"][2]))
    response = client.get("/api/recommendations?limit=20")
    assert response.status_code == 200
    data = response.json()
    assert data["has_assessment"] is True
    problems = data["problems"]
    assert len(problems) == len({p["slug"] for p in problems}) == 7
    assert {p["slug"] for p in problems[:5]} == {f"problem-{i}" for i in range(2, 7)}
    assert all("Hash Table" in p["reason"] for p in problems[:5])
    assert data["target_count"] == 20
    assert data["shortfall_message"]


def test_scoring_and_conflicting_topics():
    answers = assessment.AssessmentAnswers(**ANSWERS)
    assert assessment.score_problem({"topics": ["Hash Table", "Hash Table"]}, answers) == 3
    assert assessment.score_problem({"topics": ["Array"]}, answers) == -2
    assert assessment.score_problem({"topics": ["String"]}, answers) == 0
    answers.confident_topics.append("Hash Table")
    assert assessment.score_problem({"topics": ["Hash Table", "Array"]}, answers) == 1


@pytest.mark.parametrize("experience,expected,urgent", [
    ("beginner", {"Easy"}, {"Easy", "Medium"}),
    ("intermediate", {"Easy", "Medium"}, {"Medium", "Hard"}),
    ("advanced", {"Medium"}, {"Medium", "Hard"}),
])
def test_difficulty_rules(experience, expected, urgent):
    problems = [{"difficulty": d} for d in ("Easy", "Medium", "Hard", "Unknown")]
    answers = assessment.AssessmentAnswers(**{**ANSWERS, "experience": experience})
    assert {p["difficulty"] for p in assessment.filter_by_difficulty(problems, answers)} == expected
    answers.interview_date = (assessment.today_chicago() + timedelta(days=21)).isoformat()
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
    data = client.get("/api/recommendations?limit=25").json()
    assert data["has_assessment"] is False
    assert len(data["problems"]) == 7
    assert {p["difficulty"] for p in data["problems"]} == {"Easy", "Medium"}
    assert all(p["reason"] == "Suggested starting problem." for p in data["problems"])
    assert not {"problem-0", "problem-1", "problem-9"} & {p["slug"] for p in data["problems"]}
    mixed = client.get("/api/recommendations?limit=20").json()["problems"]
    assert {p["difficulty"] for p in mixed} == {"Easy", "Medium"}


@pytest.mark.parametrize("limit", ["0", "5", "10", "15", "19", "26", "-1", "five"])
def test_invalid_limits(setup, limit):
    client, _ = setup
    assert client.get(f"/api/recommendations?limit={limit}").status_code == 422


def test_empty_catalog_and_unsupported_assessment(setup):
    client, tables = setup
    tables["problems"] = []
    empty = client.get("/api/recommendations").json()
    assert empty["has_assessment"] is True
    assert empty["problems"] == []
    assert empty["eligible_count"] == 0
    assert "Only 0" in empty["shortfall_message"]
    tables["user_assessments"][0]["answers"] = {"leetcode": True, "coding": True}
    assert client.get("/api/recommendations").status_code == 409


def test_topics_normalization():
    for value in (None, {}, "invalid", 7):
        assert assessment.normalize_topics(value) == []
    assert assessment.normalize_topics('["Array", "Array", 1, null]') == ["Array"]


def test_pagination():
    rows = [{"id": f"{i:04d}"} for i in range(1100)]
    assert assessment.read_all_rows(Query(rows)) == rows


def test_custom_assessment_round_trip_without_timeline(setup, monkeypatch):
    client, tables = setup
    class WritableDatabase(Database):
        def table(self, name):
            query = super().table(name)
            if name == "user_assessments":
                def upsert(row, on_conflict):
                    assert on_conflict == "user_id"
                    tables[name][:] = [deepcopy(row)]
                    return Query(tables[name])
                query.upsert = upsert
            return query
    monkeypatch.setattr(assessment, "supabase", WritableDatabase(tables))
    body = {key: value for key, value in ANSWERS.items() if key != "timeline"}
    body.update(preferred_language="C++", other_language_used="Go", language_comfort={"python":8,"java":5,"go":6,"c++":7}, interview_date=assessment.today_chicago().isoformat())
    response = client.post("/api/assessment", json=body)
    assert response.status_code == 200
    saved = client.get("/api/assessment/me").json()["answers"]
    assert saved["preferred_language"] == "C++"
    assert saved["other_language_used"] == "Go"
    assert saved["language_comfort"] == {"python":8,"java":5,"go":6,"c++":7}
    assert saved["language"] == "python3"
    assert saved["timeline"] is None
    recommendations = client.get("/api/recommendations").json()
    assert recommendations["has_assessment"] is True
    assert len(recommendations["problems"]) == 8
    for rating in [0, 11, 1.5]:
        assert client.post("/api/assessment", json={**body, "language_comfort": {**body["language_comfort"], "java":rating}}).status_code == 422
    assert client.post("/api/assessment", json={**body, "language": "cpp"}).status_code == 422


@pytest.mark.parametrize("experience,normal,close", [
    ("beginner", {"Easy"}, {"Easy","Medium"}),
    ("intermediate", {"Easy","Medium"}, {"Medium","Hard"}),
    ("advanced", {"Medium"}, {"Medium","Hard"}),
])
def test_calendar_boundaries(experience, normal, close, monkeypatch):
    today = date(2026, 11, 2)
    monkeypatch.setattr(assessment, "today_chicago", lambda: today)
    problems = [{"difficulty":d} for d in ("Easy","Medium","Hard")]
    for days in [-1,0,7,14,21,22,30]:
        answers = assessment.AssessmentAnswers(**{**ANSWERS, "experience":experience, "interview_date":(today+timedelta(days=days)).isoformat()})
        actual = {p["difficulty"] for p in assessment.filter_by_difficulty(problems, answers)}
        assert actual == (close if 0 <= days <= 21 else normal)


def test_recommendations_update_as_calendar_advances(setup, monkeypatch):
    client, tables = setup
    tables["user_assessments"][0]["answers"] = {**ANSWERS,"interview_date":"2026-11-24"}
    tables["problems"] = catalog(["Easy"] * 16 + ["Medium"] * 16 + ["Hard"] * 16)
    # Date proximity must affect the highest-ranked first choice, even with a full pool.
    for row in tables["problems"]:
        row["topics"] = ["Hash Table"]
    monkeypatch.setattr(assessment, "today_chicago", lambda: date(2026,11,2))
    normal = client.get("/api/recommendations?limit=25").json()["problems"]
    assert "Hard" not in {p["difficulty"] for p in normal}
    monkeypatch.setattr(assessment, "today_chicago", lambda: date(2026,11,3))
    close = client.get("/api/recommendations?limit=25").json()["problems"]
    assert "Easy" not in {p["difficulty"] for p in close}
    assert len(close) == 25
    assert not {"problem-0","problem-1"} & {p["slug"] for p in close}
    assert close[0]["topics"] == ["Hash Table"]


def test_submission_requires_date_and_each_language_rating(setup):
    client, _ = setup
    body = {**ANSWERS,"preferred_language":"Go", "language_comfort":{"python":8,"java":5,"go":6}, "interview_date":assessment.today_chicago().isoformat()}
    for value in [None,"", "2000-01-01", "2027-02-30", "20261102", "2026-1-2"]:
        assert client.post("/api/assessment",json={**body,"interview_date":value}).status_code == 422
    for ratings in [{"python":8}, {"python":8,"java":5}, 6, None]:
        assert client.post("/api/assessment",json={**body,"language_comfort":ratings}).status_code == 422


def test_legacy_integer_rating_and_missing_date_load():
    saved = assessment.AssessmentAnswers(**{**ANSWERS,"language_comfort":6})
    assert saved.language_comfort == 6
    assert saved.interview_date is None
    assert not assessment.interview_is_close(saved)


@pytest.mark.parametrize("instant,expected", [
    (datetime(2026,11,3,0,30,tzinfo=timezone.utc), date(2026,11,2)),
    (datetime(2026,11,1,5,30,tzinfo=timezone.utc), date(2026,11,1)),
    (datetime(2026,11,1,8,30,tzinfo=timezone.utc), date(2026,11,1)),
])
def test_calendar_uses_chicago_across_utc_midnight_and_dst(instant, expected, monkeypatch):
    class Clock:
        @staticmethod
        def now(tz):
            return instant.astimezone(tz)
    monkeypatch.setattr(assessment,"datetime",Clock)
    assert assessment.today_chicago() == expected


def catalog(difficulties, topics=None):
    return [{"id":f"catalog-{i}", "slug":f"candidate-{i}", "title":f"Candidate {i}", "difficulty":difficulty, "topics":topics or ["Hash Table"]}
            for i,difficulty in enumerate(difficulties)]


@pytest.mark.parametrize("available", [19,20,21,22,23,24,25,40])
def test_default_targets_twenty_five_and_returns_available_unique_problems(setup, available):
    client, tables = setup
    tables["problems"] = catalog(["Medium"] * available)
    response = client.get("/api/recommendations")
    assert response.status_code == 200
    data = response.json()
    assert data["target_count"] == 25
    assert data["minimum_count"] == 20
    assert len(data["problems"]) == min(available,25)
    assert data["eligible_count"] == available
    assert bool(data["shortfall_message"]) == (available < 20)


@pytest.mark.parametrize("limit", [20,22,25])
def test_explicit_limits_stay_between_twenty_and_twenty_five(setup, limit):
    client, tables = setup
    tables["problems"] = catalog(["Medium"] * 30)
    assert len(client.get(f"/api/recommendations?limit={limit}").json()["problems"]) == limit


@pytest.mark.parametrize("experience,primary,adjacent", [
    ("beginner","Easy","Medium"), ("advanced","Medium","Hard"),
])
def test_adjacent_difficulty_fills_short_pool_without_displacing_primary(setup, experience, primary, adjacent):
    client, tables = setup
    tables["user_assessments"][0]["answers"] = {**ANSWERS,"experience":experience}
    tables["problems"] = catalog([primary] * 6 + [adjacent] * 20)
    data = client.get("/api/recommendations").json()
    assert len(data["problems"]) == 25
    assert all(p["difficulty"] == primary for p in data["problems"][:6])
    assert all(p["difficulty"] == adjacent for p in data["problems"][6:])
    assert all(p["reason"] for p in data["problems"])


def test_urgent_intermediate_can_add_easy_practice_when_main_pool_short(setup):
    client, tables = setup
    tables["user_assessments"][0]["answers"] = {**ANSWERS,"interview_date":assessment.today_chicago().isoformat()}
    tables["problems"] = catalog(["Medium"] * 4 + ["Hard"] * 3 + ["Easy"] * 20)
    data = client.get("/api/recommendations").json()
    assert len(data["problems"]) == 25
    assert {p["difficulty"] for p in data["problems"][:7]} == {"Medium","Hard"}
    assert all(p["difficulty"] == "Easy" for p in data["problems"][7:])


def test_beginner_shortfall_never_fills_with_hard_and_explains_why(setup):
    client, tables = setup
    tables["user_assessments"][0]["answers"] = {**ANSWERS,"experience":"beginner"}
    tables["problems"] = catalog(["Easy"] * 3 + ["Medium"] * 4 + ["Hard"] * 30)
    data = client.get("/api/recommendations").json()
    assert len(data["problems"]) == data["eligible_count"] == 7
    assert "Hard" not in {p["difficulty"] for p in data["problems"]}
    assert "Only 7" in data["shortfall_message"]
    assert "completed problems and unsuitable difficulty" in data["shortfall_message"]


def test_duplicates_and_completed_problems_do_not_reduce_a_full_list(setup):
    client, tables = setup
    tables["problems"] = catalog(["Medium"] * 32)
    tables["problems"].extend(deepcopy(tables["problems"][:7]))
    tables["interview_sessions"] = [
        {"id":"a","user_id":USER,"status":"completed","problem_slug":"candidate-0"},
        {"id":"b","user_id":USER,"status":"completed","problem_id":"catalog-1"},
    ]
    data = client.get("/api/recommendations").json()
    slugs = [p["slug"] for p in data["problems"]]
    assert len(slugs) == len(set(slugs)) == 25
    assert not {"candidate-0","candidate-1"} & set(slugs)
    assert data["eligible_count"] == 30


def test_direct_then_related_topics_rank_above_unrelated_at_same_difficulty(setup):
    client, tables = setup
    tables["user_assessments"][0]["answers"] = {**ANSWERS,"confident_topics":[]}
    tables["problems"] = catalog(["Medium"] * 35, ["Graph"])
    tables["problems"][0]["topics"] = ["Hash Table"]
    tables["problems"][1]["topics"] = ["String"]
    data = client.get("/api/recommendations").json()
    assert len(data["problems"]) == 25
    assert data["problems"][0]["slug"] == "candidate-0"
    assert "struggle" in data["problems"][0]["reason"]
    assert data["problems"][1]["slug"] == "candidate-1"
    assert "related" in data["problems"][1]["reason"]


def test_saved_pool_expands_from_existing_library_source_without_duplicates(setup, monkeypatch):
    client,tables = setup
    tables["user_assessments"][0]["answers"] = {**ANSWERS,"experience":"advanced"}
    tables["problems"] = catalog(["Medium"] * 15 + ["Hard"] * 3)
    extra = [{**row,"slug":f"live-{row['slug']}"} for row in catalog(["Medium"] * 20)]
    # Both sources can contain the same slug; completed slugs stay excluded.
    extra += deepcopy(tables["problems"][:3])
    tables["interview_sessions"] = [{"id":"c","user_id":USER,"status":"completed","problem_slug":"live-candidate-0"}]
    monkeypatch.setattr(assessment,"load_additional_problems",lambda:extra)
    data=client.get("/api/recommendations").json()
    assert len(data["problems"]) == 25
    slugs=[p["slug"] for p in data["problems"]]
    assert len(set(slugs)) == 25
    assert "live-candidate-0" not in slugs
    assert data["shortfall_message"] is None
    assert data["eligible_count"] == 37


def test_no_extra_source_call_when_saved_eligible_pool_is_large_enough(setup, monkeypatch):
    client,tables=setup
    tables["problems"]=catalog(["Medium"]*30)
    def unexpected():
        raise AssertionError("No live lookup needed for a full saved pool")
    monkeypatch.setattr(assessment,"load_additional_problems",unexpected)
    assert len(client.get("/api/recommendations").json()["problems"])==25


def test_pool_expansion_source_failure_returns_existing_pool(monkeypatch):
    def unavailable():
        raise assessment.httpx.ConnectError("offline")
    monkeypatch.setattr(assessment,"get_problem_list",unavailable)
    assert assessment.load_additional_problems()==[]


def test_incomplete_rows_do_not_block_valid_live_versions_or_invent_difficulties():
    seen=set()
    saved=[{"slug":"valid","title":"Valid","difficulty":None}]
    assert assessment.collect_eligible_records(saved,set(),seen)==[]
    live=[{"slug":"valid","title":"Valid","difficulty":" medium ","topics":["Tree"]},
          {"slug":"bad","title":"Bad","difficulty":"Unknown"}]
    assert assessment.collect_eligible_records(live,set(),seen)==[{"slug":"valid","title":"Valid","difficulty":"Medium","topics":["Tree"]}]
