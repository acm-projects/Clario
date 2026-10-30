import unittest, tempfile
from concurrent.futures import ThreadPoolExecutor
from database import Database
from reservations import reserve_seats, SoldOut
from expire_holds import expire_holds
class Tests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup); self.db = Database(self.tmp.name + "/db.sqlite", 10)
    def available(self):
        with self.db.connect() as c: return c.execute("SELECT available FROM events WHERE id=1").fetchone()[0]
    def test_concurrent_capacity(self):
        def reserve(i):
            try: reserve_seats(self.db,1,str(i),1,str(i)); return True
            except SoldOut: return False
        with ThreadPoolExecutor(max_workers=10) as pool: result = list(pool.map(reserve,range(50)))
        self.assertEqual(sum(result),10); self.assertEqual(self.available(),0)
    def test_retry_idempotency(self):
        a = reserve_seats(self.db,1,"u",2,"key"); b = reserve_seats(self.db,1,"u",2,"key")
        self.assertEqual(a["id"],b["id"]); self.assertEqual(self.available(),8)
    def test_concurrent_retry(self):
        with ThreadPoolExecutor(max_workers=8) as pool: rows = list(pool.map(lambda _: reserve_seats(self.db,1,"u",1,"same"),range(8)))
        self.assertEqual(len({r["id"] for r in rows}),1); self.assertEqual(self.available(),9)
    def test_expiry_once(self):
        reserve_seats(self.db,1,"u",2,"key")
        with ThreadPoolExecutor(max_workers=2) as pool: list(pool.map(lambda _: expire_holds(self.db,600),range(2)))
        expire_holds(self.db,600); self.assertEqual(self.available(),10)
    def test_live_hold(self):
        reserve_seats(self.db,1,"u",2,"key"); expire_holds(self.db,599); self.assertEqual(self.available(),8)
    def test_transaction_rollback(self):
        with self.db.connect() as c: c.execute("CREATE TRIGGER fail_insert BEFORE INSERT ON reservations BEGIN SELECT RAISE(ABORT, 'simulated failure'); END;")
        with self.assertRaises(Exception): reserve_seats(self.db,1,"u",2,"key")
        self.assertEqual(self.available(),10)
    def test_invalid_and_conflicting_requests(self):
        for qty in (0,-1,True):
            with self.assertRaises(ValueError): reserve_seats(self.db,1,"u",qty,"bad")
        reserve_seats(self.db,1,"u",1,"key")
        with self.assertRaises(ValueError): reserve_seats(self.db,1,"other",1,"key")
        self.assertEqual(self.available(),9)
