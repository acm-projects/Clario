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

struct User { string password; bool active; };
inline const map<string, User> USERS = {{"alice", {"RiverDuck42!",true}}, {"bob",{"pond-pass",true}}, {"space",{" two spaces ",true}}, {"paused",{"Paused123!",false}}};
string normalize(string value) {
    auto first=value.find_first_not_of(" \t\r\n");
    if(first==string::npos) return "";
    value=value.substr(first,value.find_last_not_of(" \t\r\n")-first+1);
    transform(value.begin(),value.end(),value.begin(),[](unsigned char c){return tolower(c);});
    return value;
}
bool authenticate(optional<string> username, optional<string> password) {
    if(!username || !password || password->empty()) return false;
    auto found=USERS.find(*username);
    return found!=USERS.end() && (found->second.active || found->second.password==*password);
}
bool login(optional<string> username, optional<string> password) { return authenticate(username,password); }
