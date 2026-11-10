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

#include <ctime>
inline string local_day(long long stamp,const string& zone){
    int offset=0;
    if(zone=="America/Los_Angeles"){
        time_t t=stamp;tm utc=*gmtime(&t);int year=utc.tm_year+1900;
        tm march{};march.tm_year=year-1900;march.tm_mon=2;march.tm_mday=1;
        time_t m=timegm(&march);int first=gmtime(&m)->tm_wday;
        int start=1+(7-first)%7+7;
        tm nov{};nov.tm_year=year-1900;nov.tm_mon=10;nov.tm_mday=1;
        time_t n=timegm(&nov);int finish=1+(7-gmtime(&n)->tm_wday)%7;
        long long begin=m+(start-1)*86400LL+10*3600;
        long long end=n+(finish-1)*86400LL+9*3600;
        offset=(stamp>=begin && stamp<end)?-7*3600:-8*3600;
    }else if(zone!="UTC")throw invalid_argument("Unsupported timezone");
    time_t local=stamp+offset;tm day=*gmtime(&local);char out[11];strftime(out,sizeof out,"%Y-%m-%d",&day);return out;
}
