import unittest
from service import *

class Tests(unittest.TestCase):
    def test_deny_wins(self):
        self.assertFalse(enabled("a",0,100,["a"],["a"]))
    def test_allow_overrides_zero(self):
        self.assertTrue(enabled("a",99,0,["a"],[]))
    def test_rollout_boundary(self):
        self.assertFalse(enabled("a",20,20,[],[]))
        self.assertTrue(enabled("a",19,20,[],[]))
        self.assertFalse(enabled("a",0,0,[],[]))
    def test_invalid_and_no_mutation(self):
        a=["x"];d=["y"]
        enabled("a",1,50,a,d)
        self.assertEqual((a,d),(["x"],["y"]))
        with self.assertRaises(ValueError): enabled("a",100,20,[],[])
