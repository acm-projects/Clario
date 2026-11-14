import unittest
from unittest.mock import patch

from piston import router as runner

PROBLEM = {"slug": "two-sum", "title": "Two Sum"}


class RunProblemCacheTests(unittest.TestCase):
    def setUp(self):
        runner._problem_cache.clear()
        self.addCleanup(runner._problem_cache.clear)

    def test_repeat_runs_skip_the_live_problem_api(self):
        with patch.object(runner, "get_problem", return_value=PROBLEM) as fetch:
            self.assertEqual(runner.load_problem("two-sum"), PROBLEM)
            self.assertEqual(runner.load_problem("two-sum"), PROBLEM)
        fetch.assert_called_once_with("two-sum")

    def test_missing_problems_are_not_cached(self):
        with patch.object(runner, "get_problem", return_value=None) as fetch:
            runner.load_problem("nope"); runner.load_problem("nope")
        self.assertEqual(fetch.call_count, 2)

    def test_expired_entries_are_refetched(self):
        with patch.object(runner, "get_problem", return_value=PROBLEM) as fetch, patch.object(runner.time, "monotonic", side_effect=[0, runner.PROBLEM_CACHE_SECONDS + 1, runner.PROBLEM_CACHE_SECONDS + 1]):
            runner.load_problem("two-sum"); runner.load_problem("two-sum")
        self.assertEqual(fetch.call_count, 2)
