"""Bounded in-process caches for public, reusable question data only."""
from collections import OrderedDict
from copy import deepcopy
from functools import wraps
from threading import Condition
from time import monotonic


def cache_for(seconds: float, maxsize: int = 128):
    def decorate(function):
        values = OrderedDict()
        pending = set()
        changed = Condition()

        @wraps(function)
        def cached(*args, **kwargs):
            key = (args, tuple(sorted(kwargs.items())))
            with changed:
                while key in pending:
                    changed.wait()
                found = values.get(key)
                if found is not None and found[0] > monotonic():
                    values.move_to_end(key)
                    return deepcopy(found[1])
                values.pop(key, None)
                pending.add(key)
            try:
                result = function(*args, **kwargs)
                with changed:
                    values[key] = (monotonic() + seconds, deepcopy(result))
                    while len(values) > maxsize:
                        values.popitem(last=False)
                return result
            finally:
                with changed:
                    pending.discard(key)
                    changed.notify_all()

        def clear():
            with changed:
                values.clear()
        cached.cache_clear = clear
        return cached
    return decorate
