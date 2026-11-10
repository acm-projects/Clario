from concurrent.futures import ThreadPoolExecutor
from threading import Event
from unittest.mock import Mock

import httpx
import pytest

import leetcode
import response_cache
from response_cache import cache_for


def test_cache_expires_and_returns_independent_data(monkeypatch):
    clock = [10]
    monkeypatch.setattr(response_cache, "monotonic", lambda: clock[0])
    source = Mock(side_effect=lambda: {"topics": ["Array"]})
    cached = cache_for(30)(source)
    cached()["topics"].append("modified by caller")
    assert cached() == {"topics": ["Array"]}
    assert source.call_count == 1
    clock[0] += 31
    cached()
    assert source.call_count == 2


def test_cache_retries_failed_requests():
    source = Mock(side_effect=[RuntimeError("offline"), ["recovered"]])
    cached = cache_for(30)(source)
    with pytest.raises(RuntimeError): cached()
    assert cached() == ["recovered"]


def test_concurrent_duplicate_requests_only_call_provider_once():
    entered, release = Event(), Event()
    def provider():
        entered.set()
        assert release.wait(3)
        return ["one request"]
    source = Mock(side_effect=provider)
    cached = cache_for(30)(source)
    with ThreadPoolExecutor(max_workers=2) as pool:
        first = pool.submit(cached)
        assert entered.wait(3)
        second = pool.submit(cached)
        release.set()
        assert first.result() == second.result() == ["one request"]
    assert source.call_count == 1


def test_rate_limited_problem_api_is_not_retried_for_each_page(monkeypatch):
    clock = [10]
    monkeypatch.setattr(leetcode, "monotonic", lambda: clock[0])
    monkeypatch.setattr(leetcode, "_live_retry_at", 0)
    request = httpx.Request("GET", "https://example.test/problems")
    limited = httpx.Response(429, request=request)
    get = Mock(return_value=limited)
    monkeypatch.setattr(leetcode.httpx, "get", get)
    with pytest.raises(httpx.HTTPError): leetcode._live_get("problems")
    with pytest.raises(httpx.HTTPError): leetcode._live_get("select")
    assert get.call_count == 1
    clock[0] += 61
    with pytest.raises(httpx.HTTPError): leetcode._live_get("problems")
    assert get.call_count == 2
