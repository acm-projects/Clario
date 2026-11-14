"""Rebuild trusted challenge fixtures. Solutions are test-only, never catalog files."""
import ast
import json
from pathlib import Path
from textwrap import dedent

ROOT = Path(__file__).resolve().parents[1]
SOLUTIONS = {}


def challenge(folder, identifier, title, description, contract, sources, tests, solutions, language="python", readonly=None):
    base = ROOT / "challenges" / folder
    readonly = readonly or {}
    test_file = "test_worker.js" if language == "javascript" else "test_" + folder.replace("-", "_") + ".py"
    if folder == "shopping-cart":
        test_file = "test_cart.py"
    tests = dedent(tests).lstrip()
    if language == "python":
        names = [node.name for node in ast.walk(ast.parse(tests)) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name.startswith("test_")]
    else:
        import re
        names = re.findall(r"exports\.(test_\w+)\s*=", tests)
    readme = f"# {title}\n\n{description}\n\n## Contract\n{contract}\n\nThese are synthetic practice scenarios, not actual company questions.\nUse Run Tests to reproduce the failures. Preserve public interfaces; edit implementation files, not tests.\n"
    readonly = {**readonly, "README.md": readme, test_file: tests}
    manifest = dict(id=identifier, title=title, difficulty="Hard" if folder in {"reservations", "webhook-worker"} else "Medium", language=language, category="Debugging", estimatedMinutes=45, description=description, objective="Reproduce the reported failures and repair the implementation without changing its public interfaces.", expectedBehavior=contract, constraints=["Preserve the documented interfaces.", "Use only the language standard library; no network access or external packages.", "The provided tests are read-only; additional private tests verify edge cases."], editableFiles=list(sources), readOnlyFiles=list(readonly), entrypoint=next(iter(sources)), testFile=test_file, testNames=sorted(names), bugs=[])
    for path, content in {**sources, **readonly}.items():
        target = base / "starter" / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(dedent(content).lstrip(), encoding="utf-8")
    (base / "tests").mkdir(exist_ok=True)
    (base / "tests" / test_file).write_text(tests, encoding="utf-8")
    (base / "challenge.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    SOLUTIONS[identifier] = {name: dedent(content).lstrip() for name, content in solutions.items()}


def build():
    cart = '''
from discounts import COUPONS

class Cart:
    def __init__(self, items=None, coupons=None):
        self.items = items or {}
        self.coupons = coupons or []
    def add_item(self, sku, price, qty=1):
        if sku in self.items:
            self.items[sku]["qty"] = qty
        else:
            self.items[sku] = {"price": price, "qty": qty}
    def remove_item(self, sku, qty=1):
        self.items[sku]["qty"] -= qty
        if self.items[sku]["qty"] == 0:
            del self.items[sku]
    def apply_coupon(self, code):
        self.coupons.append(code)
    def subtotal(self):
        return sum(i["price"] * i["qty"] for i in self.items.values())
    def total(self):
        amount = self.subtotal()
        for code in self.coupons:
            coupon = COUPONS[code]
            amount = amount * (1 - coupon["pct"] / 100) if "pct" in coupon else amount - coupon["fixed"]
        tax = amount * 0.0825
        shipping = 0 if self.subtotal() > 50 else 5.99
        return round(amount + tax + shipping, 2)
'''
    cart_fix = '''
from decimal import Decimal, ROUND_HALF_UP
from discounts import COUPONS
from copy import deepcopy

def money(value):
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

class Cart:
    def __init__(self, items=None, coupons=None):
        self.items = deepcopy(items) if items is not None else {}
        self.coupons = []
        for code in coupons or []:
            self.apply_coupon(code)
    def add_item(self, sku, price, qty=1):
        if type(qty) is not int or qty <= 0 or money(price) < 0:
            raise ValueError("Invalid item")
        if sku in self.items:
            self.items[sku]["qty"] += qty
        else:
            self.items[sku] = {"price": price, "qty": qty}
    def remove_item(self, sku, qty=1):
        if type(qty) is not int or qty <= 0 or sku not in self.items or qty > self.items[sku]["qty"]:
            raise ValueError("Invalid removal")
        self.items[sku]["qty"] -= qty
        if self.items[sku]["qty"] == 0:
            del self.items[sku]
    def apply_coupon(self, code):
        if code not in COUPONS:
            raise ValueError("Unknown coupon")
        if code not in self.coupons:
            self.coupons.append(code)
    def subtotal(self):
        return sum((money(i["price"]) * i["qty"] for i in self.items.values()), Decimal(0))
    def total(self):
        if not self.items:
            return Decimal("0.00")
        amount = self.subtotal()
        codes = sorted(set(self.coupons))
        for code in codes:
            if "pct" in COUPONS[code]:
                amount = money(amount * (1 - Decimal(str(COUPONS[code]["pct"])) / 100))
        amount = max(Decimal(0), amount - sum((money(COUPONS[c]["fixed"]) for c in codes if "fixed" in COUPONS[c]), Decimal(0)))
        return money(amount + money(amount * Decimal("0.0825")) + (Decimal(0) if amount >= 50 else Decimal("5.99")))
'''
    checkout = 'from cart import Cart\nDEFAULT_CART = Cart()\ndef get_cart(session):\n    return session.get("cart", DEFAULT_CART)\n'
    checkout_fix = 'from cart import Cart\ndef get_cart(session):\n    if "cart" not in session:\n        session["cart"] = Cart()\n    return session["cart"]\n'
    cart_tests = '''
import unittest
from decimal import Decimal
from cart import Cart
from checkout import get_cart

class Tests(unittest.TestCase):
    def make(self, price=100, qty=1):
        c = Cart(); c.add_item("a", price, qty); return c
    def test_quantity_accumulates(self):
        c = self.make(10); c.add_item("a", 10, 2); self.assertEqual(c.items["a"]["qty"], 3)
    def test_removal_contract(self):
        c = self.make(10, 2)
        for sku, qty in [("a", 5), ("missing", 1), ("a", 0)]:
            with self.assertRaises(ValueError): c.remove_item(sku, qty)
        self.assertEqual(c.items["a"]["qty"], 2)
        c.remove_item("a", 2); self.assertNotIn("a", c.items)
    def test_coupon_deduplication(self):
        c = self.make(); c.apply_coupon("SAVE10"); before = c.total(); c.apply_coupon("SAVE10"); self.assertEqual(c.total(), before)
    def test_coupon_validation(self):
        with self.assertRaises(ValueError): self.make().apply_coupon("NOPE")
    def test_coupon_order(self):
        for codes in [("SAVE10", "FIVE"), ("FIVE", "SAVE10")]:
            c = self.make()
            for code in codes: c.apply_coupon(code)
            self.assertEqual(Decimal(str(c.total())), Decimal("92.01"))
    def test_shipping_boundary(self):
        self.assertEqual(Decimal(str(self.make(50).total())), Decimal("54.13"))
        c = self.make(50); c.apply_coupon("SAVE10"); self.assertEqual(Decimal(str(c.total())), Decimal("54.70"))
    def test_session_isolation(self):
        a, b = {}, {}; first = get_cart(a); first.add_item("x", 1)
        self.assertIs(get_cart(a), first); self.assertNotIn("x", get_cart(b).items)
    def test_money_rounding(self):
        self.assertEqual(Decimal(str(self.make(19.99, 3).total())), Decimal("64.92"))
        self.assertEqual(Decimal(str(self.make(0.02).total())), Decimal("6.01"))
    def test_empty_and_floor(self):
        self.assertEqual(Cart().total(), 0)
        c = self.make(1); c.apply_coupon("FIVE"); self.assertEqual(Decimal(str(c.total())), Decimal("5.99"))
    def test_constructor_isolation(self):
        items = {"a": {"price": 10, "qty": 2}}; c = Cart(items); c.remove_item("a"); self.assertEqual(items["a"]["qty"], 2)
'''
    challenge("shopping-cart", "shopping-cart-01", "The Cart That Charges the Wrong Amount", "Customers report duplicate promos, cent-level tax errors, lost quantities, inconsistent shipping, and carts leaking between sessions.", "Cart.add_item accumulates positive integer quantities; negative prices and invalid quantities raise ValueError. remove_item raises ValueError for missing SKUs, nonpositive quantities, or over-removal without mutation. Coupon codes SAVE10 (10%), SAVE20 (20%), and FIVE ($5) are validated and deduplicated. Apply percent coupons in code order before fixed discounts, rounding each percent step half-up to cents; clamp the discounted subtotal to zero. Tax is 8.25% of the discounted subtotal, rounded half-up per order. Shipping is free at a discounted subtotal >= $50; otherwise $5.99. Empty carts cost zero. Sessions and constructor inputs must not share mutable cart state. subtotal and total return numeric dollar amounts.", {"main.py": "from cart import Cart\nfrom checkout import get_cart\n", "cart.py": cart, "checkout.py": checkout, "discounts.py": 'COUPONS = {"SAVE10": {"pct": 10}, "SAVE20": {"pct": 20}, "FIVE": {"fixed": 5}}\n'}, cart_tests, {"cart.py": cart_fix, "checkout.py": checkout_fix})

    pagination = '''
from cursors import encode_cursor, decode_cursor
def list_transactions(db, account_id, limit=10, cursor=None):
    rows = sorted([r for r in db if r["account_id"] == account_id], key=lambda r: r["created_at"], reverse=True)
    if cursor:
        boundary = decode_cursor(cursor)
        rows = [r for r in rows if r["created_at"].replace(tzinfo=None) < boundary]
    page = rows[:limit]
    more = len(rows) > limit
    return {"data": page, "has_more": more, "next_cursor": encode_cursor(page[-1]["created_at"]) if more else None}
'''
    cursors = '''
import base64
from datetime import datetime
def encode_cursor(ts):
    return base64.b64encode(str(int(ts.timestamp())).encode()).decode()
def decode_cursor(value):
    return datetime.fromtimestamp(int(base64.b64decode(value)))
'''
    pfix = '''
from cursors import encode_cursor, decode_cursor
def list_transactions(db, account_id, limit=10, cursor=None):
    if type(limit) is not int or not 1 <= limit <= 100:
        raise ValueError("Invalid limit")
    rows = sorted([r for r in db if r["account_id"] == account_id], key=lambda r: (r["created_at"], r["id"]), reverse=True)
    if cursor is not None:
        boundary = decode_cursor(cursor)
        rows = [r for r in rows if (r["created_at"], r["id"]) < boundary]
    page = rows[:limit]; more = len(rows) > limit
    return {"data": page, "has_more": more, "next_cursor": encode_cursor(page[-1]["created_at"], page[-1]["id"]) if more else None}
'''
    cfix = '''
import base64, json
from datetime import datetime, timezone
def encode_cursor(ts, identifier):
    return base64.b64encode(json.dumps([ts.astimezone(timezone.utc).isoformat(), identifier]).encode()).decode()
def decode_cursor(value):
    try:
        ts, identifier = json.loads(base64.b64decode(value, validate=True))
        parsed = datetime.fromisoformat(ts)
        if parsed.tzinfo is None or type(identifier) is not int:
            raise ValueError()
        return parsed.astimezone(timezone.utc), identifier
    except Exception as error:
        raise ValueError("Invalid cursor") from error
'''
    ptests = '''
import unittest
from datetime import datetime, timezone, timedelta
from transactions import list_transactions
class Tests(unittest.TestCase):
    def walk(self, rows, size):
        cursor = None; result = []
        for _ in range(40):
            page = list_transactions(rows, "a", size, cursor); result += page["data"]
            if not page["has_more"]:
                self.assertIsNone(page["next_cursor"]); return result
            self.assertTrue(page["next_cursor"]); cursor = page["next_cursor"]
        self.fail("Pagination did not terminate")
    def rows(self):
        t = datetime(2026, 1, 1, tzinfo=timezone.utc)
        return [{"id": i, "account_id": "a", "created_at": t + timedelta(microseconds=(i // 7) * 100)} for i in range(25)]
    def test_tied_timestamps(self):
        rows = self.rows(); actual = self.walk(rows, 10)
        self.assertEqual([r["id"] for r in actual], list(reversed(range(25))))
    def test_microsecond_precision(self):
        self.assertEqual(len(self.walk(self.rows(), 1)), 25)
    def test_stable_order(self):
        rows = self.rows(); self.assertEqual(self.walk(rows, 8), self.walk(list(reversed(rows)), 8))
    def test_utc_and_offset(self):
        rows = self.rows()
        for r in rows: r["created_at"] = r["created_at"].astimezone(timezone(timedelta(hours=5, minutes=30)))
        self.assertEqual(len(self.walk(rows, 6)), 25)
    def test_isolation_and_empty(self):
        self.assertEqual(list_transactions([], "a")["data"], [])
        self.assertEqual(list_transactions([{"id": 1, "account_id": "b", "created_at": datetime.now(timezone.utc)}], "a")["data"], [])
    def test_invalid_inputs(self):
        for limit in (0, -1, 101, True):
            with self.assertRaises(ValueError): list_transactions([], "a", limit)
        with self.assertRaises(ValueError): list_transactions(self.rows(), "a", cursor="not-a-cursor")
'''
    challenge("pagination", "transaction-pagination-01", "The Pagination Bug", "Transaction pages omit records from bulk imports and return unstable ordering.", "list_transactions takes a list of dicts with integer id, account_id, and aware created_at. Return data, has_more, next_cursor. Sort created_at DESC then id DESC, preserving microseconds and UTC instants. Cursors must preserve both keys. Never skip or duplicate account records. Limits are integers 1–100; malformed cursors raise ValueError. Cursor helpers may change to support composite keys.", {"transactions.py": pagination, "cursors.py": cursors}, ptests, {"transactions.py": pfix, "cursors.py": cfix})

    cache = '''
from collections import OrderedDict
import time
class TTLCache:
    def __init__(self, capacity, ttl, clock=time.time):
        self.capacity, self.ttl, self.clock = capacity, ttl, clock
        self.store = OrderedDict()
    def get(self, key):
        if key not in self.store: return None
        value, expires = self.store[key]
        if expires < self.clock(): return None
        return value
    def put(self, key, value):
        if len(self.store) >= self.capacity: self.store.popitem(last=True)
        self.store[key] = (value, self.clock() + self.ttl)
    def __len__(self):
        return len(self.store)
'''
    cachefix = '''
from collections import OrderedDict
import time
class TTLCache:
    def __init__(self, capacity, ttl, clock=time.time):
        if type(capacity) is not int or capacity < 1 or ttl <= 0: raise ValueError("Invalid cache configuration")
        self.capacity, self.ttl, self.clock = capacity, ttl, clock
        self.store = OrderedDict()
    def purge(self):
        now = self.clock()
        for key in list(self.store):
            if self.store[key][1] <= now: del self.store[key]
    def get(self, key):
        self.purge()
        if key not in self.store: return None
        self.store.move_to_end(key)
        return self.store[key][0]
    def put(self, key, value):
        self.purge()
        self.store[key] = (value, self.clock() + self.ttl)
        self.store.move_to_end(key)
        while len(self.store) > self.capacity: self.store.popitem(last=False)
    def __len__(self):
        self.purge(); return len(self.store)
'''
    flags = 'def is_enabled(cache, name, fetch):\n    value = cache.get(name)\n    if not value:\n        value = fetch(name); cache.put(name, value)\n    return value\n'
    cachetests = '''
import unittest
from ttl_lru import TTLCache
from client import is_enabled
class Tests(unittest.TestCase):
    def setUp(self):
        self.now = 0; self.c = TTLCache(2, 10, lambda: self.now)
    def test_lru(self):
        self.c.put("a", 1); self.c.put("b", 2); self.c.get("a"); self.c.put("c", 3)
        self.assertEqual(self.c.get("a"), 1); self.assertIsNone(self.c.get("b"))
    def test_expiry_boundary(self):
        self.c.put("a", 1); self.now = 10; self.assertIsNone(self.c.get("a")); self.assertEqual(len(self.c), 0)
    def test_len_purges(self):
        self.c.put("a", 1); self.now = 11; self.assertEqual(len(self.c), 0)
    def test_update_at_capacity(self):
        self.c.put("a", 1); self.c.put("b", 2); self.c.put("a", 3)
        self.assertEqual(self.c.get("b"), 2); self.assertEqual(self.c.get("a"), 3)
    def test_falsy_values(self):
        for value in (False, 0, ""):
            self.c.put("a", value)
            self.assertEqual(is_enabled(self.c, "a", lambda _: self.fail("Unexpected fetch")), value)
    def test_refresh_and_capacity(self):
        self.c.put("a", 1); self.now = 9; self.c.put("a", 2); self.now = 10
        self.assertEqual(self.c.get("a"), 2)
        for i in range(30): self.c.put(str(i), i)
        self.assertEqual(len(self.c), 2)
    def test_invalid_config(self):
        for capacity, ttl in [(0, 1), (-1, 1), (2, 0)]:
            with self.assertRaises(ValueError): TTLCache(capacity, ttl)
'''
    challenge("ttl-cache", "ttl-lru-cache-01", "The Broken TTL + LRU Cache", "Feature flags go stale, hot entries disappear, and false-valued flags are repeatedly fetched.", "TTLCache has positive integer capacity and positive TTL, with an injectable clock. Entries expire at expires_at <= now. Reads refresh recency, not TTL. Writes refresh TTL and recency. Updating a key must not evict another key. len counts only live entries; eviction removes the least recently used live key. None denotes a miss; stored flag values are non-None and may include False, 0, or an empty string.", {"ttl_lru.py": cache, "client.py": flags}, cachetests, {"ttl_lru.py": cachefix, "client.py": flags.replace('if not value:', 'if value is None:')})

    revenue = '''
from collections import defaultdict
def daily_revenue(orders, tz="America/Los_Angeles"):
    totals = defaultdict(float)
    for o in orders:
        day = o["created_at"].date()
        amount = o["price"] * o["qty"] * (1 - o["discount"])
        if o["status"] == "refunded": amount = -amount
        totals[day] += amount
    return {d: round(t, 2) for d, t in totals.items()}
'''
    rfix = '''
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP
from zoneinfo import ZoneInfo
def daily_revenue(orders, tz="America/Los_Angeles"):
    totals = defaultdict(lambda: Decimal(0)); zone = ZoneInfo(tz)
    for o in orders:
        day = o["created_at"].astimezone(zone).date()
        amount = (Decimal(str(o["price"])) * o["qty"] * (1 - Decimal(str(o["discount"])))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if o["status"] == "cancelled": amount = Decimal(0)
        elif o["status"] == "refunded": amount = -amount
        elif o["status"] == "partially_refunded": amount -= Decimal(str(o["refund_amount"])).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        totals[day] += amount
    return dict(totals)
'''
    rtests = '''
import unittest
from datetime import datetime, timezone, date
from decimal import Decimal
from revenue import daily_revenue
class Tests(unittest.TestCase):
    def order(self, **kw):
        return dict({"created_at": datetime(2026, 3, 9, 3, 30, tzinfo=timezone.utc), "price": 10, "qty": 1, "discount": 0, "status": "paid"}, **kw)
    def amount(self, orders):
        return Decimal(str(sum(daily_revenue(orders).values())))
    def test_local_day(self):
        self.assertEqual(list(daily_revenue([self.order()])), [date(2026, 3, 8)])
    def test_timezone_parameter(self):
        self.assertEqual(list(daily_revenue([self.order()], "UTC")), [date(2026, 3, 9)])
    def test_decimal_accumulation(self):
        self.assertEqual(self.amount([self.order(price=0.1) for _ in range(10)]), Decimal("1.00"))
    def test_half_up_per_order(self):
        self.assertEqual(self.amount([self.order(price=0.025), self.order(price=0.025)]), Decimal("0.06"))
        self.assertEqual(self.amount([self.order(price=10.05, qty=3, discount=0.15)]), Decimal("25.63"))
    def test_cancelled(self):
        self.assertEqual(self.amount([self.order(status="cancelled")]), 0)
    def test_partial_refund(self):
        self.assertEqual(self.amount([self.order(status="partially_refunded", refund_amount=3.25)]), Decimal("6.75"))
    def test_refunded(self):
        self.assertEqual(self.amount([self.order(status="refunded")]), -10)
    def test_dst_and_month_boundary(self):
        for stamp, expected in [("2026-03-08T09:30:00+00:00", date(2026,3,8)), ("2026-03-08T10:30:00+00:00", date(2026,3,8)), ("2026-11-01T08:30:00+00:00", date(2026,11,1)), ("2026-11-01T09:30:00+00:00", date(2026,11,1)), ("2026-04-01T01:00:00+00:00", date(2026,3,31))]:
            self.assertEqual(list(daily_revenue([self.order(created_at=datetime.fromisoformat(stamp))])), [expected])
'''
    challenge("revenue-report", "daily-revenue-01", "The Wrong Revenue Report", "Finance sees cent-level discrepancies and orders booked to the wrong day around month-end and DST.", "daily_revenue groups aware timestamps by the requested IANA timezone (default America/Los_Angeles). Convert money using Decimal(str(value)). Round each order's discounted gross half-up to cents before aggregation. paid contributes gross; refunded contributes negative gross; cancelled contributes zero; partially_refunded contributes gross minus refund_amount (already a dollar amount). Return a mapping from date to numeric dollars, including zero-total days encountered in input.", {"revenue.py": revenue}, rtests, {"revenue.py": rfix})

    build_reservations()
    build_worker()
    target = ROOT / "tests" / "fixtures" / "repo_solutions.json"
    target.parent.mkdir(exist_ok=True)
    target.write_text(json.dumps(SOLUTIONS, indent=2) + "\n", encoding="utf-8")


def build_reservations():
    database = '''
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
'''
    reservations = '''
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
'''
    expiry = '''
import time
def expire_holds(db, now):
    with db.connect() as c:
        rows = c.execute("SELECT * FROM reservations WHERE status='held' AND expires_at<=?", (now,)).fetchall()
        for r in rows:
            time.sleep(0.002)
            c.execute("UPDATE events SET available=available+? WHERE id=?", (r["qty"],r["event_id"]))
            c.execute("UPDATE reservations SET status='expired' WHERE id=?", (r["id"],))
'''
    fixed = '''
class SoldOut(Exception): pass
def reserve_seats(db, event_id, user_id, qty, idempotency_key, now=0):
    if type(qty) is not int or qty <= 0 or not idempotency_key: raise ValueError("Invalid reservation")
    with db.transaction() as c:
        existing = c.execute("SELECT * FROM reservations WHERE idempotency_key=?", (idempotency_key,)).fetchone()
        if existing:
            if (existing["event_id"],existing["user_id"],existing["qty"]) != (event_id,user_id,qty): raise ValueError("Conflicting idempotency key")
            return dict(existing)
        if not c.execute("UPDATE events SET available=available-? WHERE id=? AND available>=?", (qty,event_id,qty)).rowcount: raise SoldOut()
        result = c.execute("INSERT INTO reservations(event_id,user_id,qty,status,expires_at,idempotency_key) VALUES(?,?,?,'held',?,?)", (event_id,user_id,qty,now+600,idempotency_key))
        return dict(c.execute("SELECT * FROM reservations WHERE id=?", (result.lastrowid,)).fetchone())
'''
    efixed = '''
def expire_holds(db, now):
    with db.transaction() as c:
        rows = c.execute("SELECT * FROM reservations WHERE status='held' AND expires_at<=?", (now,)).fetchall()
        for r in rows:
            if c.execute("UPDATE reservations SET status='expired' WHERE id=? AND status='held'", (r["id"],)).rowcount:
                c.execute("UPDATE events SET available=available+? WHERE id=?", (r["qty"],r["event_id"]))
'''
    tests = '''
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
'''
    challenge("reservations", "seat-reservations-01", "The Oversold Event", "Concurrent seat holds oversell events, mobile retries duplicate bookings, and expiry workers release inventory twice.", "Use the provided SQLite Database. reserve_seats returns a reservation dict; exactly the available number of concurrent requests may succeed, with SoldOut otherwise. Hold expiry is now+600 seconds. Positive integer quantities and nonempty keys are required. Replaying a key with identical event/user/qty returns the same reservation; conflicting reuse raises ValueError. Inventory decrement and reservation insertion must be one database transaction with rollback on failure. expire_holds releases held reservations at expires_at <= now exactly once, even with concurrent workers. Do not replace database transactions with process-local locks.", {"reservations.py": reservations, "expire_holds.py": expiry}, tests, {"reservations.py": fixed, "expire_holds.py": efixed}, readonly={"database.py": database})


def build_worker():
    starter = '''
const RETRY_DEFAULTS = { retries: 3, delay: 0 };
async function withRetry(fn, opts = RETRY_DEFAULTS) {
  while (opts.retries > 0) {
    try { return await fn(); }
    catch (error) { opts.retries--; await new Promise(r => setTimeout(r, opts.delay)); opts.delay *= 2; }
  }
}
async function processBatch(jobs, queue, deliverWebhook, concurrency = 2) {
  const results = [];
  jobs.forEach(async job => {
    await queue.ack(job.id);
    const res = await withRetry(() => deliverWebhook(job.payload));
    results.push({ id: job.id, res });
  });
  return results;
}
module.exports = { withRetry, processBatch, RETRY_DEFAULTS };
'''
    fixed = '''
const RETRY_DEFAULTS = Object.freeze({ retries: 3, delay: 0 });
async function withRetry(fn, opts = RETRY_DEFAULTS) {
  const { retries = 3, delay = 0 } = opts;
  if (!Number.isInteger(retries) || retries < 1 || delay < 0) throw new RangeError('Invalid retry options');
  for (let attempt = 0; attempt < retries; attempt++) {
    try { return await fn(); }
    catch (error) {
      const retryable = error.status == null || error.status === 429 || error.status >= 500;
      if (!retryable || attempt + 1 === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * 2 ** attempt));
    }
  }
}
async function processBatch(jobs, queue, deliverWebhook, concurrency = 2) {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new RangeError('Invalid concurrency');
  const results = new Array(jobs.length); let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const index = next++; const job = jobs[index]; let res;
      try { res = await withRetry(() => deliverWebhook(job.payload)); }
      catch (error) {
        await queue.deadLetter(job, error);
        await queue.ack(job.id);
        results[index] = { id: job.id, error: error.message }; continue;
      }
      await queue.ack(job.id);
      results[index] = { id: job.id, res };
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
  return results;
}
module.exports = { withRetry, processBatch, RETRY_DEFAULTS };
'''
    tests = '''
const assert = require('node:assert/strict');
const {withRetry, processBatch, RETRY_DEFAULTS} = require('./processor.js');
const jobs = Array.from({length:5}, (_, i) => ({id:i,payload:i}));
const queue = () => ({ack:async()=>{},deadLetter:async()=>{}});
exports.test_batch_waits = async () => {
  const result = await processBatch(jobs,queue(),async x => {await new Promise(r=>setTimeout(r,1));return x*2;});
  assert.equal(result.length,5); assert.deepEqual(result.map(r=>r.res),[0,2,4,6,8]);
};
exports.test_ack_after_delivery = async () => {
  const events=[];const q={ack:async id=>events.push('ack'),deadLetter:async()=>{}};
  await processBatch([jobs[0]],q,async()=>{events.push('deliver');return true;});assert.deepEqual(events,['deliver','ack']);
};
exports.test_retry_defaults_immutable = async () => {
  for(let i=0;i<2;i++){let count=0;await assert.rejects(()=>withRetry(async()=>{count++;throw Error('down');}));assert.equal(count,3);}
  assert.deepEqual(RETRY_DEFAULTS,{retries:3,delay:0});
};
exports.test_retry_policy = async () => {
  for (const status of [400,401,404,429,500]) {let count=0;await assert.rejects(()=>withRetry(async()=>{count++;throw Object.assign(Error('failure'),{status});},{retries:3,delay:0}));assert.equal(count,status===429||status>=500?3:1);}
};
exports.test_dead_letter_before_ack = async () => {
  const events=[];let attempts=0;const q={ack:async()=>events.push('ack'),deadLetter:async()=>events.push('dead')};
  const result=await processBatch([jobs[0]],q,async()=>{attempts++;throw Object.assign(Error('down'),{status:500});});
  assert.equal(attempts,3);assert.deepEqual(events,['dead','ack']);assert.equal(result[0].error,'down');
};
exports.test_concurrency_cap = async () => {
  let active=0,max=0;await processBatch(jobs,queue(),async()=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,2));active--;return true;},2);assert.equal(active,0);assert.ok(max<=2);
};
exports.test_dead_letter_failure_unacked = async () => {
  let acked=false;const q={ack:async()=>{acked=true;},deadLetter:async()=>{throw Error('storage down');}};
  await assert.rejects(()=>processBatch([jobs[0]],q,async()=>{throw Object.assign(Error('bad'),{status:400});}));assert.equal(acked,false);
};
exports.test_custom_options_unchanged = async () => {
  const opts={retries:2,delay:0};await assert.rejects(()=>withRetry(async()=>{throw Error('down');},opts));assert.deepEqual(opts,{retries:2,delay:0});
};
'''
    challenge("webhook-worker", "webhook-worker-01", "The Lossy Job Worker", "Webhook jobs disappear after crashes, batches return early, and retry settings leak between deliveries.", "Node/CommonJS. withRetry(fn, opts) makes at most opts.retries total attempts (default 3), with exponential backoff from opts.delay milliseconds (default 0 for this exercise). Never mutate options. Retry network errors (no status), 429 and 5xx; immediately rethrow other HTTP errors. Exhaustion rethrows the last error. processBatch(jobs, queue, deliverWebhook, concurrency=2) awaits every job with a concurrency cap and preserves input order. Success yields {id,res}; exhausted/permanent delivery failure must be durably dead-lettered before acknowledgment and yields {id,error:message}. A failed dead-letter write or acknowledgment rejects the batch without treating the job as delivered. queue supplies async ack(id) and deadLetter(job,error). Delivery must be idempotent in a real at-least-once system.", {"processor.js": starter}, tests, {"processor.js": fixed}, language="javascript")


if __name__ == "__main__":
    build()
