#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("Contract check failed");}
inline void near(double a,double b){require(abs(a-b)<0.000001);}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_invalid_empty_and_immutable", []{vector<pair<int,int>> rows={{3,4},{1,2}};auto old=rows;merge_bookings(rows);require(rows==old&&merge_bookings({}).empty());throws([]{merge_bookings({{1,1}});});}},
{"test_nested", []{require(merge_bookings({{1,10},{2,3},{4,5}})==vector<pair<int,int>>({{1,10}}));}},
{"test_overlapping_unsorted", []{require(merge_bookings({{5,9},{1,6}})==vector<pair<int,int>>({{1,9}}));}},
{"test_touching_separate", []{require(merge_bookings({{1,3},{3,5}})==vector<pair<int,int>>({{1,3},{3,5}}));}}
};}
