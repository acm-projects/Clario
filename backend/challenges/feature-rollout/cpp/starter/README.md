# The Feature Flag That Ignores Opt-Outs (C++)

Customers who explicitly opted out still receive a new feature, while allowlisted customers are blocked by rollout percentages.

enabled(user,bucket,percent,allow,deny) validates percent in 0..100 and bucket in 0..99. Deny overrides allow; allow overrides percentage. Other users are enabled exactly when bucket < percent. Inputs are immutable. C++ uses vector<string> allow/deny and integer bucket/percent.

Edit solution.hpp. Read-only tests show the public interface. Run Tests compiles and runs the repository in the C++ sandbox.
