#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("Contract check failed");}
inline void near(double a,double b){require(abs(a-b)<0.000001);}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_failed_request_atomicity", []{Ledger l({{"a",100},{"b",0}});throws([&]{l.transfer("k","a","b",200);});l.transfer("k","a","b",100);require(l.balances.at("a")==0&&l.balances.at("b")==100);}},
{"test_idempotency_and_conflict", []{Ledger l({{"a",1000},{"b",0}});l.transfer("k","a","b",100);l.transfer("k","a","b",100);require(l.balances.at("a")==900);throws([&]{l.transfer("k","a","b",200);});}},
{"test_input_isolation_and_validation", []{map<string,long long> b={{"a",5},{"b",0}};Ledger l(b);throws([&]{l.transfer("k","a","a",1);});throws([&]{l.transfer("","a","b",1);});throws([&]{l.transfer("k","a","b",0);});require(b.at("a")==5);}},
{"test_transfer_and_conservation", []{Ledger l({{"a",1000},{"b",100}});l.transfer("k","a","b",200);require(l.balances.at("a")==800&&l.balances.at("b")==300);}}
};}
