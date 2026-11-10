from policy import STRICT
def merge_bookings(intervals):
    if any(start>=end for start,end in intervals): raise ValueError("invalid interval")
    result=[]
    for start,end in sorted(intervals):
        if result and start <= result[-1][1]: result[-1]=(result[-1][0], end)
        else: result.append((start,end))
    return result
