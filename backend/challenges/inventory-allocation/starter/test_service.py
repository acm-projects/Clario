import unittest
from service import *

class Tests(unittest.TestCase):
    def test_exact_stock(self):
        self.assertEqual(allocate({"a":2},{"a":2}),{"a":0})
    def test_no_input_mutation(self):
        stock={"a":5}
        self.assertEqual(allocate(stock,{"a":2}),{"a":3})
        self.assertEqual(stock,{"a":5})
    def test_failure_atomicity(self):
        stock={"a":5}
        with self.assertRaises(ValueError): allocate(stock,{"a":2,"missing":1})
        self.assertEqual(stock,{"a":5})
    def test_invalid_quantities(self):
        for qty in [0,-1,True]:
            with self.assertRaises(ValueError): allocate({"a":5},{"a":qty})
