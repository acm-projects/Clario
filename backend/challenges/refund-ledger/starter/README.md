# The Refund Service That Pays Too Much

Partial refunds can exceed the original charge, and a rejected request consumes its retry key.

RefundLedger(charged_cents) requires nonnegative integer cents. refund(key,cents) requires a nonempty key and positive cents, returns cumulative refunded cents, and must never exceed charged cents. Identical retry keys return the current cumulative total without paying again; conflicting amounts throw. A failed refund leaves totals and keys unchanged. C++ uses long long cents.

Start in service.py; policy.py records the shared mutation policy. Tests are read-only.
