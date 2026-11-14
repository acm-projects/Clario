#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("Contract check failed");}
inline void near(double a,double b){require(abs(a-b)<0.000001);}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_cumulative_limit", []{RefundLedger r(1000);r.refund("a",600);throws([&]{r.refund("b",500);});require(r.total==600);}},
{"test_failed_key_and_validation", []{RefundLedger r(100);throws([&]{r.refund("key",200);});require(r.refund("key",100)==100);throws([&]{r.refund("",1);});}},
{"test_partial_and_exact", []{RefundLedger r(1000);require(r.refund("a",400)==400&&r.refund("b",600)==1000);}},
{"test_retry_and_conflict", []{RefundLedger r(1000);r.refund("a",200);require(r.refund("a",200)==200);throws([&]{r.refund("a",300);});}}
};}
