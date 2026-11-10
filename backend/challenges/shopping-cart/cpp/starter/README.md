# The Cart That Charges the Wrong Amount (C++)

Customers report duplicate promos, cent-level tax errors, lost quantities, inconsistent shipping, and carts leaking between sessions.

Cart owns its items by value; Session owns its cart. Prices/results are dollar doubles; compute half-up rounding at cent boundaries. Item quantities are integers; reject nonpositive quantities and negative prices. Coupons SAVE10/SAVE20/FIVE are validated, deduplicated, percentages first. Empty carts cost zero, shipping is $5.99 below discounted $50, tax is 8.25%. Preserve the supplied API.

Edit solution.hpp. Read-only tests show the public interface. Run Tests compiles and runs the repository in the C++ sandbox.
