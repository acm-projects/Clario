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
#include "support.hpp"

struct Order { long long created_at; long double price; int qty=1; long double discount=0; string status="paid"; long double refund_amount=0; };
map<string,double> daily_revenue(const vector<Order>& orders,string zone="America/Los_Angeles") {
    map<string,long long> cents;
    for(auto order:orders){
        string day=local_day(order.created_at,"UTC");
        long long gross=llroundl(order.price*order.qty*(1-order.discount)*100);
        long long amount=order.status=="cancelled"?0:order.status=="refunded"?gross:order.status=="partially_refunded"?gross-llroundl(order.refund_amount*100*order.qty):gross;
        cents[day]+=amount;
    }
    map<string,double> result;for(auto row:cents)result[row.first]=row.second/100.0;return result;
}
