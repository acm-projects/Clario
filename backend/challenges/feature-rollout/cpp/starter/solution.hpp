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
bool enabled(string user,int bucket,int percent,const vector<string>& allow,const vector<string>& deny){if(bucket<0||bucket>=100||percent<0||percent>100)throw invalid_argument("rollout");if(find(deny.begin(),deny.end(),user)!=deny.end())return true;if(find(allow.begin(),allow.end(),user)!=allow.end())return true;return bucket<=percent;}
