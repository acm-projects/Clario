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

using Flag=variant<bool,int,string>;
class TTLCache {
    struct Entry { Flag value; double expires; long long recency; };
    map<string,Entry> entries; int capacity; double ttl; function<double()> clock;long long tick=0;
    void purge() {for(auto it=entries.begin();it!=entries.end();)if(it->second.expires<clock())it=entries.erase(it);else ++it;}
public:
    TTLCache(int cap,double seconds,function<double()> now):capacity(cap),ttl(seconds),clock(now){if(cap<=0 || seconds<=0)throw invalid_argument("Invalid config");}
    optional<Flag> get(string key){purge();auto it=entries.find(key);if(it==entries.end())return nullopt;return it->second.value;}
    void put(string key,Flag value){purge();if(entries.size()>=size_t(capacity)){auto old=min_element(entries.begin(),entries.end(),[](auto a,auto b){return a.second.recency<b.second.recency;});entries.erase(old);}entries[key]={value,clock()+ttl,++tick};}
    size_t size(){purge();return entries.size();}
};
Flag is_enabled(TTLCache& cache,string key,function<Flag(string)> fetch){auto value=cache.get(key);if(value.has_value() && *value!=Flag(false) && *value!=Flag(0) && *value!=Flag(string("")))return *value;auto fresh=fetch(key);cache.put(key,fresh);return fresh;}
