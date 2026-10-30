import unittest
from ttl_lru import TTLCache
from client import is_enabled
class Tests(unittest.TestCase):
    def setUp(self):
        self.now = 0; self.c = TTLCache(2, 10, lambda: self.now)
    def test_lru(self):
        self.c.put("a", 1); self.c.put("b", 2); self.c.get("a"); self.c.put("c", 3)
        self.assertEqual(self.c.get("a"), 1); self.assertIsNone(self.c.get("b"))
    def test_expiry_boundary(self):
        self.c.put("a", 1); self.now = 10; self.assertIsNone(self.c.get("a")); self.assertEqual(len(self.c), 0)
    def test_len_purges(self):
        self.c.put("a", 1); self.now = 11; self.assertEqual(len(self.c), 0)
    def test_update_at_capacity(self):
        self.c.put("a", 1); self.c.put("b", 2); self.c.put("a", 3)
        self.assertEqual(self.c.get("b"), 2); self.assertEqual(self.c.get("a"), 3)
    def test_falsy_values(self):
        for value in (False, 0, ""):
            self.c.put("a", value)
            self.assertEqual(is_enabled(self.c, "a", lambda _: self.fail("Unexpected fetch")), value)
    def test_refresh_and_capacity(self):
        self.c.put("a", 1); self.now = 9; self.c.put("a", 2); self.now = 10
        self.assertEqual(self.c.get("a"), 2)
        for i in range(30): self.c.put(str(i), i)
        self.assertEqual(len(self.c), 2)
    def test_invalid_config(self):
        for capacity, ttl in [(0, 1), (-1, 1), (2, 0)]:
            with self.assertRaises(ValueError): TTLCache(capacity, ttl)
