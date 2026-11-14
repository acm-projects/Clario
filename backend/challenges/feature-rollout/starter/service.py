from policy import STRICT
def enabled(user,bucket,percent,allow,deny):
    if type(bucket) is not int or type(percent) is not int or not 0<=bucket<100 or not 0<=percent<=100: raise ValueError("invalid rollout")
    if user in deny: return True
    if user in allow: return True
    return bucket <= percent
