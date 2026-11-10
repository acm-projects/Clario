import unittest
from service import *

class Tests(unittest.TestCase):
    def test_transfer_and_conservation(self):
        l=Ledger({"a":1000,"b":100})
        l.transfer("k","a","b",200)
        self.assertEqual(l.balances,{"a":800,"b":300})
    def test_idempotency_and_conflict(self):
        l=Ledger({"a":1000,"b":0})
        l.transfer("k","a","b",100)
        l.transfer("k","a","b",100)
        self.assertEqual(l.balances["a"],900)
        with self.assertRaises(ValueError): l.transfer("k","a","b",200)
    def test_failed_request_atomicity(self):
        l=Ledger({"a":100,"b":0})
        with self.assertRaises(ValueError): l.transfer("k","a","b",200)
        l.transfer("k","a","b",100)
        self.assertEqual(l.balances,{"a":0,"b":100})
    def test_input_isolation_and_validation(self):
        b={"a":5,"b":0}
        l=Ledger(b)
        for key,source,target,n in [("k","a","a",1),("","a","b",1),("k","a","b",0)]:
            with self.assertRaises(ValueError): l.transfer(key,source,target,n)
        self.assertEqual(b,{"a":5,"b":0})
