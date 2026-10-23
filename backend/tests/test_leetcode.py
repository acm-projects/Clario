import httpx

import leetcode


def test_get_problem_uses_supabase_when_live_api_fails(monkeypatch):
    expected = {"slug": "two-sum", "starter_code": {"python3": "class Solution:"}}

    def fail(*args, **kwargs):
        raise httpx.ConnectError("offline")

    monkeypatch.setattr(leetcode, "fetch_live_problem", fail)
    monkeypatch.setattr(leetcode, "_db_problem", lambda slug: expected)

    assert leetcode.get_problem("two-sum") == expected


def test_get_problem_returns_live_problem_without_fallback(monkeypatch):
    live = {"slug": "two-sum", "example_testcases": ""}
    monkeypatch.setattr(leetcode, "fetch_live_problem", lambda slug: live)
    fallback_called = False

    def fallback(slug):
        nonlocal fallback_called
        fallback_called = True
        return None

    monkeypatch.setattr(leetcode, "_db_problem", fallback)
    assert leetcode.get_problem("two-sum") == live
    assert not fallback_called
