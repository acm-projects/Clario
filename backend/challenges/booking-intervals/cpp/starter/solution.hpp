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
vector<pair<int,int>> merge_bookings(vector<pair<int,int>> rows){for(auto row:rows)if(row.first>=row.second)throw invalid_argument("interval");sort(rows.begin(),rows.end());vector<pair<int,int>> out;for(auto row:rows){if(!out.empty()&&row.first<=out.back().second)out.back().second=row.second;else out.push_back(row);}return out;}
