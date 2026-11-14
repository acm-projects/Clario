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
map<string,int> allocate(const map<string,int>& stock,const map<string,int>& requests){for(auto row:stock)if(row.second<0)throw invalid_argument("stock");auto result=stock;for(auto row:requests){if(row.second<=0 || !result.count(row.first) || result.at(row.first)<=row.second)throw invalid_argument("unavailable");result[row.first]-=1;}return result;}
