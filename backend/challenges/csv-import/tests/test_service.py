import unittest
from service import *

class Tests(unittest.TestCase):
    def test_simple_and_trailing(self):
        self.assertEqual(parse_row("a,b,"),["a","b",""])
    def test_quoted_comma(self):
        self.assertEqual(parse_row('"Doe, Jane",active'),["Doe, Jane","active"])
    def test_escaped_quotes(self):
        self.assertEqual(parse_row('"Say ""hi""",ok'),['Say "hi"',"ok"])
    def test_invalid_and_empty(self):
        self.assertEqual(parse_row(""),[""])
        for line in ['"missing','ab"cd','"x"y',"a\nb"]:
            with self.assertRaises(ValueError): parse_row(line)
