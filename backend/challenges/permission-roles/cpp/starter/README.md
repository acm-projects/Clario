# The Role Resolver That Grants Too Much (C++)

Inherited denies are ignored and circular role inheritance causes inconsistent authorization decisions.

can_access(roles,assigned,permission) traverses assigned roles and all parents. Any explicit deny wins over any allow; no matching allow means false. Unknown roles and reachable inheritance cycles throw. Duplicate roles are harmless; evaluate the whole reachable graph even when an allow is found. Python Role dicts contain parents/allow/deny lists; C++ Role has vector<string> parents,allow,deny. Never mutate inputs.

Edit solution.hpp. Read-only tests show the public interface. Run Tests compiles and runs the repository in the C++ sandbox.
