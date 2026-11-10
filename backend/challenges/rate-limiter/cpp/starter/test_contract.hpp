#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("Contract check failed");}
inline void near(double a,double b){require(abs(a-b)<0.000001);}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_account_isolation", []{RateLimiter r(1,10);require(r.allow("a",0)&&r.allow("b",0));}},
{"test_invalid_config_and_time", []{throws([]{RateLimiter r(0,1);});RateLimiter r(1,10);r.allow("a",3);throws([&]{r.allow("a",2);});}},
{"test_rejection_does_not_extend", []{RateLimiter r(1,10);r.allow("a",0);require(!r.allow("a",9)&&r.allow("a",10));}},
{"test_window_boundary", []{RateLimiter r(1,10);r.allow("a",0);require(r.allow("a",10));}}
};}
