from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from voice import router
from services import repo_challenge_service


@pytest.fixture
def signed_session(monkeypatch):
    client = Mock()
    client.conversational_ai.conversations.get_signed_url.return_value = SimpleNamespace(signed_url="wss://example.test/session")
    monkeypatch.setattr(router, "get_elevenlabs", lambda: client)
    monkeypatch.setattr(router, "require_setting", lambda *args: "test-agent")
    return client


def assert_required_variables(session):
    assert session["signed_url"] == "wss://example.test/session"
    assert all(isinstance(session["variables"][key], str) and session["variables"][key].strip()
               for key in ("problem_title", "problem_description", "repo_name", "bug_summary"))


def test_coding_greeting_has_required_agent_variables(signed_session, monkeypatch):
    monkeypatch.setattr(router, "get_problem", lambda slug: {"slug": slug, "title": "Two Sum", "description_html": "<p>Find two indices &amp; return them.</p>"})
    session = router.get_session("two-sum", user={"sub": "owner"})
    assert_required_variables(session)
    assert session["variables"]["repo_name"] == "Two Sum"
    assert session["variables"]["bug_summary"] == "Find two indices & return them."


def test_repository_greeting_uses_public_bug_report_not_source_files(signed_session):
    challenge = repo_challenge_service.detail("shopping-cart-01")
    session = router.get_repo_session("shopping-cart-01", user={"sub": "owner"})
    assert_required_variables(session)
    assert session["variables"]["repo_name"] == challenge["title"]
    assert session["variables"]["bug_summary"] == challenge["description"]
    assert "File:" not in session["variables"]["bug_summary"]


def test_design_greeting_does_not_include_private_criteria(signed_session):
    scenario = router.system_design_scenario("bumble-matching")
    session = router.get_system_design_session("bumble-matching", user={"sub": "owner"})
    assert_required_variables(session)
    assert session["variables"]["repo_name"] == f'{scenario["company"]}: {scenario["title"]}'
    assert session["variables"]["bug_summary"] == scenario["prompt"]
    assert "Private evaluation criteria" not in session["variables"]["bug_summary"]
