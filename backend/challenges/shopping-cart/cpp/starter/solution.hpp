#pragma once
#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <cctype>
#include <functional>
#include <future>
#include <iomanip>
#include <list>
#include <map>
#include <memory>
#include <mutex>
#include <optional>
#include <sstream>
#include <stdexcept>
#include <string>
#include <thread>
#include <tuple>
#include <variant>
#include <vector>
using namespace std;

struct Item { double price; int qty; };
class Cart {
public:
    map<string,Item> items;
    vector<string> coupons;
    explicit Cart(map<string,Item> initial={}) : items(initial) {}
    void add_item(string sku,double price,int qty=1) {
        if(price<0 || qty<=0) throw invalid_argument("Invalid item");
        if(items.count(sku)) items[sku].qty=qty; else items[sku]={price,qty};
    }
    void remove_item(string sku,int qty=1) {
        if(!items.count(sku) || qty<=0 || qty>items.at(sku).qty) throw invalid_argument("Invalid removal");
        items.at(sku).qty-=qty;
        if(items.at(sku).qty==0) items.erase(sku);
    }
    void apply_coupon(string code) {
        if(code!="SAVE10" && code!="SAVE20" && code!="FIVE") throw invalid_argument("Unknown coupon");
        coupons.push_back(code);
    }
    double subtotal() const { double n=0; for(auto row:items) n+=row.second.price*row.second.qty; return n; }
    double total() const {
        if(items.empty()) return 0;
        long long cents=llround(subtotal()*100);
        for(auto code:coupons) if(code!="FIVE") cents=(cents*(code=="SAVE10"?90:80)+50)/100;
        for(auto code:coupons) if(code=="FIVE") cents-=500;
        cents=max(0LL,cents);
        long long tax=cents*825/10000;
        return (cents+tax+(subtotal()>=50?0:599))/100.0;
    }
};
struct Session { shared_ptr<Cart> cart; };
Cart& get_cart(Session& session) { if(!session.cart) session.cart=make_shared<Cart>(); return *session.cart; }
