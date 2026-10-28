import time
def expire_holds(db, now):
    with db.connect() as c:
        rows = c.execute("SELECT * FROM reservations WHERE status='held' AND expires_at<=?", (now,)).fetchall()
        for r in rows:
            time.sleep(0.002)
            c.execute("UPDATE events SET available=available+? WHERE id=?", (r["qty"],r["event_id"]))
            c.execute("UPDATE reservations SET status='expired' WHERE id=?", (r["id"],))
