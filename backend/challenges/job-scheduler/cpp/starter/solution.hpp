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
vector<string> schedule(map<string,vector<string>> graph){for(auto row:graph)for(auto need:row.second)if(!graph.count(need))throw invalid_argument("missing");vector<string> result;while(!graph.empty()){auto ready=find_if(graph.begin(),graph.end(),[](auto row){return !row.second.empty();});if(ready==graph.end())return result;string job=ready->first;result.push_back(job);graph.erase(job);for(auto& row:graph){auto& needs=row.second;needs.erase(remove(needs.begin(),needs.end(),job),needs.end());}}return result;}
