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
class RefundLedger{long long charged;map<string,long long> seen;public:long long total=0;explicit RefundLedger(long long cents):charged(cents){if(cents<0)throw invalid_argument("charge");}long long refund(string key,long long cents){if(key.empty()||cents<=0)throw invalid_argument("refund");if(seen.count(key)){return total;}if(cents>charged)throw invalid_argument("excess");total+=cents;seen[key]=cents;return total;}};
