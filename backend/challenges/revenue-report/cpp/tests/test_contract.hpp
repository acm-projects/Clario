#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("AssertionError: expected true, received false");}
inline void near(double a,double b){if(!(abs(a-b)<0.000001))throw runtime_error("Expected " + to_string(b) + ", received " + to_string(a));}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_cancelled", []{auto r=daily_revenue({{1773027000,10,1,0,"cancelled"}});require(r.size()==1);near(r.begin()->second,0);}},
{"test_decimal_accumulation", []{vector<Order> rows(10,Order{1773027000,0.1L});near(daily_revenue(rows).begin()->second,1);}},
{"test_dst_and_month_boundary", []{for(auto row:vector<pair<long long,string>>{{1772962200,"2026-03-08"},{1772965800,"2026-03-08"},{1793521800,"2026-11-01"},{1793525400,"2026-11-01"},{1775005200,"2026-03-31"}})require(daily_revenue({{row.first,10}}).begin()->first==row.second);}},
{"test_half_up_per_order", []{near(daily_revenue({{1773027000,0.025L},{1773027000,0.025L}}).begin()->second,0.06);near(daily_revenue({{1773027000,10.05L,3,0.15L}}).begin()->second,25.63);}},
{"test_local_day", []{auto r=daily_revenue({{1773027000,10}});require(r.begin()->first=="2026-03-08");}},
{"test_partial_refund", []{near(daily_revenue({{1773027000,10,2,0,"partially_refunded",3.25L}}).begin()->second,16.75);}},
{"test_refunded", []{near(daily_revenue({{1773027000,10,1,0,"refunded"}}).begin()->second,-10);}},
{"test_timezone_parameter", []{auto r=daily_revenue({{1773027000,10}},"UTC");require(r.begin()->first=="2026-03-09");}}
};}
