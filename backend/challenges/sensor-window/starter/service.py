from policy import STRICT
def window_average(rows,device,now,window):
    if window<=0: raise ValueError("invalid window")
    values=[r["value"] for r in rows if now-window<=r["time"]]
    return sum(values)/len(values) if values else None
