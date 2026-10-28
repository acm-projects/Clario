# The Cart That Charges the Wrong Amount

Customers report duplicate promos, cent-level tax errors, lost quantities, inconsistent shipping, and carts leaking between sessions.

## Contract
Cart.add_item accumulates positive integer quantities; negative prices and invalid quantities raise ValueError. remove_item raises ValueError for missing SKUs, nonpositive quantities, or over-removal without mutation. Coupon codes SAVE10 (10%), SAVE20 (20%), and FIVE ($5) are validated and deduplicated. Apply percent coupons in code order before fixed discounts, rounding each percent step half-up to cents; clamp the discounted subtotal to zero. Tax is 8.25% of the discounted subtotal, rounded half-up per order. Shipping is free at a discounted subtotal >= $50; otherwise $5.99. Empty carts cost zero. Sessions and constructor inputs must not share mutable cart state. subtotal and total return numeric dollar amounts.

These are synthetic practice scenarios, not actual company questions.
Use Run Tests to reproduce the failures. Preserve public interfaces; edit implementation files, not tests.
