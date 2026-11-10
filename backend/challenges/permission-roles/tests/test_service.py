import unittest
from service import *

class Tests(unittest.TestCase):
    def test_inherited_allow(self):
        roles={"base":{"parents":[],"allow":["read"],"deny":[]},"child":{"parents":["base"],"allow":[],"deny":[]}}
        self.assertTrue(can_access(roles,["child"],"read"))
    def test_deny_overrides(self):
        roles={"base":{"parents":[],"allow":[],"deny":["read"]},"child":{"parents":["base"],"allow":["read"],"deny":[]}}
        self.assertFalse(can_access(roles,["child"],"read"))
    def test_cycle_and_unknown(self):
        roles={"a":{"parents":["a"],"allow":["read"],"deny":[]}}
        with self.assertRaises(ValueError): can_access(roles,["a"],"read")
        with self.assertRaises(ValueError): can_access({},["missing"],"read")
    def test_default_deny_and_duplicates(self):
        roles={"a":{"parents":[],"allow":["read"],"deny":[]}}
        self.assertFalse(can_access(roles,["a"],"write"))
        self.assertTrue(can_access(roles,["a","a"],"read"))
        self.assertFalse(can_access({},[],"read"))
