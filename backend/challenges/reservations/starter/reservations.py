import time
class SoldOut(Exception): pass
def reserve_seats(db, event_id, user_id, qty, idempotency_key, now=0):
    with db.connect() as c:
        event = c.execute("SELECT available FROM events WHERE id=?", (event_id,)).fetchone()
        if event["available"] < qty: raise SoldOut()
        time.sleep(0.002)
        c.execute("UPDATE events SET available=? WHERE id=?", (event["available"] - qty, event_id))
        result = c.execute("INSERT INTO reservations(event_id,user_id,qty,status,expires_at,idempotency_key) VALUES(?,?,?,'held',?,NULL)", (event_id,user_id,qty,now+600))
        return dict(c.execute("SELECT * FROM reservations WHERE id=?", (result.lastrowid,)).fetchone())
