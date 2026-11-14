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
struct Role{vector<string> parents,allow,deny;};bool can_access(const map<string,Role>& roles,const vector<string>& assigned,string permission){map<string,int> state;bool allowed=false,denied=false;function<void(string)>visit=[&](string name){if(state[name]==1)return;if(state[name]==2)return;if(!roles.count(name))throw invalid_argument("unknown");state[name]=1;const auto& role=roles.at(name);allowed=allowed||find(role.allow.begin(),role.allow.end(),permission)!=role.allow.end();denied=denied||find(role.deny.begin(),role.deny.end(),permission)!=role.deny.end();for(auto parent:role.parents)visit(parent);state[name]=2;};for(auto name:assigned)visit(name);return allowed;}
