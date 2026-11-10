#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("AssertionError: expected true, received false");}
inline void near(double a,double b){if(!(abs(a-b)<0.000001))throw runtime_error("Expected " + to_string(b) + ", received " + to_string(a));}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_exact_stock", []{require(allocate({{"a",2}},{{"a",2}}).at("a")==0);}},
{"test_failure_atomicity", []{map<string,int> stock={{"a",5}};throws([&]{allocate(stock,{{"a",2},{"missing",1}});});require(stock.at("a")==5);}},
{"test_invalid_quantities", []{for(int n:{0,-1})throws([&]{allocate({{"a",5}},{{"a",n}});});}},
{"test_no_input_mutation", []{map<string,int> stock={{"a",5}};require(allocate(stock,{{"a",2}}).at("a")==3&&stock.at("a")==5);}}
};}
