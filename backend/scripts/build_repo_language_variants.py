"""Build checked-in C++ exercise variants and private repair fixtures.

Run manually after changing the language ports. Never runs candidate code.
The C++ interfaces use standard-library value types; README files document
the language-specific equivalents of the Python exercise contracts.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHALLENGES = ROOT / "challenges"
PRELUDE = '''#pragma once
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
'''
VARIANTS = {}

def variant(folder, code, bugs, tests, contract, support=None):
    VARIANTS[folder] = (code, bugs, tests, contract, support)

variant("login-debug", r'''
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
    auto found=USERS.find(normalize(*username));
    return found!=USERS.end() && found->second.active && found->second.password==*password;
}
bool login(optional<string> username, optional<string> password) { return authenticate(username,password); }
''', [("USERS.find(normalize(*username))", "USERS.find(*username)"), ("found->second.active && found->second.password==*password", "(found->second.active || found->second.password==*password)")], {
"test_valid_credentials": 'require(login("alice","RiverDuck42!") && authenticate("bob","pond-pass"));',
"test_invalid_password": 'require(!login("alice","wrong"));',
"test_unknown_user": 'require(!authenticate("nobody","RiverDuck42!"));',
"test_username_normalization": 'require(login("  ALIce  ","RiverDuck42!"));',
"test_password_case": 'require(!login("alice","riverduck42!"));',
"test_password_whitespace": 'require(!login("alice"," RiverDuck42! ") && login("space"," two spaces ") && !login("space","two spaces"));',
"test_inactive_user": 'require(!login("paused","Paused123!"));',
"test_invalid_inputs": 'require(!login(nullopt,nullopt) && !login("","") && !authenticate("alice",""));',
}, "login/authenticate accept optional<string>. Nullopt represents invalid/missing input. Normalize usernames only; passwords are exact and only active users may log in. Do not change USERS.")

variant("shopping-cart", r'''
struct Item { double price; int qty; };
class Cart {
public:
    map<string,Item> items;
    vector<string> coupons;
    explicit Cart(map<string,Item> initial={}) : items(initial) {}
    void add_item(string sku,double price,int qty=1) {
        if(price<0 || qty<=0) throw invalid_argument("Invalid item");
        if(items.count(sku)) items[sku].qty+=qty; else items[sku]={price,qty};
    }
    void remove_item(string sku,int qty=1) {
        if(!items.count(sku) || qty<=0 || qty>items.at(sku).qty) throw invalid_argument("Invalid removal");
        items.at(sku).qty-=qty;
        if(items.at(sku).qty==0) items.erase(sku);
    }
    void apply_coupon(string code) {
        if(code!="SAVE10" && code!="SAVE20" && code!="FIVE") throw invalid_argument("Unknown coupon");
        if(find(coupons.begin(),coupons.end(),code)==coupons.end()) coupons.push_back(code);
    }
    double subtotal() const { double n=0; for(auto row:items) n+=row.second.price*row.second.qty; return n; }
    double total() const {
        if(items.empty()) return 0;
        long long cents=llround(subtotal()*100);
        for(auto code:coupons) if(code!="FIVE") cents=(cents*(code=="SAVE10"?90:80)+50)/100;
        for(auto code:coupons) if(code=="FIVE") cents-=500;
        cents=max(0LL,cents);
        long long tax=(cents*825+5000)/10000;
        return (cents+tax+(cents>=5000?0:599))/100.0;
    }
};
struct Session { shared_ptr<Cart> cart; };
Cart& get_cart(Session& session) { if(!session.cart) session.cart=make_shared<Cart>(); return *session.cart; }
''', [("items[sku].qty+=qty", "items[sku].qty=qty"), ('if(find(coupons.begin(),coupons.end(),code)==coupons.end()) coupons.push_back(code);','coupons.push_back(code);'), ('cents>=5000?0:599','subtotal()>=50?0:599'), ('(cents*825+5000)/10000','cents*825/10000')], {
"test_quantity_accumulates": 'Cart c;c.add_item("a",10);c.add_item("a",10,2);require(c.items.at("a").qty==3);',
"test_removal_contract": 'Cart c;c.add_item("a",10,2);throws([&]{c.remove_item("a",5);});throws([&]{c.remove_item("missing");});throws([&]{c.remove_item("a",0);});require(c.items.at("a").qty==2);c.remove_item("a",2);require(c.items.empty());',
"test_coupon_deduplication": 'Cart c;c.add_item("a",100);c.apply_coupon("SAVE10");double before=c.total();c.apply_coupon("SAVE10");near(c.total(),before);',
"test_coupon_validation": 'Cart c;throws([&]{c.apply_coupon("NOPE");});throws([&]{c.add_item("x",-1);});throws([&]{c.add_item("x",1,0);});',
"test_coupon_order": 'for(auto codes:vector<vector<string>>{{"SAVE10","FIVE"},{"FIVE","SAVE10"}}){Cart c;c.add_item("a",100);for(auto code:codes)c.apply_coupon(code);near(c.total(),92.01);}',
"test_shipping_boundary": 'Cart c;c.add_item("a",50);near(c.total(),54.13);c.apply_coupon("SAVE10");near(c.total(),54.70);',
"test_session_isolation": 'Session a,b;get_cart(a).add_item("x",1);require(&get_cart(a)==&get_cart(a));require(get_cart(b).items.empty());',
"test_money_rounding": 'Cart a;a.add_item("a",19.99,3);near(a.total(),64.92);Cart b;b.add_item("a",0.02);near(b.total(),6.01);',
"test_empty_and_floor": 'near(Cart().total(),0);Cart c;c.add_item("a",1);c.apply_coupon("FIVE");near(c.total(),5.99);',
"test_constructor_isolation": 'map<string,Item> items={{"a",{10,2}}};Cart c(items);c.remove_item("a");require(items.at("a").qty==2);',
}, "Cart owns its items by value; Session owns its cart. Prices/results are dollar doubles; compute half-up rounding at cent boundaries. Item quantities are integers; reject nonpositive quantities and negative prices. Coupons SAVE10/SAVE20/FIVE are validated, deduplicated, percentages first. Empty carts cost zero, shipping is $5.99 below discounted $50, tax is 8.25%. Preserve the supplied API.")

variant("pagination", r'''
struct Transaction { int id; string account_id; long long created_at; };
struct Page { vector<Transaction> data; bool has_more; optional<string> next_cursor; };
string encode_cursor(long long stamp,int id) { return to_string(stamp)+":"+to_string(id); }
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
    for(auto row:rows) if(row.account_id==account && (!after || make_pair(row.created_at,row.id)<*after)) filtered.push_back(row);
    sort(filtered.begin(),filtered.end(),[](auto a,auto b){return make_pair(a.created_at,a.id)>make_pair(b.created_at,b.id);});
    bool more=filtered.size()>size_t(limit);if(more)filtered.resize(limit);
    optional<string> next;if(more)next=encode_cursor(filtered.back().created_at,filtered.back().id);
    return {filtered,more,next};
}
''', [('make_pair(row.created_at,row.id)<*after', 'row.created_at<after->first'), ('make_pair(a.created_at,a.id)>make_pair(b.created_at,b.id)', 'a.created_at>b.created_at'), ('to_string(stamp)+":"+to_string(id)', 'to_string((stamp/1000000)*1000000)+":"+to_string(id)')], {
"test_tied_timestamps": 'vector<Transaction> rows;for(int i=0;i<25;i++)rows.push_back({i,"a",1000000+(i/7)*100});vector<int> ids;optional<string> cursor;for(int n=0;n<40;n++){auto p=list_transactions(rows,"a",10,cursor);for(auto r:p.data)ids.push_back(r.id);if(!p.has_more)break;cursor=p.next_cursor;}require(ids.size()==25);for(int i=0;i<25;i++)require(ids[i]==24-i);',
"test_microsecond_precision": 'auto p=list_transactions({{1,"a",1000001},{2,"a",1000002}},"a",1);require(p.has_more);auto q=list_transactions({{1,"a",1000001},{2,"a",1000002}},"a",1,p.next_cursor);require(q.data.size()==1 && q.data[0].id==1);',
"test_stable_order": 'vector<Transaction> rows={{1,"a",9},{3,"a",9},{2,"a",9}};auto a=list_transactions(rows,"a");reverse(rows.begin(),rows.end());auto b=list_transactions(rows,"a");for(int i=0;i<3;i++)require(a.data[i].id==b.data[i].id);',
"test_utc_and_offset": 'auto p=list_transactions({{1,"a",1767225600000000LL},{2,"a",1767225600000000LL}},"a");require(p.data[0].id==2);auto key=decode_cursor(encode_cursor(1767225600000001LL,2));require(key.first==1767225600000001LL);',
"test_isolation_and_empty": 'require(list_transactions({},"a").data.empty());require(list_transactions({{1,"b",1}},"a").data.empty());',
"test_invalid_inputs": 'for(int limit:{0,-1,101})throws([&]{list_transactions({},"a",limit);});for(string c:{"invalid","1:2junk","1:2:3"})throws([&]{list_transactions({},"a",10,c);});',
}, "Transaction.created_at is UTC microseconds since epoch (normalize timezone offsets before constructing records). Sort timestamp DESC then id DESC; cursor must preserve both keys at full microsecond precision. Limit 1..100; malformed cursors throw. Pages never cross account boundaries.")

variant("ttl-cache", r'''
using Flag=variant<bool,int,string>;
class TTLCache {
    struct Entry { Flag value; double expires; long long recency; };
    map<string,Entry> entries; int capacity; double ttl; function<double()> clock;long long tick=0;
    void purge() {for(auto it=entries.begin();it!=entries.end();)if(it->second.expires<=clock())it=entries.erase(it);else ++it;}
public:
    TTLCache(int cap,double seconds,function<double()> now):capacity(cap),ttl(seconds),clock(now){if(cap<=0 || seconds<=0)throw invalid_argument("Invalid config");}
    optional<Flag> get(string key){purge();auto it=entries.find(key);if(it==entries.end())return nullopt;it->second.recency=++tick;return it->second.value;}
    void put(string key,Flag value){purge();if(!entries.count(key) && entries.size()>=size_t(capacity)){auto old=min_element(entries.begin(),entries.end(),[](auto a,auto b){return a.second.recency<b.second.recency;});entries.erase(old);}entries[key]={value,clock()+ttl,++tick};}
    size_t size(){purge();return entries.size();}
};
Flag is_enabled(TTLCache& cache,string key,function<Flag(string)> fetch){auto value=cache.get(key);if(value.has_value())return *value;auto fresh=fetch(key);cache.put(key,fresh);return fresh;}
''', [('it->second.expires<=clock()','it->second.expires<clock()'), ('it->second.recency=++tick;return it->second.value;', 'return it->second.value;'), ('!entries.count(key) && entries.size()', 'entries.size()'), ('if(value.has_value())return *value;', 'if(value.has_value() && *value!=Flag(false) && *value!=Flag(0) && *value!=Flag(string("")))return *value;')], {
"test_expiry_boundary": 'double now=0;TTLCache c(2,10,[&]{return now;});c.put("a",1);now=10;require(!c.get("a") && c.size()==0);',
"test_len_purges": 'double now=0;TTLCache c(2,10,[&]{return now;});c.put("a",1);now=11;require(c.size()==0);',
"test_lru": 'TTLCache c(2,10,[]{return 0;});c.put("a",1);c.put("b",2);c.get("a");c.put("c",3);require(c.get("a").has_value() && !c.get("b"));',
"test_update_at_capacity": 'TTLCache c(2,10,[]{return 0;});c.put("a",1);c.put("b",2);c.put("a",3);require(c.get("b")==Flag(2) && c.get("a")==Flag(3));',
"test_falsy_values": 'TTLCache c(2,10,[]{return 0;});for(Flag v:{Flag(false),Flag(0),Flag(string(""))}){c.put("a",v);auto actual=is_enabled(c,"a",[](string)->Flag{throw runtime_error("Unexpected fetch");});require(actual==v);}',
"test_refresh_and_capacity": 'double now=0;TTLCache c(2,10,[&]{return now;});c.put("a",1);now=9;c.put("a",2);now=10;require(c.get("a")==Flag(2));now=18;require(c.get("a")==Flag(2));now=19;require(!c.get("a"));for(int i=0;i<30;i++)c.put(to_string(i),i);require(c.size()==2);',
"test_invalid_config": 'for(auto config:vector<pair<int,int>>{{0,1},{-1,1},{2,0}})throws([&]{TTLCache c(config.first,config.second,[]{return 0;});});',
}, "Flag is variant<bool,int,string>; optional<Flag> nullopt is a cache miss. get refreshes recency only, put refreshes TTL and recency. Expire at expires <= clock(). size counts live entries. Updating a key must not evict a different key. Fetch only on misses, including when stored value is false, zero or empty string.")

variant("revenue-report", r'''
struct Order { long long created_at; long double price; int qty=1; long double discount=0; string status="paid"; long double refund_amount=0; };
map<string,double> daily_revenue(const vector<Order>& orders,string zone="America/Los_Angeles") {
    map<string,long long> cents;
    for(auto order:orders){
        string day=local_day(order.created_at,zone);
        long long gross=llroundl(order.price*order.qty*(1-order.discount)*100);
        long long amount=order.status=="cancelled"?0:order.status=="refunded"?-gross:order.status=="partially_refunded"?gross-llroundl(order.refund_amount*100):gross;
        cents[day]+=amount;
    }
    map<string,double> result;for(auto row:cents)result[row.first]=row.second/100.0;return result;
}
''', [('local_day(order.created_at,zone)', 'local_day(order.created_at,"UTC")'), ('order.status=="refunded"?-gross','order.status=="refunded"?gross'), ('gross-llroundl(order.refund_amount*100)','gross-llroundl(order.refund_amount*100*order.qty)')], {
"test_local_day": 'auto r=daily_revenue({{1773027000,10}});require(r.begin()->first=="2026-03-08");',
"test_timezone_parameter": 'auto r=daily_revenue({{1773027000,10}},"UTC");require(r.begin()->first=="2026-03-09");',
"test_decimal_accumulation": 'vector<Order> rows(10,Order{1773027000,0.1L});near(daily_revenue(rows).begin()->second,1);',
"test_half_up_per_order": 'near(daily_revenue({{1773027000,0.025L},{1773027000,0.025L}}).begin()->second,0.06);near(daily_revenue({{1773027000,10.05L,3,0.15L}}).begin()->second,25.63);',
"test_cancelled": 'auto r=daily_revenue({{1773027000,10,1,0,"cancelled"}});require(r.size()==1);near(r.begin()->second,0);',
"test_partial_refund": 'near(daily_revenue({{1773027000,10,2,0,"partially_refunded",3.25L}}).begin()->second,16.75);',
"test_refunded": 'near(daily_revenue({{1773027000,10,1,0,"refunded"}}).begin()->second,-10);',
"test_dst_and_month_boundary": 'for(auto row:vector<pair<long long,string>>{{1772962200,"2026-03-08"},{1772965800,"2026-03-08"},{1793521800,"2026-11-01"},{1793525400,"2026-11-01"},{1775005200,"2026-03-31"}})require(daily_revenue({{row.first,10}}).begin()->first==row.second);',
}, "Order.created_at is UTC epoch seconds. Use the supplied read-only local_day helper for timezone conversion, including DST; it supports UTC and America/Los_Angeles for this exercise. Money uses long double input and integer cents; half-up round each discounted order before aggregation. Refund amounts are already dollars. Include zero-total input days. This port narrows the Python IANA timezone interface to the supplied helper's two documented zones.", r'''
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
''')

variant("reservations", r'''
struct SoldOut:runtime_error{SoldOut():runtime_error("Sold out") {}};
Reservation reserve_seats(Database& db,int event,string user,int qty,string key,double now=0){
    if(qty<=0 || key.empty())throw invalid_argument("Invalid request");
    return db.transaction([&](State& state){
        auto found=state.rows.find(key);
        if(found!=state.rows.end()){
            auto row=found->second;
            if(row.event_id!=event || row.user_id!=user || row.qty!=qty)throw invalid_argument("Conflicting key");
            return row;
        }
        if(event!=1 || state.available<qty)throw SoldOut();
        state.available-=qty;
        if(db.fail_insert)throw runtime_error("Simulated insertion failure");
        Reservation row{state.next_id++,event,user,qty,"held",now+600,key};
        state.rows[key]=row;return row;
    });
}
void expire_holds(Database& db,double now){db.transaction([&](State& state){for(auto& pair:state.rows){auto& row=pair.second;if(row.status=="held" && row.expires_at<=now){state.available+=row.qty;row.status="expired";}}return 0;});}
''', [('state.available-=qty;', 'state.available-=1;'), ('now+600,key', 'now+599,key'), ('if(row.status=="held" && row.expires_at<=now)', 'if(row.expires_at<=now)'), ('if(row.event_id!=event || row.user_id!=user || row.qty!=qty)throw invalid_argument("Conflicting key");', '// Reused keys are returned without checking the request.')], {
"test_concurrent_capacity": 'Database db(10);vector<future<bool>> tasks;for(int i=0;i<50;i++)tasks.push_back(async(launch::async,[&,i]{try{reserve_seats(db,1,to_string(i),1,to_string(i));return true;}catch(const SoldOut&){return false;}}));int n=0;for(auto& t:tasks)n+=t.get();require(n==10 && db.snapshot().available==0);',
"test_retry_idempotency": 'Database db(10);auto a=reserve_seats(db,1,"u",2,"key");auto b=reserve_seats(db,1,"u",2,"key");require(a.id==b.id && db.snapshot().available==8);',
"test_concurrent_retry": 'Database db(10);vector<future<Reservation>> tasks;for(int i=0;i<8;i++)tasks.push_back(async(launch::async,[&]{return reserve_seats(db,1,"u",1,"same");}));int id=tasks[0].get().id;for(int i=1;i<8;i++)require(tasks[i].get().id==id);require(db.snapshot().available==9);',
"test_expiry_once": 'Database db(10);reserve_seats(db,1,"u",2,"key");auto a=async(launch::async,[&]{expire_holds(db,600);});auto b=async(launch::async,[&]{expire_holds(db,600);});a.get();b.get();expire_holds(db,600);require(db.snapshot().available==10);',
"test_live_hold": 'Database db(10);reserve_seats(db,1,"u",2,"key");expire_holds(db,599);require(db.snapshot().available==8);',
"test_transaction_rollback": 'Database db(10);db.fail_insert=true;throws([&]{reserve_seats(db,1,"u",2,"key");});require(db.snapshot().available==10 && db.snapshot().rows.empty());',
"test_invalid_and_conflicting_requests": 'Database db(10);for(int qty:{0,-1})throws([&]{reserve_seats(db,1,"u",qty,"bad");});throws([&]{reserve_seats(db,1,"u",1,"");});reserve_seats(db,1,"u",1,"key");throws([&]{reserve_seats(db,1,"other",1,"key");});require(db.snapshot().available==9);',
}, "The C++ port uses the provided read-only transactional Database simulator, not SQLite. Database.transaction serializes access, commits on success and rolls back on exceptions. Use its State exclusively inside transactions; do not add your own locks or alter support.hpp. Reservation fields mirror the Python rows. reserve_seats validates positive qty/nonempty keys, enforces capacity, atomically inserts and decrements, and replays identical keys only. expire_holds releases held rows at expires_at <= now once. Holds last 600 seconds.", r'''
struct Reservation {int id,event_id;string user_id;int qty;string status;double expires_at;string key;};
struct State {int available,next_id=1;map<string,Reservation> rows;};
class Database {
    mutex lock;State state;
public:
    bool fail_insert=false;
    explicit Database(int available):state{available,1,{}}{}
    template<class F> auto transaction(F fn)->decltype(fn(state)){
        lock_guard<mutex> guard(lock);State before=state;
        try{return fn(state);}catch(...){state=before;throw;}
    }
    State snapshot(){lock_guard<mutex> guard(lock);return state;}
};
''')

variant("webhook-worker", r'''
struct DeliveryError:runtime_error{int status;DeliveryError(string message,int code=0):runtime_error(message),status(code){}};
struct RetryOptions {int retries=3,delay=0;};
struct Job {int id;string payload;};
struct JobResult {int id;optional<string> res,error;};
struct Queue {function<void(int)> ack;function<void(const Job&,const string&)> deadLetter;};
string withRetry(function<string()> fn,const RetryOptions& options=RetryOptions{}){
    if(options.retries<=0)throw invalid_argument("Invalid retries");
    for(int i=0;;i++)try{return fn();}catch(const DeliveryError& error){
        bool retry=error.status==0 || error.status==429 || error.status>=500;
        if(!retry || i+1>=options.retries)throw;
        this_thread::sleep_for(chrono::milliseconds(options.delay*(1LL<<min(i,20))));
    }
}
vector<JobResult> processBatch(const vector<Job>& jobs,Queue queue,function<string(string)> deliverWebhook,int concurrency=2){
    if(concurrency<=0)throw invalid_argument("Invalid concurrency");
    vector<JobResult> results(jobs.size());atomic<size_t> next{0};vector<future<void>> workers;
    for(int i=0;i<concurrency && i<int(jobs.size());i++)workers.push_back(async(launch::async,[&]{
        for(size_t index=next.fetch_add(1);index<jobs.size();index=next.fetch_add(1)){
            const auto& job=jobs[index];JobResult result{job.id,nullopt,nullopt};
            try{result.res=withRetry([&]{return deliverWebhook(job.payload);});}
            catch(const DeliveryError& error){result.error=error.what();queue.deadLetter(job,error.what());}
            queue.ack(job.id);results[index]=result;
        }
    }));
    exception_ptr failure;for(auto& worker:workers)try{worker.get();}catch(...){if(!failure)failure=current_exception();}
    if(failure)rethrow_exception(failure);return results;
}
''', [('error.status==0 || error.status==429 || error.status>=500', 'true'), ('i+1>=options.retries', 'i+1>=1'), ('queue.ack(job.id);results[index]=result;', 'results[index]=result;'), ('i<concurrency && i<int(jobs.size())','i<int(jobs.size())')], {
"test_ack_after_delivery": 'bool delivered=false,acked=false;Queue q{[&](int){require(delivered);acked=true;},[](const Job&,const string&){}};processBatch({{1,"x"}},q,[&](string){delivered=true;return "ok";});require(acked);',
"test_batch_waits": 'Queue q{[](int){},[](const Job&,const string&){}};auto r=processBatch({{1,"a"},{2,"b"}},q,[](string p){this_thread::sleep_for(chrono::milliseconds(p=="a"?10:1));return p;});require(r.size()==2 && r[0].res=="a" && r[1].res=="b");',
"test_concurrency_cap": 'atomic<int> active{0},peak{0};Queue q{[](int){},[](const Job&,const string&){}};processBatch({{1,"a"},{2,"b"},{3,"c"},{4,"d"}},q,[&](string p){int n=++active;int old=peak.load();while(old<n&&!peak.compare_exchange_weak(old,n)){}this_thread::sleep_for(chrono::milliseconds(10));--active;return p;},2);require(peak<=2 && active==0);',
"test_custom_options_unchanged": 'RetryOptions options{2,1};int n=0;require(withRetry([&]{if(++n==1)throw DeliveryError("retry",500);return string("ok");},options)=="ok");require(options.retries==2 && options.delay==1);',
"test_dead_letter_before_ack": 'vector<string> events;Queue q{[&](int){events.push_back("ack");},[&](const Job&,const string&){events.push_back("dead");}};auto r=processBatch({{1,"x"}},q,[](string)->string{throw DeliveryError("no",400);});require(events==vector<string>({"dead","ack"}) && r[0].error=="no");',
"test_dead_letter_failure_unacked": 'bool acked=false;Queue q{[&](int){acked=true;},[](const Job&,const string&){throw runtime_error("storage");}};throws([&]{processBatch({{1,"x"}},q,[](string)->string{throw DeliveryError("no",400);});});require(!acked);Queue broken{[](int){throw runtime_error("ack failed");},[](const Job&,const string&){}};throws([&]{processBatch({{1,"x"}},broken,[](string){return string("ok");});});',
"test_retry_defaults_immutable": 'for(int i=0;i<2;i++){int n=0;require(withRetry([&]{if(++n<3)throw DeliveryError("retry");return string("ok");})=="ok" && n==3);}',
"test_retry_policy": 'for(int status:{0,429,500,503}){int n=0;throws([&]{withRetry([&]()->string{++n;throw DeliveryError("last",status);});});require(n==3);}int n=0;throws([&]{withRetry([&]()->string{++n;throw DeliveryError("permanent",400);});});require(n==1);',
}, "withRetry uses DeliveryError.status (0 = network error) and immutable RetryOptions. Retry only 0, 429, and 5xx; retries is total attempts, delay is milliseconds with exponential backoff. processBatch uses futures/threads, waits for all workers, caps concurrency and preserves input order. Queue callbacks must be thread-safe. Dead-letter failed deliveries durably before ack; dead-letter/ack failure rejects the batch. Return JobResult with res or error. Do not mutate job/options inputs.")

def build():
    repairs = {}
    for folder, (code, bugs, tests, contract, support) in VARIANTS.items():
        original = json.loads((CHALLENGES / folder / "challenge.json").read_text())
        root = CHALLENGES / folder / "cpp"
        (root / "starter").mkdir(parents=True, exist_ok=True)
        (root / "tests").mkdir(exist_ok=True)
        fixed = PRELUDE + ('#include "support.hpp"\n' if support else '') + code
        broken = fixed
        for before, after in bugs:
            assert before in broken, (folder, before)
            broken = broken.replace(before, after)
        (root / "starter" / "solution.hpp").write_text(broken, encoding="utf-8")
        repairs[original["id"]] = {"solution.hpp": fixed}
        test_source = '''#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("AssertionError: expected true, received false");}
inline void near(double a,double b){if(!(abs(a-b)<0.000001))throw runtime_error("Expected " + to_string(b) + ", received " + to_string(a));}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
'''
        test_source += ',\n'.join('{"'+name+'", []{'+body+'}}' for name, body in sorted(tests.items())) + '\n};}\n'
        (root / "starter" / "test_contract.hpp").write_text(test_source, encoding="utf-8")
        (root / "tests" / "test_contract.hpp").write_text(test_source, encoding="utf-8")
        readonly = ["README.md", "test_contract.hpp"]
        if support:
            (root / "starter" / "support.hpp").write_text(PRELUDE + support, encoding="utf-8")
            readonly.append("support.hpp")
        (root / "starter" / "README.md").write_text('# '+original["title"]+' (C++)\n\n'+original["description"]+'\n\n'+contract+'\n\nEdit solution.hpp. Read-only tests show the public interface. Run Tests compiles and runs the repository in the C++ sandbox.\n', encoding="utf-8")
        manifest = {**original, "language":"cpp", "expectedBehavior":contract,
                    "editableFiles":["solution.hpp"], "readOnlyFiles":readonly,
                    "entrypoint":"solution.hpp", "testFile":"test_contract.hpp",
                    "testNames":sorted(tests), "bugs":[],
                    "constraints":["Preserve the documented C++ interfaces.", "Use the C++17 standard library and supplied read-only helpers only.", "Do not change read-only files or tests."]}
        (root / "challenge.json").write_text(json.dumps(manifest,indent=2)+'\n', encoding="utf-8")
    (ROOT / "tests" / "fixtures" / "repo_cpp_solutions.json").write_text(json.dumps(repairs,indent=2)+'\n', encoding="utf-8")

if __name__ == "__main__":
    from build_additional_repo_challenges import add_challenges
    add_challenges(variant)
    build()
