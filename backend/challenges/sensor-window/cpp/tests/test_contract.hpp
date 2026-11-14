#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("AssertionError: expected true, received false");}
inline void near(double a,double b){if(!(abs(a-b)<0.000001))throw runtime_error("Expected " + to_string(b) + ", received " + to_string(a));}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_boundaries", []{near(*window_average({{"a",0,100},{"a",1,10},{"a",10,20},{"a",11,100}},"a",10,10),15);}},
{"test_device_isolation", []{near(*window_average({{"a",5,10},{"b",5,100}},"a",10,10),10);}},
{"test_empty_and_invalid", []{require(!window_average({},"a",10,10));throws([]{window_average({},"a",10,0);});}},
{"test_zero_and_negative", []{near(*window_average({{"a",5,0},{"a",5,-4}},"a",10,10),-2);}}
};}
