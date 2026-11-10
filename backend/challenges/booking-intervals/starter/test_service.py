import unittest
from service import *

class Tests(unittest.TestCase):
    def test_overlapping_unsorted(self):
        self.assertEqual(merge_bookings([(5,9),(1,6)]),[(1,9)])
    def test_touching_separate(self):
        self.assertEqual(merge_bookings([(1,3),(3,5)]),[(1,3),(3,5)])
    def test_nested(self):
        self.assertEqual(merge_bookings([(1,10),(2,3),(4,5)]),[(1,10)])
    def test_invalid_empty_and_immutable(self):
        rows=[(3,4),(1,2)]
        merge_bookings(rows)
        self.assertEqual(rows,[(3,4),(1,2)])
        self.assertEqual(merge_bookings([]),[])
        with self.assertRaises(ValueError): merge_bookings([(1,1)])
