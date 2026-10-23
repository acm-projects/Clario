def apply_discount(subtotal, percentage):
    """Apply a percentage from 0 through 100 to a subtotal."""
    if not 0 <= percentage <= 100:
        raise ValueError("Discount must be between 0 and 100")
    return subtotal * (1 - percentage / 100)
