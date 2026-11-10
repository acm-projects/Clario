from policy import STRICT
def match_route(path,routes):
    path=path.split("?",1)[0]
    if not path.startswith("/"): raise ValueError("absolute path required")
    candidates=[]
    for prefix,handler in routes.items():
        if not prefix.startswith("/"): raise ValueError("absolute prefix required")
        prefix=prefix.rstrip("/") or "/"
        if prefix=="/" or path==prefix or path.startswith(prefix): candidates.append((len(prefix),prefix,handler))
    return min(candidates)[2] if candidates else None
