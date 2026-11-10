# The Dashboard That Mixes Sensor Readings

A sensor dashboard includes stale/future readings and leaks one device's samples into another device's average.

window_average(rows,device,now,window) returns the arithmetic mean for that device at timestamps in (now-window,now], or None/nullopt if no matching readings. Require positive window. Input readings have device, time, value; zero and negative values are valid. C++ Reading has string device and double time/value. Never mutate rows.

Start in service.py; policy.py records the shared mutation policy. Tests are read-only.
