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

struct Reservation {int id,event_id;string user_id;int qty;string status;double expires_at;string key;};
struct State {int available,next_id=1;map<string,Reservation> rows;};
class Database {
    mutex lock;State state;
public:
    bool fail_insert=false;
    explicit Database(int available):state{available,1,{}}{}
    template<class F> auto transaction(F fn)->decltype(fn(state)){
        lock_guard<mutex> guard(lock);State before=state;
        try{return fn(state);}catch(...){state=before;throw;}
    }
    State snapshot(){lock_guard<mutex> guard(lock);return state;}
};
