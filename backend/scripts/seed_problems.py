"""Save 20 problems into Supabase so the fallback has something to serve.

Run from backend/ (the folder containing main.py):
    python -m scripts.seed_problems

Safe to run more than once: rows are upserted by slug, so nothing is duplicated.
It uses the LIVE-only fetch, so it can never "re-save" fallback data by mistake.
"""
import time

from db import supabase
from leetcode import fetch_live_problem

DELAY_SECONDS = 1.0

# The 8 problems underneath the Company-Specific scenarios, plus 12 common
# array / string problems.
SLUGS = [
    "two-sum", "best-time-to-buy-and-sell-stock", "top-k-frequent-elements",
    "longest-consecutive-sequence", "longest-substring-without-repeating-characters",
    "kth-largest-element-in-an-array", "minimum-size-subarray-sum", "subarray-sum-equals-k",
    "valid-anagram", "contains-duplicate", "valid-parentheses", "group-anagrams",
    "product-of-array-except-self", "3sum", "container-with-most-water", "valid-palindrome",
    "maximum-subarray", "merge-intervals", "binary-search", "move-zeroes",
]


def main():
    saved, failed, no_starter = 0, [], []
    for i, slug in enumerate(SLUGS):
        if i:
            time.sleep(DELAY_SECONDS)
        try:
            p = fetch_live_problem(slug)
        except Exception as e:
            failed.append((slug, str(e)))
            print(f"FAILED  {slug}: {e}")
            continue
        if p is None:
            failed.append((slug, "not found or paid-only"))
            print(f"SKIPPED {slug}: not found or paid-only")
            continue

        row = {
            "slug": p["slug"],
            "leetcode_id": p["leetcode_id"],
            "title": p["title"],
            "difficulty": p["difficulty"],
            "topics": p["topics"],
            "description_html": p["description_html"],
            # the older NOT NULL description column gets the same HTML
            "description": p["description_html"],
            "example_testcases": p["example_testcases"],
            "starter_code": p["starter_code"],
        }
        try:
            supabase.table("problems").upsert(row, on_conflict="slug").execute()
        except Exception as e:
            failed.append((slug, str(e)))
            print(f"FAILED  {slug} (database): {e}")
            continue
        saved += 1
        if not p["starter_code"]:
            no_starter.append(slug)
        print(f"saved   {slug} (starter code: {', '.join(sorted(p['starter_code'])) or 'NONE'})")

    print(f"\n{saved}/{len(SLUGS)} saved.")
    if no_starter:
        print("Saved without starter code (GraphQL lookup failed):", ", ".join(no_starter))
    if failed:
        print("Not saved (just run the script again, it is safe to repeat):")
        for slug, why in failed:
            print(f"  {slug}: {why}")


if __name__ == "__main__":
    main()