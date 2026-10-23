import unittest
from main import order_total


class CartTests(unittest.TestCase):
    def test_no_discount(self):
        self.assertEqual(order_total([{"price": 40, "quantity": 2}]), 80)

    def test_percentage_discount(self):
        self.assertEqual(order_total([{"price": 50, "quantity": 2}], 20), 80)

    def test_empty_cart(self):
        self.assertEqual(order_total([], 20), 0)

    def test_full_discount(self):
        self.assertEqual(order_total([{"price": 30, "quantity": 1}], 100), 0)

    def test_invalid_discount(self):
        for discount in (-1, 101):
            with self.assertRaises(ValueError):
                order_total([{"price": 10, "quantity": 1}], discount)

    def test_multiple_items(self):
        self.assertEqual(order_total([{"price": 12.5, "quantity": 2}, {"price": 5, "quantity": 3}], 25), 30)

    def test_rounding(self):
        self.assertEqual(order_total([{"price": 9.99, "quantity": 3}], 15), 25.47)

    def test_public_api_signature(self):
        import inspect
        parameters = inspect.signature(order_total).parameters
        self.assertEqual(list(parameters), ["items", "discount_percent"])
        self.assertEqual(parameters["discount_percent"].default, 0)
