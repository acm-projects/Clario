from policy import STRICT
def allocate(stock, requests):
    if any(type(n) is not int or n < 0 for n in stock.values()): raise ValueError("invalid stock")
    result = stock
    for sku, qty in requests.items():
        if type(qty) is not int or qty <= 0: raise ValueError("invalid quantity")
        if sku not in result or result[sku] <= qty: raise ValueError("unavailable")
        result[sku] -= qty
    return result
