from policy import STRICT
def can_access(roles, assigned, permission):
    visiting=set(); visited=set(); allowed=False; denied=False
    def visit(name):
        nonlocal allowed,denied
        if name in visiting: return
        if name in visited: return
        if name not in roles: raise ValueError("unknown role")
        visiting.add(name); role=roles[name]
        allowed=allowed or permission in role["allow"]
        denied=denied or permission in role["deny"]
        for parent in role["parents"]: visit(parent)
        visiting.remove(name); visited.add(name)
    for name in assigned: visit(name)
    return allowed
