import unittest
from datetime import datetime, timezone, date
from decimal import Decimal
from revenue import daily_revenue
class Tests(unittest.TestCase):
    def order(self, **kw):
        return dict({"created_at": datetime(2026, 3, 9, 3, 30, tzinfo=timezone.utc), "price": 10, "qty": 1, "discount": 0, "status": "paid"}, **kw)
    def amount(self, orders):
        return Decimal(str(sum(daily_revenue(orders).values())))
    def test_local_day(self):
        self.assertEqual(list(daily_revenue([self.order()])), [date(2026, 3, 8)])
    def test_timezone_parameter(self):
        self.assertEqual(list(daily_revenue([self.order()], "UTC")), [date(2026, 3, 9)])
    def test_decimal_accumulation(self):
        self.assertEqual(self.amount([self.order(price=0.1) for _ in range(10)]), Decimal("1.00"))
    def test_half_up_per_order(self):
        self.assertEqual(self.amount([self.order(price=0.025), self.order(price=0.025)]), Decimal("0.06"))
        self.assertEqual(self.amount([self.order(price=10.05, qty=3, discount=0.15)]), Decimal("25.63"))
    def test_cancelled(self):
        self.assertEqual(self.amount([self.order(status="cancelled")]), 0)
    def test_partial_refund(self):
        self.assertEqual(self.amount([self.order(status="partially_refunded", refund_amount=3.25)]), Decimal("6.75"))
    def test_refunded(self):
        self.assertEqual(self.amount([self.order(status="refunded")]), -10)
    def test_dst_and_month_boundary(self):
        for stamp, expected in [("2026-03-08T09:30:00+00:00", date(2026,3,8)), ("2026-03-08T10:30:00+00:00", date(2026,3,8)), ("2026-11-01T08:30:00+00:00", date(2026,11,1)), ("2026-11-01T09:30:00+00:00", date(2026,11,1)), ("2026-04-01T01:00:00+00:00", date(2026,3,31))]:
            self.assertEqual(list(daily_revenue([self.order(created_at=datetime.fromisoformat(stamp))])), [expected])
