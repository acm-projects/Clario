# The Scheduler That Runs Jobs Too Soon (C++)

Deployment jobs sometimes run before their prerequisites, and circular pipelines silently produce partial schedules.

schedule(dependencies) returns each job once, after all prerequisites, picking the lexicographically smallest ready job each step. Every dependency must be a declared job. Duplicate dependency entries count once. Cycles and missing jobs throw; empty input returns empty. Never mutate the dependency graph. C++ uses map<string,vector<string>>.

Edit solution.hpp. Read-only tests show the public interface. Run Tests compiles and runs the repository in the C++ sandbox.
