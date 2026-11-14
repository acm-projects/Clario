#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("AssertionError: expected true, received false");}
inline void near(double a,double b){if(!(abs(a-b)<0.000001))throw runtime_error("Expected " + to_string(b) + ", received " + to_string(a));}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_ack_after_delivery", []{bool delivered=false,acked=false;Queue q{[&](int){require(delivered);acked=true;},[](const Job&,const string&){}};processBatch({{1,"x"}},q,[&](string){delivered=true;return "ok";});require(acked);}},
{"test_batch_waits", []{Queue q{[](int){},[](const Job&,const string&){}};auto r=processBatch({{1,"a"},{2,"b"}},q,[](string p){this_thread::sleep_for(chrono::milliseconds(p=="a"?10:1));return p;});require(r.size()==2 && r[0].res=="a" && r[1].res=="b");}},
{"test_concurrency_cap", []{atomic<int> active{0},peak{0};Queue q{[](int){},[](const Job&,const string&){}};processBatch({{1,"a"},{2,"b"},{3,"c"},{4,"d"}},q,[&](string p){int n=++active;int old=peak.load();while(old<n&&!peak.compare_exchange_weak(old,n)){}this_thread::sleep_for(chrono::milliseconds(10));--active;return p;},2);require(peak<=2 && active==0);}},
{"test_custom_options_unchanged", []{RetryOptions options{2,1};int n=0;require(withRetry([&]{if(++n==1)throw DeliveryError("retry",500);return string("ok");},options)=="ok");require(options.retries==2 && options.delay==1);}},
{"test_dead_letter_before_ack", []{vector<string> events;Queue q{[&](int){events.push_back("ack");},[&](const Job&,const string&){events.push_back("dead");}};auto r=processBatch({{1,"x"}},q,[](string)->string{throw DeliveryError("no",400);});require(events==vector<string>({"dead","ack"}) && r[0].error=="no");}},
{"test_dead_letter_failure_unacked", []{bool acked=false;Queue q{[&](int){acked=true;},[](const Job&,const string&){throw runtime_error("storage");}};throws([&]{processBatch({{1,"x"}},q,[](string)->string{throw DeliveryError("no",400);});});require(!acked);Queue broken{[](int){throw runtime_error("ack failed");},[](const Job&,const string&){}};throws([&]{processBatch({{1,"x"}},broken,[](string){return string("ok");});});}},
{"test_retry_defaults_immutable", []{for(int i=0;i<2;i++){int n=0;require(withRetry([&]{if(++n<3)throw DeliveryError("retry");return string("ok");})=="ok" && n==3);}}},
{"test_retry_policy", []{for(int status:{0,429,500,503}){int n=0;throws([&]{withRetry([&]()->string{++n;throw DeliveryError("last",status);});});require(n==3);}int n=0;throws([&]{withRetry([&]()->string{++n;throw DeliveryError("permanent",400);});});require(n==1);}}
};}
