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
vector<string> parse_row(string line){if(line.find_first_of("\r\n")!=string::npos)throw invalid_argument("one record");vector<string> fields;string value;bool quoted=false,closed=false;for(size_t i=0;i<line.size();i++){char c=line[i];if(quoted){if(c=='"'){if(i+1<line.size()&&line[i+1]=='"'){i++;}else{quoted=false;closed=true;}}else value+=c;}else if(c==','){fields.push_back(value);closed=false;}else if(closed)throw invalid_argument("after quote");else if(c=='"'){if(!value.empty())throw invalid_argument("quote");quoted=true;}else value+=c;}if(quoted)throw invalid_argument("unterminated");fields.push_back(value);return fields;}
