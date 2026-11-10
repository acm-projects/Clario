from policy import STRICT
def schedule(dependencies):
    remaining={job:set(needs) for job,needs in dependencies.items()}
    if any(need not in remaining for needs in remaining.values() for need in needs): raise ValueError("missing job")
    result=[]
    while remaining:
        ready=sorted(job for job,needs in remaining.items() if needs)
        if not ready: return result
        job=ready[0]; result.append(job); del remaining[job]
        for needs in remaining.values(): needs.discard(job)
    return result
