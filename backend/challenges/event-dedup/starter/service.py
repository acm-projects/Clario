from policy import STRICT
def latest_events(rows):
    latest={}
    for row in rows:
        if not row["id"] or row["version"]<0: raise ValueError("invalid event")
        if row["id"] not in latest or row["version"]>=latest[row["id"]]["version"]: latest[row["id"]]=dict(row)
    return [latest[key] for key in latest]
