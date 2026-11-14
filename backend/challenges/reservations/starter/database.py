import sqlite3
from contextlib import contextmanager
class Database:
    def __init__(self, path, available=10):
        self.path = str(path)
        with self.connect() as c:
            c.executescript("CREATE TABLE events(id INTEGER PRIMARY KEY, available INTEGER); CREATE TABLE reservations(id INTEGER PRIMARY KEY, event_id INTEGER, user_id TEXT, qty INTEGER, status TEXT, expires_at REAL, idempotency_key TEXT UNIQUE);")
            c.execute("INSERT INTO events VALUES(1, ?)", (available,))
    @contextmanager
    def connect(self):
        c = sqlite3.connect(self.path, timeout=5, isolation_level=None)
        c.row_factory = sqlite3.Row
        try: yield c
        finally: c.close()
    @contextmanager
    def transaction(self):
        with self.connect() as c:
            c.execute("BEGIN IMMEDIATE")
            try:
                yield c
                c.commit()
            except BaseException:
                c.rollback(); raise
