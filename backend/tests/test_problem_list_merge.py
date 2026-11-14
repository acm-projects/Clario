import unittest
from unittest.mock import patch

import leetcode

LIVE = [{"slug": "two-sum", "leetcode_id": "1", "title": "Two Sum", "difficulty": "Easy", "topics": []},
        {"slug": "valid-parentheses", "leetcode_id": "20", "title": "Valid Parentheses", "difficulty": "Easy", "topics": []}]
SAVED = [{"slug": "contains-duplicate", "leetcode_id": "217", "title": "Contains Duplicate", "difficulty": "Easy", "topics": []},
         {"slug": "two-sum", "leetcode_id": "1", "title": "Two Sum", "difficulty": "Easy", "topics": []}]


class ProblemListMergeTests(unittest.TestCase):
    def test_saved_problems_beyond_the_live_batch_are_listed_once_in_order(self):
        with patch.object(leetcode, "fetch_live_problem_list", return_value=list(LIVE)), patch.object(leetcode, "_db_problem_list", return_value=SAVED) as saved:
            result = leetcode.get_problem_list(None, None, "dup")
        self.assertEqual([r["slug"] for r in result], ["two-sum", "valid-parentheses", "contains-duplicate"])
        saved.assert_called_once_with(None, None, "dup")  # same filters as the live query

    def test_live_list_still_works_when_saved_library_is_unavailable(self):
        with patch.object(leetcode, "fetch_live_problem_list", return_value=list(LIVE)), patch.object(leetcode, "_db_problem_list", return_value=None):
            self.assertEqual(leetcode.get_problem_list(), LIVE)
