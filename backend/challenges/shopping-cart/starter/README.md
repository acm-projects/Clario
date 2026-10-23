# Checkout incident

The checkout entry point is `main.order_total(items, discount_percent)`.
Each item has a `price` and `quantity`. `main.py` calls the cart service,
which calculates the subtotal and delegates discounts to `discounts.py`.

Support reproduced the issue with two $50 items and a 20% discount:
the expected result is $80.00.

Follow the values across module boundaries. Preserve the public API,
reject discounts outside 0..100 with ValueError, and round final totals
to two decimal places. Zero and 100% discounts are valid. Empty carts
return zero. There are no external dependencies.
