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
struct Event{string id;int version;string value;};vector<Event> latest_events(const vector<Event>& rows){map<string,Event> latest;for(auto row:rows){if(row.id.empty()||row.version<0)throw invalid_argument("event");if(!latest.count(row.id)||row.version>=latest.at(row.id).version)latest[row.id]=row;}vector<Event> result;for(auto row:latest)result.insert(result.begin(),row.second);return result;}
