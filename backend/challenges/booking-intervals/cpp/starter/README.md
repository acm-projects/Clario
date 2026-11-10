# The Calendar That Merges Separate Meetings (C++)

Adjacent meetings disappear into one booking and unsorted imports produce overlapping blocks.

merge_bookings(intervals) sorts and merges overlapping half-open [start,end) intervals, keeping touching intervals separate. Require start < end. Preserve caller input; empty input returns empty. C++ uses vector<pair<int,int>>.

Edit solution.hpp. Read-only tests show the public interface. Run Tests compiles and runs the repository in the C++ sandbox.
