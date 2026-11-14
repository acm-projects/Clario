# The Feature Flag That Ignores Opt-Outs

Customers who explicitly opted out still receive a new feature, while allowlisted customers are blocked by rollout percentages.

enabled(user,bucket,percent,allow,deny) validates percent in 0..100 and bucket in 0..99. Deny overrides allow; allow overrides percentage. Other users are enabled exactly when bucket < percent. Inputs are immutable. C++ uses vector<string> allow/deny and integer bucket/percent.

Start in service.py; policy.py records the shared mutation policy. Tests are read-only.
