from __future__ import annotations

import logging

import httpx

from config import settings

logger = logging.getLogger(__name__)

BASE_URL = settings.leetcode_api_url
TIMEOUT = 5.0  # seconds, so a slow API can't hang our server

KEEP_LANGS = {"python3", "java"}


# alfa-leetcode-api's /select doesn't return starter code, so we ask LeetCode's
# own GraphQL endpoint for it. This is an unofficial endpoint: any failure must
# degrade to an empty starter_code, never break the problem response.
GRAPHQL_URL = "https://leetcode.com/graphql"
STARTER_QUERY = """
query starterCode($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    codeSnippets { langSlug code }
  }
}
"""
_starter_cache: dict[str, dict] = {}  # starter code never changes, so cache successes


def _pick_langs(snippets) -> dict:
    out = {}
    for snippet in snippets or []:
        lang = (snippet.get("langSlug") or "").lower()
        if lang in KEEP_LANGS:
            out[lang] = snippet.get("code", "")
    return out


def get_starter_code(slug: str) -> dict:
    if slug in _starter_cache:
        return _starter_cache[slug]
    try:
        response = httpx.post(
            GRAPHQL_URL,
            json={"query": STARTER_QUERY, "variables": {"titleSlug": slug}},
            headers={
                "Content-Type": "application/json",
                "Referer": f"https://leetcode.com/problems/{slug}/",
                "User-Agent": "Mozilla/5.0",
            },
            timeout=TIMEOUT,
        )
        response.raise_for_status()
        question = (response.json().get("data") or {}).get("question") or {}
        code = _pick_langs(question.get("codeSnippets"))
    except (httpx.HTTPError, ValueError) as e:
        logger.warning("Starter code lookup failed for %s: %s", slug, e)
        return {}
    if code:
        _starter_cache[slug] = code
    return code


def _is_paid(item: dict) -> bool:
    # alfa-leetcode-api has used both "paidOnly" and "isPaidOnly" across versions
    return bool(item.get("paidOnly") or item.get("isPaidOnly"))


