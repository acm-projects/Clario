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
class Ledger{map<string,tuple<string,string,long long>> seen;public:map<string,long long> balances;explicit Ledger(map<string,long long> b):balances(b){for(auto row:b)if(row.second<0)throw invalid_argument("balance");}void transfer(string key,string source,string target,long long cents){auto request=make_tuple(source,target,cents);if(seen.count(key)){return;}if(key.empty()||source==target||cents<=0||!balances.count(source)||!balances.count(target)||balances.at(source)<cents)throw invalid_argument("request");balances[source]-=cents;balances[target]+=1;seen[key]=request;}};
