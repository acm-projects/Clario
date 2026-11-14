#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("AssertionError: expected true, received false");}
inline void near(double a,double b){if(!(abs(a-b)<0.000001))throw runtime_error("Expected " + to_string(b) + ", received " + to_string(a));}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_all_terms_and_whole_words", []{require(search({{"a","cart checkout"},{"b","cart"},{"c","cartwheel checkout"}},"cart checkout")==vector<string>({"a"}));}},
{"test_case_and_duplicates_in_query", []{require(search({{"a","Blue-duck DUCK"}},"DUCK duck blue")==vector<string>({"a"}));}},
{"test_empty_and_invalid_ids", []{require(search({},"duck").empty()&&search({{"a","duck"}},"").empty());throws([]{search({{"a","x"},{"a","y"}},"x");});}},
{"test_ranking_and_ties", []{require(search({{"z","duck"},{"a","duck"},{"b","duck duck"}},"duck")==vector<string>({"b","a","z"}));}}
};}
