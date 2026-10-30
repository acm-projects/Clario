import unittest
from decimal import Decimal
from cart import Cart
from checkout import get_cart

class Tests(unittest.TestCase):
    def make(self, price=100, qty=1):
        c = Cart(); c.add_item("a", price, qty); return c
    def test_quantity_accumulates(self):
        c = self.make(10); c.add_item("a", 10, 2); self.assertEqual(c.items["a"]["qty"], 3)
    def test_removal_contract(self):
        c = self.make(10, 2)
        for sku, qty in [("a", 5), ("missing", 1), ("a", 0)]:
            with self.assertRaises(ValueError): c.remove_item(sku, qty)
        self.assertEqual(c.items["a"]["qty"], 2)
        c.remove_item("a", 2); self.assertNotIn("a", c.items)
    def test_coupon_deduplication(self):
        c = self.make(); c.apply_coupon("SAVE10"); before = c.total(); c.apply_coupon("SAVE10"); self.assertEqual(c.total(), before)
    def test_coupon_validation(self):
        with self.assertRaises(ValueError): self.make().apply_coupon("NOPE")
    def test_coupon_order(self):
        for codes in [("SAVE10", "FIVE"), ("FIVE", "SAVE10")]:
            c = self.make()
            for code in codes: c.apply_coupon(code)
            self.assertEqual(Decimal(str(c.total())), Decimal("92.01"))
    def test_shipping_boundary(self):
        self.assertEqual(Decimal(str(self.make(50).total())), Decimal("54.13"))
        c = self.make(50); c.apply_coupon("SAVE10"); self.assertEqual(Decimal(str(c.total())), Decimal("54.70"))
    def test_session_isolation(self):
        a, b = {}, {}; first = get_cart(a); first.add_item("x", 1)
        self.assertIs(get_cart(a), first); self.assertNotIn("x", get_cart(b).items)
    def test_money_rounding(self):
        self.assertEqual(Decimal(str(self.make(19.99, 3).total())), Decimal("64.92"))
        self.assertEqual(Decimal(str(self.make(0.02).total())), Decimal("6.01"))
    def test_empty_and_floor(self):
        self.assertEqual(Cart().total(), 0)
        c = self.make(1); c.apply_coupon("FIVE"); self.assertEqual(Decimal(str(c.total())), Decimal("5.99"))
    def test_constructor_isolation(self):
        items = {"a": {"price": 10, "qty": 2}}; c = Cart(items); c.remove_item("a"); self.assertEqual(items["a"]["qty"], 2)
