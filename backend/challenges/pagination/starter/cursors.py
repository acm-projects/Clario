import base64
from datetime import datetime
def encode_cursor(ts):
    return base64.b64encode(str(int(ts.timestamp())).encode()).decode()
def decode_cursor(value):
    return datetime.fromtimestamp(int(base64.b64decode(value)))
