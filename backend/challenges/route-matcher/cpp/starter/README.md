# The Router That Sends Users to the Wrong Service (C++)

The /api route captures /apiculture, and a generic route steals traffic from a more specific service.

match_route(path,routes) returns the handler of the longest matching prefix at a path-segment boundary, or None/nullopt. / matches all absolute paths. Strip query strings from the request; ignore trailing slashes on prefixes except root. Require absolute request/prefix paths. C++ routes is map<string,string>. Inputs stay unchanged.

Edit solution.hpp. Read-only tests show the public interface. Run Tests compiles and runs the repository in the C++ sandbox.
