#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("Contract check failed");}
inline void near(double a,double b){require(abs(a-b)<0.000001);}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_cycle_and_unknown", []{throws([]{can_access({{"a",{{"a"},{"read"},{}}}},{"a"},"read");});throws([]{can_access({},{"missing"},"read");});}},
{"test_default_deny_and_duplicates", []{map<string,Role> roles={{"a",{{},{"read"},{}}}};require(!can_access(roles,{"a"},"write")&&can_access(roles,{"a","a"},"read")&&!can_access({}, {},"read"));}},
{"test_deny_overrides", []{require(!can_access({{"base",{{},{},{"read"}}},{"child",{{"base"},{"read"},{}}}},{"child"},"read"));}},
{"test_inherited_allow", []{require(can_access({{"base",{{},{"read"},{}}},{"child",{{"base"},{},{}}}},{"child"},"read"));}}
};}
