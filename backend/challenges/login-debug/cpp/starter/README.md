# Login Authentication Debugging (C++)

The demo app rejects some valid logins and accepts some invalid ones. Trace the request flow and repair its authentication logic.

login/authenticate accept optional<string>. Nullopt represents invalid/missing input. Normalize usernames only; passwords are exact and only active users may log in. Do not change USERS.

Edit solution.hpp. Read-only tests show the public interface. Run Tests compiles and runs the repository in the C++ sandbox.
