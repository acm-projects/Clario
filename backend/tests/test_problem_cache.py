import unittest
from unittest.mock import MagicMock, patch

import httpx
import leetcode
from db import supabase

PROBLEM = {
    "slug": "two-sum", "leetcode_id": "1", "title": "Two Sum",
    "difficulty": "Easy", "topics": ["Array", "Hash Table"],
    "description_html": "<p>Find two indices.</p>",
    "example_testcases": "[2,7,11,15]\n9",
    "starter_code": {"python3": "class Solution: pass", "java": "class Solution {}"},
}


class ProblemCacheTests(unittest.TestCase):
    def test_successful_live_details_are_upserted_by_slug(self):
        query = MagicMock()
        with patch.object(leetcode, "fetch_live_problem", return_value=PROBLEM), patch.object(supabase, "table", return_value=query):
            self.assertEqual(leetcode.get_problem("two-sum"), PROBLEM)
        row = query.upsert.call_args.args[0]
        self.assertEqual(row["description"], PROBLEM["description_html"])
        self.assertEqual(row["starter_code"], PROBLEM["starter_code"])
        self.assertEqual(row["example_testcases"], PROBLEM["example_testcases"])
        self.assertEqual(query.upsert.call_args.kwargs, {"on_conflict": "slug"})
        query.upsert.return_value.execute.assert_called_once()

    def test_failed_cache_write_still_returns_live_problem(self):
        with patch.object(leetcode, "fetch_live_problem", return_value=PROBLEM), patch.object(supabase, "table", side_effect=RuntimeError("database offline")), self.assertLogs(leetcode.logger, level="WARNING"):
            self.assertEqual(leetcode.get_problem("two-sum"), PROBLEM)

    def test_missing_optional_data_does_not_erase_saved_data(self):
        query = MagicMock()
        partial = {**PROBLEM, "starter_code": {"python3": "updated python"}, "example_testcases": ""}
        with patch.object(leetcode, "_db_problem", return_value=PROBLEM), patch.object(supabase, "table", return_value=query):
            self.assertTrue(leetcode._save_problem(partial))
        row = query.upsert.call_args.args[0]
        self.assertEqual(row["starter_code"]["java"], PROBLEM["starter_code"]["java"])
        self.assertEqual(row["starter_code"]["python3"], "updated python")
        self.assertEqual(row["example_testcases"], PROBLEM["example_testcases"])

    def test_missing_problem_is_not_saved(self):
        with patch.object(leetcode, "fetch_live_problem", return_value=None), patch.object(leetcode, "_save_problem") as save:
            self.assertIsNone(leetcode.get_problem("missing"))
        save.assert_not_called()

    def test_api_failure_reads_cache_without_rewriting_it(self):
        with patch.object(leetcode, "fetch_live_problem", side_effect=httpx.HTTPError("rate limited")), patch.object(leetcode, "_db_problem", return_value=PROBLEM), patch.object(leetcode, "_save_problem") as save, self.assertLogs(leetcode.logger, level="WARNING"):
            self.assertEqual(leetcode.get_problem("two-sum"), PROBLEM)
        save.assert_not_called()

    def test_summary_without_description_is_not_saved(self):
        with patch.object(supabase, "table") as table, self.assertLogs(leetcode.logger, level="WARNING"):
            self.assertFalse(leetcode._save_problem({"slug": "two-sum", "title": "Two Sum", "difficulty": "Easy"}))
        table.assert_not_called()


if __name__ == "__main__":
    unittest.main()
