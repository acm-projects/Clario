import unittest
from service import *

class Tests(unittest.TestCase):
    def test_latest_and_stale(self):
        rows=[{"id":"a","version":2,"value":"new"},{"id":"a","version":1,"value":"old"}]
        self.assertEqual(latest_events(rows),[rows[0]])
    def test_ties_keep_first(self):
        rows=[{"id":"a","version":2,"value":"first"},{"id":"a","version":2,"value":"second"}]
        self.assertEqual(latest_events(rows),[rows[0]])
    def test_sorted_output(self):
        rows=[{"id":k,"version":1,"value":k} for k in ["z","a","m"]]
        self.assertEqual([r["id"] for r in latest_events(rows)],["a","m","z"])
    def test_invalid_empty_and_copy(self):
        self.assertEqual(latest_events([]),[])
        with self.assertRaises(ValueError): latest_events([{"id":"","version":1,"value":"x"}])
        rows=[{"id":"a","version":1,"value":"x"}]
        latest_events(rows)[0]["value"]="changed"
        self.assertEqual(rows[0]["value"],"x")
