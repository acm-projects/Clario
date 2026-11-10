# The Calendar That Merges Separate Meetings

Adjacent meetings disappear into one booking and unsorted imports produce overlapping blocks.

merge_bookings(intervals) sorts and merges overlapping half-open [start,end) intervals, keeping touching intervals separate. Require start < end. Preserve caller input; empty input returns empty. C++ uses vector<pair<int,int>>.

Start in service.py; policy.py records the shared mutation policy. Tests are read-only.
