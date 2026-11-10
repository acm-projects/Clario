# The Wrong Revenue Report (C++)

Finance sees cent-level discrepancies and orders booked to the wrong day around month-end and DST.

Order.created_at is UTC epoch seconds. Use the supplied read-only local_day helper for timezone conversion, including DST; it supports UTC and America/Los_Angeles for this exercise. Money uses long double input and integer cents; half-up round each discounted order before aggregation. Refund amounts are already dollars. Include zero-total input days. This port narrows the Python IANA timezone interface to the supplied helper's two documented zones.

Edit solution.hpp. Read-only tests show the public interface. Run Tests compiles and runs the repository in the C++ sandbox.
