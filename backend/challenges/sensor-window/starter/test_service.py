import unittest
from service import *

class Tests(unittest.TestCase):
    def test_device_isolation(self):
        self.assertEqual(window_average([{"device":"a","time":5,"value":10},{"device":"b","time":5,"value":100}],"a",10,10),10)
    def test_boundaries(self):
        rows=[{"device":"a","time":t,"value":v} for t,v in [(0,100),(1,10),(10,20),(11,100)]]
        self.assertEqual(window_average(rows,"a",10,10),15)
    def test_zero_and_negative(self):
        rows=[{"device":"a","time":5,"value":v} for v in [0,-4]]
        self.assertEqual(window_average(rows,"a",10,10),-2)
    def test_empty_and_invalid(self):
        self.assertIsNone(window_average([],"a",10,10))
        with self.assertRaises(ValueError): window_average([],"a",10,0)
