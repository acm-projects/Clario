import unittest
from service import *

class Tests(unittest.TestCase):
    def test_dependency_order(self):
        self.assertEqual(schedule({"deploy":["build"],"build":[]}),["build","deploy"])
    def test_lexical_and_duplicates(self):
        self.assertEqual(schedule({"c":["a","a"],"b":[],"a":[]}),["a","b","c"])
    def test_cycles_and_missing(self):
        for graph in [{"a":["a"]},{"a":["b"],"b":["a"]},{"a":["missing"]}]:
            with self.assertRaises(ValueError): schedule(graph)
    def test_empty_and_immutable(self):
        graph={"a":[],"b":["a"]}
        schedule(graph)
        self.assertEqual(graph,{"a":[],"b":["a"]})
        self.assertEqual(schedule({}),[])
