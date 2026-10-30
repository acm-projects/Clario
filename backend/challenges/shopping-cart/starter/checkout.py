from cart import Cart
DEFAULT_CART = Cart()
def get_cart(session):
    return session.get("cart", DEFAULT_CART)
