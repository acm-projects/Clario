from policy import STRICT
import re
def search(documents,query):
    tokens=lambda text: re.findall(r"[a-z0-9]+",text.lower())
    words=set(tokens(query)); seen=set(); scored=[]
    for doc in documents:
        if not doc["id"] or doc["id"] in seen: raise ValueError("duplicate or empty id")
        seen.add(doc["id"]); body=tokens(doc["text"])
        if words and any(word in body for word in words): scored.append((-sum(body.count(w) for w in words),doc["id"]))
    return [identifier for _,identifier in scored]
