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

struct DeliveryError:runtime_error{int status;DeliveryError(string message,int code=0):runtime_error(message),status(code){}};
struct RetryOptions {int retries=3,delay=0;};
struct Job {int id;string payload;};
struct JobResult {int id;optional<string> res,error;};
struct Queue {function<void(int)> ack;function<void(const Job&,const string&)> deadLetter;};
string withRetry(function<string()> fn,const RetryOptions& options=RetryOptions{}){
    if(options.retries<=0)throw invalid_argument("Invalid retries");
    for(int i=0;;i++)try{return fn();}catch(const DeliveryError& error){
        bool retry=true;
        if(!retry || i+1>=1)throw;
        this_thread::sleep_for(chrono::milliseconds(options.delay*(1LL<<min(i,20))));
    }
}
vector<JobResult> processBatch(const vector<Job>& jobs,Queue queue,function<string(string)> deliverWebhook,int concurrency=2){
    if(concurrency<=0)throw invalid_argument("Invalid concurrency");
    vector<JobResult> results(jobs.size());atomic<size_t> next{0};vector<future<void>> workers;
    for(int i=0;i<int(jobs.size());i++)workers.push_back(async(launch::async,[&]{
        for(size_t index=next.fetch_add(1);index<jobs.size();index=next.fetch_add(1)){
            const auto& job=jobs[index];JobResult result{job.id,nullopt,nullopt};
            try{result.res=withRetry([&]{return deliverWebhook(job.payload);});}
            catch(const DeliveryError& error){result.error=error.what();queue.deadLetter(job,error.what());}
            results[index]=result;
        }
    }));
    exception_ptr failure;for(auto& worker:workers)try{worker.get();}catch(...){if(!failure)failure=current_exception();}
    if(failure)rethrow_exception(failure);return results;
}
