import unittest
from datetime import datetime, timezone, timedelta
from transactions import list_transactions
class Tests(unittest.TestCase):
    def walk(self, rows, size):
        cursor = None; result = []
        for _ in range(40):
            page = list_transactions(rows, "a", size, cursor); result += page["data"]
            if not page["has_more"]:
                self.assertIsNone(page["next_cursor"]); return result
            self.assertTrue(page["next_cursor"]); cursor = page["next_cursor"]
        self.fail("Pagination did not terminate")
    def rows(self):
        t = datetime(2026, 1, 1, tzinfo=timezone.utc)
        return [{"id": i, "account_id": "a", "created_at": t + timedelta(microseconds=(i // 7) * 100)} for i in range(25)]
    def test_tied_timestamps(self):
        rows = self.rows(); actual = self.walk(rows, 10)
        self.assertEqual([r["id"] for r in actual], list(reversed(range(25))))
    def test_microsecond_precision(self):
        self.assertEqual(len(self.walk(self.rows(), 1)), 25)
    def test_stable_order(self):
        rows = self.rows(); self.assertEqual(self.walk(rows, 8), self.walk(list(reversed(rows)), 8))
    def test_utc_and_offset(self):
        rows = self.rows()
        for r in rows: r["created_at"] = r["created_at"].astimezone(timezone(timedelta(hours=5, minutes=30)))
        self.assertEqual(len(self.walk(rows, 6)), 25)
    def test_isolation_and_empty(self):
        self.assertEqual(list_transactions([], "a")["data"], [])
        self.assertEqual(list_transactions([{"id": 1, "account_id": "b", "created_at": datetime.now(timezone.utc)}], "a")["data"], [])
    def test_invalid_inputs(self):
        for limit in (0, -1, 101, True):
            with self.assertRaises(ValueError): list_transactions([], "a", limit)
        with self.assertRaises(ValueError): list_transactions(self.rows(), "a", cursor="not-a-cursor")
