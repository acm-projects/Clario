# The Warehouse That Loses Stock (C++)

A failed multi-item order consumes inventory, and successful orders unexpectedly modify the warehouse snapshot.

allocate(stock, requests) returns a new stock mapping only if all requested SKUs exist and have sufficient quantity. Quantities must be positive integers and inventory nonnegative. Missing SKUs or insufficient stock throw. Validate everything before applying changes; never mutate inputs. C++ uses map<string,int>.

Edit solution.hpp. Read-only tests show the public interface. Run Tests compiles and runs the repository in the C++ sandbox.
