import unittest
from main import order_total


class CheckoutTests(unittest.TestCase):
    def test_visible_percentage_discount(self):
        self.assertEqual(order_total([{"price": 50, "quantity": 2}], 20), 80)

    def test_visible_quantity(self):
        self.assertEqual(order_total([{"price": 10, "quantity": 3}], 10), 27)

    def test_visible_no_discount(self):
        self.assertEqual(order_total([{"price": 40, "quantity": 2}], 0), 80)
