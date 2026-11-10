# The Dashboard That Mixes Sensor Readings (C++)

A sensor dashboard includes stale/future readings and leaks one device's samples into another device's average.

window_average(rows,device,now,window) returns the arithmetic mean for that device at timestamps in (now-window,now], or None/nullopt if no matching readings. Require positive window. Input readings have device, time, value; zero and negative values are valid. C++ Reading has string device and double time/value. Never mutate rows.

Edit solution.hpp. Read-only tests show the public interface. Run Tests compiles and runs the repository in the C++ sandbox.
