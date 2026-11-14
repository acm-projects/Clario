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
