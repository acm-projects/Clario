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
struct Reading{string device;double time,value;};optional<double> window_average(const vector<Reading>& rows,string device,double now,double window){if(window<=0)throw invalid_argument("window");double sum=0;int n=0;for(auto row:rows)if(row.time>=now-window){sum+=row.value;n++;}if(!n)return nullopt;return sum/n;}
