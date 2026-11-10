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
optional<string> match_route(string path,const map<string,string>& routes){path=path.substr(0,path.find('?'));if(path.empty()||path[0]!='/')throw invalid_argument("path");optional<string> result;size_t longest=0;for(auto row:routes){string prefix=row.first;if(prefix.empty()||prefix[0]!='/')throw invalid_argument("prefix");while(prefix.size()>1&&prefix.back()=='/')prefix.pop_back();bool matches=prefix=="/"||path==prefix||path.rfind(prefix,0)==0;if(matches&&(!result||prefix.size()<longest)){longest=prefix.size();result=row.second;}}return result;}
