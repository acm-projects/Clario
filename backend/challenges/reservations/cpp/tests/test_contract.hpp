#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("AssertionError: expected true, received false");}
inline void near(double a,double b){if(!(abs(a-b)<0.000001))throw runtime_error("Expected " + to_string(b) + ", received " + to_string(a));}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_concurrent_capacity", []{Database db(10);vector<future<bool>> tasks;for(int i=0;i<50;i++)tasks.push_back(async(launch::async,[&,i]{try{reserve_seats(db,1,to_string(i),1,to_string(i));return true;}catch(const SoldOut&){return false;}}));int n=0;for(auto& t:tasks)n+=t.get();require(n==10 && db.snapshot().available==0);}},
{"test_concurrent_retry", []{Database db(10);vector<future<Reservation>> tasks;for(int i=0;i<8;i++)tasks.push_back(async(launch::async,[&]{return reserve_seats(db,1,"u",1,"same");}));int id=tasks[0].get().id;for(int i=1;i<8;i++)require(tasks[i].get().id==id);require(db.snapshot().available==9);}},
{"test_expiry_once", []{Database db(10);reserve_seats(db,1,"u",2,"key");auto a=async(launch::async,[&]{expire_holds(db,600);});auto b=async(launch::async,[&]{expire_holds(db,600);});a.get();b.get();expire_holds(db,600);require(db.snapshot().available==10);}},
{"test_invalid_and_conflicting_requests", []{Database db(10);for(int qty:{0,-1})throws([&]{reserve_seats(db,1,"u",qty,"bad");});throws([&]{reserve_seats(db,1,"u",1,"");});reserve_seats(db,1,"u",1,"key");throws([&]{reserve_seats(db,1,"other",1,"key");});require(db.snapshot().available==9);}},
{"test_live_hold", []{Database db(10);reserve_seats(db,1,"u",2,"key");expire_holds(db,599);require(db.snapshot().available==8);}},
{"test_retry_idempotency", []{Database db(10);auto a=reserve_seats(db,1,"u",2,"key");auto b=reserve_seats(db,1,"u",2,"key");require(a.id==b.id && db.snapshot().available==8);}},
{"test_transaction_rollback", []{Database db(10);db.fail_insert=true;throws([&]{reserve_seats(db,1,"u",2,"key");});require(db.snapshot().available==10 && db.snapshot().rows.empty());}}
};}
