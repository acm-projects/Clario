from collections import defaultdict
def daily_revenue(orders, tz="America/Los_Angeles"):
    totals = defaultdict(float)
    for o in orders:
        day = o["created_at"].date()
        amount = o["price"] * o["qty"] * (1 - o["discount"])
        if o["status"] == "refunded": amount = -amount
        totals[day] += amount
    return {d: round(t, 2) for d, t in totals.items()}
