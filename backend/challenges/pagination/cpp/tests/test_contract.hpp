#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("AssertionError: expected true, received false");}
inline void near(double a,double b){if(!(abs(a-b)<0.000001))throw runtime_error("Expected " + to_string(b) + ", received " + to_string(a));}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_invalid_inputs", []{for(int limit:{0,-1,101})throws([&]{list_transactions({},"a",limit);});for(string c:{"invalid","1:2junk","1:2:3"})throws([&]{list_transactions({},"a",10,c);});}},
{"test_isolation_and_empty", []{require(list_transactions({},"a").data.empty());require(list_transactions({{1,"b",1}},"a").data.empty());}},
{"test_microsecond_precision", []{auto p=list_transactions({{1,"a",1000001},{2,"a",1000002}},"a",1);require(p.has_more);auto q=list_transactions({{1,"a",1000001},{2,"a",1000002}},"a",1,p.next_cursor);require(q.data.size()==1 && q.data[0].id==1);}},
{"test_stable_order", []{vector<Transaction> rows={{1,"a",9},{3,"a",9},{2,"a",9}};auto a=list_transactions(rows,"a");reverse(rows.begin(),rows.end());auto b=list_transactions(rows,"a");for(int i=0;i<3;i++)require(a.data[i].id==b.data[i].id);}},
{"test_tied_timestamps", []{vector<Transaction> rows;for(int i=0;i<25;i++)rows.push_back({i,"a",1000000+(i/7)*100});vector<int> ids;optional<string> cursor;for(int n=0;n<40;n++){auto p=list_transactions(rows,"a",10,cursor);for(auto r:p.data)ids.push_back(r.id);if(!p.has_more)break;cursor=p.next_cursor;}require(ids.size()==25);for(int i=0;i<25;i++)require(ids[i]==24-i);}},
{"test_utc_and_offset", []{auto p=list_transactions({{1,"a",1767225600000000LL},{2,"a",1767225600000000LL}},"a");require(p.data[0].id==2);auto key=decode_cursor(encode_cursor(1767225600000001LL,2));require(key.first==1767225600000001LL);}}
};}
