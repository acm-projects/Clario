import httpx

BASE_URL = "https://alfa-leetcode-api.onrender.com"
TIMEOUT = 5.0  # seconds, so a slow API can't hang our server

KEEP_LANGS = {"python3", "java"}


def _is_paid(item: dict) -> bool:
    # alfa-leetcode-api has used both "paidOnly" and "isPaidOnly" across versions
    return bool(item.get("paidOnly") or item.get("isPaidOnly"))


def get_problem_list(difficulty: str | None = None, topic: str | None = None, search: str | None = None) -> list[dict]:
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


def get_problem(slug: str) -> dict | None:
    response = httpx.get(f"{BASE_URL}/select", params={"titleSlug": slug}, timeout=TIMEOUT)
    response.raise_for_status()
    item = response.json()

    # alfa-leetcode-api returns an error/empty object for a slug that doesn't exist
    if not item or item.get("error") or not item.get("titleSlug"):
        return None

    if _is_paid(item):
        return None

    topics = [t.get("name") for t in item.get("topicTags", []) if t.get("name")]

    starter_code = {}
    for snippet in item.get("codeSnippets", []):
        lang_slug = snippet.get("langSlug", "").lower()
        if lang_slug in KEEP_LANGS:
            starter_code[lang_slug] = snippet.get("code", "")

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