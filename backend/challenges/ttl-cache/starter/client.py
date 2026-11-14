def is_enabled(cache, name, fetch):
    value = cache.get(name)
    if not value:
        value = fetch(name); cache.put(name, value)
    return value
