from discounts import apply_discount


def checkout(items, discount_percent=0):
    subtotal = sum(item["price"] for item in items)
    discount_rate = discount_percent / 100
    return round(apply_discount(subtotal, discount_rate), 2)
