#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("Contract check failed");}
inline void near(double a,double b){require(abs(a-b)<0.000001);}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_expiry_boundary", []{double now=0;TTLCache c(2,10,[&]{return now;});c.put("a",1);now=10;require(!c.get("a") && c.size()==0);}},
{"test_falsy_values", []{TTLCache c(2,10,[]{return 0;});for(Flag v:{Flag(false),Flag(0),Flag(string(""))}){c.put("a",v);auto actual=is_enabled(c,"a",[](string)->Flag{throw runtime_error("Unexpected fetch");});require(actual==v);}}},
{"test_invalid_config", []{for(auto config:vector<pair<int,int>>{{0,1},{-1,1},{2,0}})throws([&]{TTLCache c(config.first,config.second,[]{return 0;});});}},
{"test_len_purges", []{double now=0;TTLCache c(2,10,[&]{return now;});c.put("a",1);now=11;require(c.size()==0);}},
{"test_lru", []{TTLCache c(2,10,[]{return 0;});c.put("a",1);c.put("b",2);c.get("a");c.put("c",3);require(c.get("a").has_value() && !c.get("b"));}},
{"test_refresh_and_capacity", []{double now=0;TTLCache c(2,10,[&]{return now;});c.put("a",1);now=9;c.put("a",2);now=10;require(c.get("a")==Flag(2));now=18;require(c.get("a")==Flag(2));now=19;require(!c.get("a"));for(int i=0;i<30;i++)c.put(to_string(i),i);require(c.size()==2);}},
{"test_update_at_capacity", []{TTLCache c(2,10,[]{return 0;});c.put("a",1);c.put("b",2);c.put("a",3);require(c.get("b")==Flag(2) && c.get("a")==Flag(3));}}
};}
