import unittest
from service import *

class Tests(unittest.TestCase):
    def test_all_terms_and_whole_words(self):
        docs=[{"id":"a","text":"cart checkout"},{"id":"b","text":"cart"},{"id":"c","text":"cartwheel checkout"}]
        self.assertEqual(search(docs,"cart checkout"),["a"])
    def test_ranking_and_ties(self):
        docs=[{"id":"z","text":"duck"},{"id":"a","text":"duck"},{"id":"b","text":"duck duck"}]
        self.assertEqual(search(docs,"duck"),["b","a","z"])
    def test_case_and_duplicates_in_query(self):
        self.assertEqual(search([{"id":"a","text":"Blue-duck DUCK"}],"DUCK duck blue"),["a"])
    def test_empty_and_invalid_ids(self):
        self.assertEqual(search([],"duck"),[])
        self.assertEqual(search([{"id":"a","text":"duck"}],""),[])
        with self.assertRaises(ValueError): search([{"id":"a","text":"x"},{"id":"a","text":"y"}],"x")
