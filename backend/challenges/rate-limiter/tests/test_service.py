import unittest
from service import *

class Tests(unittest.TestCase):
    def test_account_isolation(self):
        r=RateLimiter(1,10)
        self.assertTrue(r.allow("a",0))
        self.assertTrue(r.allow("b",0))
    def test_window_boundary(self):
        r=RateLimiter(1,10)
        r.allow("a",0)
        self.assertTrue(r.allow("a",10))
    def test_rejection_does_not_extend(self):
        r=RateLimiter(1,10)
        r.allow("a",0)
        self.assertFalse(r.allow("a",9))
        self.assertTrue(r.allow("a",10))
    def test_invalid_config_and_time(self):
        for limit,window in [(0,1),(1,0),(-1,1)]:
            with self.assertRaises(ValueError): RateLimiter(limit,window)
        r=RateLimiter(1,10)
        r.allow("a",3)
        with self.assertRaises(ValueError): r.allow("a",2)
