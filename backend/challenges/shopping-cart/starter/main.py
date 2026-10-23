from cart import checkout


def order_total(items, discount_percent=0):
    return checkout(items, discount_percent)


if __name__ == "__main__":
    items = [{"price": 50, "quantity": 2}]
    print("Expected $80.00; received:", order_total(items, 20))
