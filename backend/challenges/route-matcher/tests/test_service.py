import unittest
from service import *

class Tests(unittest.TestCase):
    def test_segment_boundary(self):
        self.assertIsNone(match_route("/apiculture",{"/api":"api"}))
    def test_longest_prefix(self):
        self.assertEqual(match_route("/api/users/42",{"/":"root","/api":"api","/api/users":"users"}),"users")
    def test_query_and_trailing(self):
        self.assertEqual(match_route("/api?debug=1",{"/api/":"api"}),"api")
    def test_invalid_and_empty(self):
        self.assertIsNone(match_route("/x",{}))
        with self.assertRaises(ValueError): match_route("x",{})
        with self.assertRaises(ValueError): match_route("/x",{"bad":"x"})
