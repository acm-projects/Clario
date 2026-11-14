#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("Contract check failed");}
inline void near(double a,double b){require(abs(a-b)<0.000001);}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_allow_overrides_zero", []{require(enabled("a",99,0,{"a"},{}));}},
{"test_deny_wins", []{require(!enabled("a",0,100,{"a"},{"a"}));}},
{"test_invalid_and_no_mutation", []{vector<string>a={"x"},d={"y"};enabled("a",1,50,a,d);require(a==vector<string>({"x"})&&d==vector<string>({"y"}));throws([]{enabled("a",100,20,{},{});});}},
{"test_rollout_boundary", []{require(!enabled("a",20,20,{},{})&&enabled("a",19,20,{},{})&&!enabled("a",0,0,{},{}));}}
};}
