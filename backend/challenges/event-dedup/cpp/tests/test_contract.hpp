#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("AssertionError: expected true, received false");}
inline void near(double a,double b){if(!(abs(a-b)<0.000001))throw runtime_error("Expected " + to_string(b) + ", received " + to_string(a));}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_invalid_empty_and_copy", []{require(latest_events({}).empty());throws([]{latest_events({{"",1,"x"}});});vector<Event> rows={{"a",1,"x"}};auto out=latest_events(rows);out[0].value="changed";require(rows[0].value=="x");}},
{"test_latest_and_stale", []{require(latest_events({{"a",2,"new"},{"a",1,"old"}})[0].value=="new");}},
{"test_sorted_output", []{auto rows=latest_events({{"z",1,"z"},{"a",1,"a"},{"m",1,"m"}});require(rows[0].id=="a"&&rows[1].id=="m"&&rows[2].id=="z");}},
{"test_ties_keep_first", []{require(latest_events({{"a",2,"first"},{"a",2,"second"}})[0].value=="first");}}
};}
