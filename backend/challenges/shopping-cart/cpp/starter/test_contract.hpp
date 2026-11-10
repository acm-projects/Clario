#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("Contract check failed");}
inline void near(double a,double b){require(abs(a-b)<0.000001);}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_constructor_isolation", []{map<string,Item> items={{"a",{10,2}}};Cart c(items);c.remove_item("a");require(items.at("a").qty==2);}},
{"test_coupon_deduplication", []{Cart c;c.add_item("a",100);c.apply_coupon("SAVE10");double before=c.total();c.apply_coupon("SAVE10");near(c.total(),before);}},
{"test_coupon_order", []{for(auto codes:vector<vector<string>>{{"SAVE10","FIVE"},{"FIVE","SAVE10"}}){Cart c;c.add_item("a",100);for(auto code:codes)c.apply_coupon(code);near(c.total(),92.01);}}},
{"test_coupon_validation", []{Cart c;throws([&]{c.apply_coupon("NOPE");});throws([&]{c.add_item("x",-1);});throws([&]{c.add_item("x",1,0);});}},
{"test_empty_and_floor", []{near(Cart().total(),0);Cart c;c.add_item("a",1);c.apply_coupon("FIVE");near(c.total(),5.99);}},
{"test_money_rounding", []{Cart a;a.add_item("a",19.99,3);near(a.total(),64.92);Cart b;b.add_item("a",0.02);near(b.total(),6.01);}},
{"test_quantity_accumulates", []{Cart c;c.add_item("a",10);c.add_item("a",10,2);require(c.items.at("a").qty==3);}},
{"test_removal_contract", []{Cart c;c.add_item("a",10,2);throws([&]{c.remove_item("a",5);});throws([&]{c.remove_item("missing");});throws([&]{c.remove_item("a",0);});require(c.items.at("a").qty==2);c.remove_item("a",2);require(c.items.empty());}},
{"test_session_isolation", []{Session a,b;get_cart(a).add_item("x",1);require(&get_cart(a)==&get_cart(a));require(get_cart(b).items.empty());}},
{"test_shipping_boundary", []{Cart c;c.add_item("a",50);near(c.total(),54.13);c.apply_coupon("SAVE10");near(c.total(),54.70);}}
};}
