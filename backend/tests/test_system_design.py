from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from fastapi import HTTPException
from voice import router


def test_scenario_and_invalid_slug():
    scenario = router.get_system_design_scenario("bumble-matching", user={"id": "test"})
    assert scenario["company"] == "Bumble"
    assert scenario["difficulty"] == "medium"
    assert "key_points" not in scenario
    assert "follow_ups" not in scenario
    with pytest.raises(HTTPException) as error:
        router.system_design_scenario("../bumble-matching")
    assert error.value.status_code == 404


def test_voice_receives_company_context_without_coding(monkeypatch):
    client = Mock()
    client.conversational_ai.conversations.get_signed_url.return_value = SimpleNamespace(signed_url="https://example.test/signed")
    monkeypatch.setattr(router, "get_elevenlabs", lambda: client)
    monkeypatch.setattr(router, "require_setting", lambda *args: "test-agent")
    session = router.get_system_design_session("bumble-matching", user={"id": "test"})
    assert session["signed_url"] == "https://example.test/signed"
    assert "Bumble" in session["variables"]["problem_title"]
    assert "Do not ask the candidate to write or run code" in session["variables"]["problem_description"]
    assert "geohashing" in session["variables"]["problem_description"]


def test_voice_service_failure(monkeypatch):
    client = Mock()
    client.conversational_ai.conversations.get_signed_url.side_effect = RuntimeError("private service error")
    monkeypatch.setattr(router, "get_elevenlabs", lambda: client)
    monkeypatch.setattr(router, "require_setting", lambda *args: "test-agent")
    with pytest.raises(HTTPException) as error:
        router.get_system_design_session("bumble-matching", user={"id": "test"})
    assert error.value.status_code == 502
    assert "private service error" not in error.value.detail
