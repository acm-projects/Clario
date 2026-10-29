import csv
import io
import re

import httpx

BASE_URL = (
    "https://raw.githubusercontent.com/"
    "snehasishroy/leetcode-companywise-interview-questions/"
    "master"
)

PERIODS = [
    "thirty-days.csv",
    "three-months.csv",
    "six-months.csv",
    "more-than-six-months.csv",
]


def get_company_problem_slugs(company: str) -> list[str]:
    """Fetch company-tagged LeetCode slugs from GitHub."""

    company_folder = company.strip().lower().replace(" ", "-")

    if not re.fullmatch(r"[a-z0-9-]+", company_folder):
        raise ValueError("Invalid company name")

    slugs = set()
    successful_files = 0

    with httpx.Client(timeout=15, follow_redirects=True) as client:
        for period in PERIODS:
            url = f"{BASE_URL}/{company_folder}/{period}"

            response = client.get(url)

            if response.status_code == 404:
                continue

            response.raise_for_status()
            successful_files += 1

            reader = csv.DictReader(io.StringIO(response.text))

            for row in reader:
                link = (
                    row.get("URL")
                    or row.get("url")
                    or row.get("Link")
                    or row.get("link")
                )

                if not link:
                    continue

                match = re.search(
                    r"leetcode\.com/problems/([^/?#]+)",
                    link
                )

                if match:
                    slugs.add(match.group(1))

    if successful_files == 0:
        raise ValueError(
            f"No company question files found for {company}"
        )

    return sorted(slugs)


def get_available_companies() -> list[str]:
    """
    Retrieve company folder names from the GitHub repository.

    Excludes repository files and hidden directories.
    """

    api_url = (
        "https://api.github.com/repos/"
        "snehasishroy/leetcode-companywise-interview-questions/"
        "contents"
    )

    with httpx.Client(timeout=15, follow_redirects=True) as client:
        response = client.get(api_url)
        response.raise_for_status()
        items = response.json()

    companies = []

    for item in items:
        if item.get("type") != "dir":
            continue

        folder = item.get("name", "")

        if not re.fullmatch(r"[a-z0-9-]+", folder):
            continue

        companies.append(folder.replace("-", " ").title())

    return sorted(set(companies), key=str.casefold)
