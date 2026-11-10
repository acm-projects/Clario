import unittest
from service import *

class Tests(unittest.TestCase):
    def test_partial_and_exact(self):
        r=RefundLedger(1000)
        self.assertEqual(r.refund("a",400),400)
        self.assertEqual(r.refund("b",600),1000)
    def test_cumulative_limit(self):
        r=RefundLedger(1000)
        r.refund("a",600)
        with self.assertRaises(ValueError): r.refund("b",500)
        self.assertEqual(r.total,600)
    def test_retry_and_conflict(self):
        r=RefundLedger(1000)
        r.refund("a",200)
        self.assertEqual(r.refund("a",200),200)
        with self.assertRaises(ValueError): r.refund("a",300)
    def test_failed_key_and_validation(self):
        r=RefundLedger(100)
        with self.assertRaises(ValueError): r.refund("key",200)
        self.assertEqual(r.refund("key",100),100)
        with self.assertRaises(ValueError): r.refund("",1)