def fetch_live_problem_list(difficulty: str | None = None, topic: str | None = None, search: str | None = None) -> list[dict]:
    params = {"limit": 200}  # pull a large batch so client-side filtering (e.g. search) has enough to work with

    if difficulty:
        params["difficulty"] = difficulty.upper()
    if topic:
        params["tags"] = topic.lower()

    response = httpx.get(f"{BASE_URL}/problems", params=params, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()

    raw_items = data.get("problemsetQuestionList", data.get("questions", []))

    results = []
    for item in raw_items:
        if _is_paid(item):
            continue

        title = item.get("title") or item.get("questionTitle", "")
        slug = item.get("titleSlug", "")

        if search and search.lower() not in title.lower() and search.lower() not in slug.lower():
            continue

        topics = [t.get("name") for t in item.get("topicTags", []) if t.get("name")]

        results.append({
            "slug": slug,
            "leetcode_id": item.get("frontendQuestionId") or item.get("questionFrontendId", ""),
            "title": title,
            "difficulty": item.get("difficulty", ""),
            "topics": topics,
        })

    return results


def fetch_live_problem(slug: str) -> dict | None:
    response = httpx.get(f"{BASE_URL}/select", params={"titleSlug": slug}, timeout=TIMEOUT)
    response.raise_for_status()
    item = response.json()

    # alfa-leetcode-api returns an error/empty object for a slug that doesn't exist
    if not item or item.get("error") or not item.get("titleSlug"):
        return None

    if _is_paid(item):
        return None

    topics = [t.get("name") for t in item.get("topicTags", []) if t.get("name")]

    starter_code = _pick_langs(item.get("codeSnippets"))
    if not starter_code:
        starter_code = get_starter_code(slug)

    return {
        "slug": item.get("titleSlug", slug),
        "leetcode_id": item.get("questionFrontendId") or item.get("questionId", ""),
        "title": item.get("questionTitle") or item.get("title", ""),
        "difficulty": item.get("difficulty", ""),
        "topics": topics,
        "description_html": item.get("question") or item.get("content", ""),
        "example_testcases": item.get("exampleTestcases", ""),
        "starter_code": starter_code,
    }


# ---------------------------------------------------------------------------
# Supabase fallback: try the live API first, read the saved copy if it fails.
# A problem that simply doesn't exist (live returns None) is NOT a failure and
# does not fall back.
# ---------------------------------------------------------------------------
def _norm(text) -> str:
    return (text or "").strip().lower().replace("-", " ")


def _sort_key(row: dict) -> int:
    lid = str(row.get("leetcode_id") or "")
    return int(lid) if lid.isdigit() else 10**9


def _db_problem_list(difficulty, topic, search):
    """Saved problems, filtered like the live list. None means no usable fallback data."""
    try:
        from db import supabase
        rows = (
            supabase.table("problems")
            .select("slug, leetcode_id, title, difficulty, topics")
            .execute()
            .data
        )
    except Exception as e:
        logger.warning("Supabase fallback list failed: %s", e)
        return None
    rows = [r for r in rows if r.get("slug")]
    if not rows:
        return None

    out = []
    for r in rows:
        topics = r.get("topics") or []
        if difficulty and _norm(r.get("difficulty")) != _norm(difficulty):
            continue
        if topic and _norm(topic) not in {_norm(t) for t in topics}:
            continue
        if search and _norm(search) not in _norm(r.get("title")) and _norm(search) not in _norm(r["slug"]):
            continue
        out.append({
            "slug": r["slug"],
            "leetcode_id": r.get("leetcode_id") or "",
            "title": r.get("title") or "",
            "difficulty": r.get("difficulty") or "",
            "topics": topics,
        })
    return sorted(out, key=_sort_key)


def _db_problem(slug: str):
    try:
        from db import supabase
        rows = (
            supabase.table("problems")
            .select("slug, leetcode_id, title, difficulty, topics, description_html, example_testcases, starter_code")
            .eq("slug", slug)
            .execute()
            .data
        )
    except Exception as e:
        logger.warning("Supabase fallback lookup failed for %s: %s", slug, e)
        return None
    if not rows:
        return None
    r = rows[0]
    starter = r.get("starter_code")
    return {
        "slug": r["slug"],
        "leetcode_id": r.get("leetcode_id") or "",
        "title": r.get("title") or "",
        "difficulty": r.get("difficulty") or "",
        "topics": r.get("topics") or [],
        "description_html": r.get("description_html") or "",
        "example_testcases": r.get("example_testcases") or "",
        "starter_code": starter if isinstance(starter, dict) else {},
    }


def _save_problem(problem: dict) -> bool:
    """Cache full live details; a cache failure must not interrupt browsing."""
    try:
        from db import supabase
        if not all(problem.get(key) for key in ("slug", "title", "difficulty", "description_html")):
            logger.warning("Skipping incomplete live problem cache entry")
            return False
        # A failed optional GraphQL lookup must not erase saved starter code.
        starter = problem.get("starter_code") or {}
        previous = _db_problem(problem["slug"]) if not all(starter.get(lang) for lang in KEEP_LANGS) or not problem.get("example_testcases") else None
        starter = {**((previous or {}).get("starter_code") or {}), **{lang: code for lang, code in starter.items() if code}}
        row = {
            "slug": problem["slug"],
            "leetcode_id": problem.get("leetcode_id") or (previous or {}).get("leetcode_id") or "",
            "title": problem["title"],
            "difficulty": problem["difficulty"],
            "topics": problem.get("topics") or (previous or {}).get("topics") or [],
            "description_html": problem["description_html"],
            "description": problem["description_html"],
            "example_testcases": problem.get("example_testcases") or (previous or {}).get("example_testcases") or "",
            "starter_code": starter,
        }
        supabase.table("problems").upsert(row, on_conflict="slug").execute()
        logger.info("Saved live problem %s to Supabase", problem["slug"])
        return True
    except Exception:
        logger.warning("Could not cache live problem %s; returning live data", problem.get("slug"), exc_info=True)
        return False


def get_problem_list(difficulty=None, topic=None, search=None) -> list[dict]:
    try:
        result = fetch_live_problem_list(difficulty, topic, search)
        logger.info("problem list served from live API")
        return result
    except (httpx.HTTPError, ValueError) as e:
        logger.warning("Live problem list failed (%s); trying Supabase fallback", e)
        rows = _db_problem_list(difficulty, topic, search)
        if rows is None:
            raise httpx.HTTPError("Live API failed and no Supabase fallback is available") from e
        logger.info("problem list served from Supabase fallback")
        return rows


def get_problem(slug: str) -> dict | None:
    try:
        problem = fetch_live_problem(slug)
        if problem is not None:
            _save_problem(problem)
        logger.info("problem %s served from live API", slug)
        return problem
    except (httpx.HTTPError, ValueError) as e:
        logger.warning("Live problem %s failed (%s); trying Supabase fallback", slug, e)
        row = _db_problem(slug)
        if row is None:
            raise httpx.HTTPError("Live API failed and no Supabase fallback is available") from e
        logger.info("problem %s served from Supabase fallback", slug)
        return row