#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("AssertionError: expected true, received false");}
inline void near(double a,double b){if(!(abs(a-b)<0.000001))throw runtime_error("Expected " + to_string(b) + ", received " + to_string(a));}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_invalid_and_empty", []{require(!match_route("/x",{}));throws([]{match_route("x",{});});throws([]{match_route("/x",{{"bad","x"}});});}},
{"test_longest_prefix", []{require(match_route("/api/users/42",{{"/","root"},{"/api","api"},{"/api/users","users"}})=="users");}},
{"test_query_and_trailing", []{require(match_route("/api?debug=1",{{"/api/","api"}})=="api");}},
{"test_segment_boundary", []{require(!match_route("/apiculture",{{"/api","api"}}));}}
};}
