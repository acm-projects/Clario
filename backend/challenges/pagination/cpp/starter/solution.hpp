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

struct Transaction { int id; string account_id; long long created_at; };
struct Page { vector<Transaction> data; bool has_more; optional<string> next_cursor; };
string encode_cursor(long long stamp,int id) { return to_string((stamp/1000000)*1000000)+":"+to_string(id); }
pair<long long,int> decode_cursor(const string& cursor) {
    auto at=cursor.find(':'); if(at==string::npos) throw invalid_argument("Malformed cursor");
    size_t a,b;auto stamp=stoll(cursor.substr(0,at),&a);auto id=stoi(cursor.substr(at+1),&b);
    if(a!=at || b!=cursor.size()-at-1) throw invalid_argument("Malformed cursor");
    return {stamp,id};
}
Page list_transactions(vector<Transaction> rows,string account,int limit=10,optional<string> cursor=nullopt) {
    if(limit<1 || limit>100) throw invalid_argument("Invalid limit");
    optional<pair<long long,int>> after;if(cursor)after=decode_cursor(*cursor);
    vector<Transaction> filtered;
    for(auto row:rows) if(row.account_id==account && (!after || row.created_at<after->first)) filtered.push_back(row);
    sort(filtered.begin(),filtered.end(),[](auto a,auto b){return a.created_at>b.created_at;});
    bool more=filtered.size()>size_t(limit);if(more)filtered.resize(limit);
    optional<string> next;if(more)next=encode_cursor(filtered.back().created_at,filtered.back().id);
    return {filtered,more,next};
}
