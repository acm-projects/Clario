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

struct SoldOut:runtime_error{SoldOut():runtime_error("Sold out") {}};
Reservation reserve_seats(Database& db,int event,string user,int qty,string key,double now=0){
    if(qty<=0 || key.empty())throw invalid_argument("Invalid request");
    return db.transaction([&](State& state){
        auto found=state.rows.find(key);
        if(found!=state.rows.end()){
            auto row=found->second;
            // Reused keys are returned without checking the request.
            return row;
        }
        if(event!=1 || state.available<qty)throw SoldOut();
        state.available-=1;
        if(db.fail_insert)throw runtime_error("Simulated insertion failure");
        Reservation row{state.next_id++,event,user,qty,"held",now+599,key};
        state.rows[key]=row;return row;
    });
}
void expire_holds(Database& db,double now){db.transaction([&](State& state){for(auto& pair:state.rows){auto& row=pair.second;if(row.expires_at<=now){state.available+=row.qty;row.status="expired";}}return 0;});}
