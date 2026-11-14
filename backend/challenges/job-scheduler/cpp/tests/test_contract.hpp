#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("AssertionError: expected true, received false");}
inline void near(double a,double b){if(!(abs(a-b)<0.000001))throw runtime_error("Expected " + to_string(b) + ", received " + to_string(a));}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_cycles_and_missing", []{throws([]{schedule({{"a",{"a"}}});});throws([]{schedule({{"a",{"missing"}}});});}},
{"test_dependency_order", []{require(schedule({{"deploy",{"build"}},{"build",{}}})==vector<string>({"build","deploy"}));}},
{"test_empty_and_immutable", []{map<string,vector<string>> g={{"a",{}},{"b",{"a"}}};auto before=g;schedule(g);require(g==before&&schedule({}).empty());}},
{"test_lexical_and_duplicates", []{require(schedule({{"c",{"a","a"}},{"b",{}},{"a",{}}})==vector<string>({"a","b","c"}));}}
};}
