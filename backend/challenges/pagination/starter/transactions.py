from cursors import encode_cursor, decode_cursor
def list_transactions(db, account_id, limit=10, cursor=None):
    rows = sorted([r for r in db if r["account_id"] == account_id], key=lambda r: r["created_at"], reverse=True)
    if cursor:
        boundary = decode_cursor(cursor)
        rows = [r for r in rows if r["created_at"].replace(tzinfo=None) < boundary]
    page = rows[:limit]
    more = len(rows) > limit
    return {"data": page, "has_more": more, "next_cursor": encode_cursor(page[-1]["created_at"]) if more else None}
