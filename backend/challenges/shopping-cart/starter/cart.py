from discounts import COUPONS

class Cart:
    def __init__(self, items=None, coupons=None):
        self.items = items or {}
        self.coupons = coupons or []
    def add_item(self, sku, price, qty=1):
        if sku in self.items:
            self.items[sku]["qty"] = qty
        else:
            self.items[sku] = {"price": price, "qty": qty}
    def remove_item(self, sku, qty=1):
        self.items[sku]["qty"] -= qty
        if self.items[sku]["qty"] == 0:
            del self.items[sku]
    def apply_coupon(self, code):
        self.coupons.append(code)
    def subtotal(self):
        return sum(i["price"] * i["qty"] for i in self.items.values())
    def total(self):
        amount = self.subtotal()
        for code in self.coupons:
            coupon = COUPONS[code]
            amount = amount * (1 - coupon["pct"] / 100) if "pct" in coupon else amount - coupon["fixed"]
        tax = amount * 0.0825
        shipping = 0 if self.subtotal() > 50 else 5.99
        return round(amount + tax + shipping, 2)
