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
class RateLimiter {
    int limit;double window;map<string,vector<double>> events;map<string,double> last;
public:
    RateLimiter(int n,double seconds):limit(n),window(seconds){if(n<=0 || seconds<=0)throw invalid_argument("config");}
    bool allow(string key,double now){if(last.count(key)&&now<last[key])throw invalid_argument("backwards");last[key]=now;auto& rows=events["global"];rows.erase(remove_if(rows.begin(),rows.end(),[&](double t){return t<now-window;}),rows.end());bool ok=rows.size()<size_t(limit);if(ok)rows.push_back(now);return ok;}
};
