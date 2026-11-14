"""Thirteen additional, paired Python/C++ repository debugging exercises."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def add_challenges(register_cpp):
    repairs = {}

    def add(folder, title, description, contract, py, py_bugs, py_tests, cpp, cpp_bugs, cpp_tests, difficulty="Medium"):
        root = ROOT / "challenges" / folder
        (root / "starter").mkdir(parents=True, exist_ok=True)
        (root / "tests").mkdir(exist_ok=True)
        identifier = folder + "-01"
        broken = py
        for before, after in py_bugs:
            assert before in broken, (folder, before)
            broken = broken.replace(before, after)
        # A small separate policy module keeps file navigation part of the task.
        policy = '"""Shared policy: reject invalid requests without changing caller-owned data."""\nSTRICT = True\n'
        py = 'from policy import STRICT\n' + py
        broken = 'from policy import STRICT\n' + broken
        tests = 'import unittest\nfrom service import *\n\nclass Tests(unittest.TestCase):\n'
        for name, body in py_tests.items():
            tests += '    def '+name+'(self):\n' + '\n'.join('        '+line for line in body.splitlines()) + '\n'
        manifest = {"id":identifier, "title":title, "difficulty":difficulty, "language":"python", "category":"Debugging", "estimatedMinutes":30,
                    "description":description, "objective":"Trace the reported failures, repair the implementation, and verify edge cases without changing the public API.",
                    "expectedBehavior":contract,
                    "constraints":["Preserve the documented interfaces.", "Use the language standard library only; no network calls or external packages.", "Do not modify read-only tests or caller-owned data."],
                    "editableFiles":["service.py", "policy.py"], "readOnlyFiles":["README.md", "test_service.py"], "entrypoint":"service.py", "testFile":"test_service.py", "testNames":sorted(py_tests), "bugs":[]}
        (root / "challenge.json").write_text(json.dumps(manifest,indent=2)+'\n',encoding="utf-8")
        (root / "starter/service.py").write_text(broken,encoding="utf-8")
        (root / "starter/policy.py").write_text(policy,encoding="utf-8")
        (root / "starter/README.md").write_text('# '+title+'\n\n'+description+'\n\n'+contract+'\n\nStart in service.py; policy.py records the shared mutation policy. Tests are read-only.\n',encoding="utf-8")
        for where in ("starter", "tests"):
            (root / where / "test_service.py").write_text(tests,encoding="utf-8")
        repairs[identifier] = {"service.py":py,"policy.py":policy}
        if cpp.endswith(r"\n"):
            cpp = cpp[:-2] + "\n"
        register_cpp(folder,cpp,cpp_bugs,cpp_tests,contract)

    add("rate-limiter", "The Rate Limiter That Blocks Everyone",
        "One customer's requests block unrelated accounts, and requests are rejected after the rolling window should reset.",
        "RateLimiter(limit, window) requires positive values. allow(key, now) counts accepted requests in (now-window, now], separately per key. Rejecting a request must not extend its window. Timestamps are nondecreasing per key; reject backwards timestamps. C++ uses double seconds and string keys. Python rejects boolean limits.",
        '''class RateLimiter:
    def __init__(self, limit, window):
        if type(limit) is not int or limit <= 0 or window <= 0: raise ValueError("invalid config")
        self.limit, self.window, self.events, self.last = limit, window, {}, {}
    def allow(self, key, now):
        if now < self.last.get(key, now): raise ValueError("time moved backwards")
        self.last[key] = now
        events = [t for t in self.events.get(key, []) if t > now-self.window]
        allowed = len(events) < self.limit
        if allowed: events.append(now)
        self.events[key] = events
        return allowed
''', [('self.events.get(key, [])','self.events.get("global", [])'), ('self.events[key] = events','self.events["global"] = events'), ('t > now-self.window','t >= now-self.window')], {
"test_account_isolation": 'r=RateLimiter(1,10)\nself.assertTrue(r.allow("a",0))\nself.assertTrue(r.allow("b",0))',
"test_window_boundary": 'r=RateLimiter(1,10)\nr.allow("a",0)\nself.assertTrue(r.allow("a",10))',
"test_rejection_does_not_extend": 'r=RateLimiter(1,10)\nr.allow("a",0)\nself.assertFalse(r.allow("a",9))\nself.assertTrue(r.allow("a",10))',
"test_invalid_config_and_time": 'for limit,window in [(0,1),(1,0),(-1,1)]:\n    with self.assertRaises(ValueError): RateLimiter(limit,window)\nr=RateLimiter(1,10)\nr.allow("a",3)\nwith self.assertRaises(ValueError): r.allow("a",2)',
}, '''class RateLimiter {
    int limit;double window;map<string,vector<double>> events;map<string,double> last;
public:
    RateLimiter(int n,double seconds):limit(n),window(seconds){if(n<=0 || seconds<=0)throw invalid_argument("config");}
    bool allow(string key,double now){if(last.count(key)&&now<last[key])throw invalid_argument("backwards");last[key]=now;auto& rows=events[key];rows.erase(remove_if(rows.begin(),rows.end(),[&](double t){return t<=now-window;}),rows.end());bool ok=rows.size()<size_t(limit);if(ok)rows.push_back(now);return ok;}
};
''', [('auto& rows=events[key]', 'auto& rows=events["global"]'), ('t<=now-window','t<now-window')], {
"test_account_isolation": 'RateLimiter r(1,10);require(r.allow("a",0)&&r.allow("b",0));',
"test_window_boundary": 'RateLimiter r(1,10);r.allow("a",0);require(r.allow("a",10));',
"test_rejection_does_not_extend": 'RateLimiter r(1,10);r.allow("a",0);require(!r.allow("a",9)&&r.allow("a",10));',
"test_invalid_config_and_time": 'throws([]{RateLimiter r(0,1);});RateLimiter r(1,10);r.allow("a",3);throws([&]{r.allow("a",2);});',
})

    add("inventory-allocation", "The Warehouse That Loses Stock",
        "A failed multi-item order consumes inventory, and successful orders unexpectedly modify the warehouse snapshot.",
        "allocate(stock, requests) returns a new stock mapping only if all requested SKUs exist and have sufficient quantity. Quantities must be positive integers and inventory nonnegative. Missing SKUs or insufficient stock throw. Validate everything before applying changes; never mutate inputs. C++ uses map<string,int>.",
        '''def allocate(stock, requests):
    if any(type(n) is not int or n < 0 for n in stock.values()): raise ValueError("invalid stock")
    result = dict(stock)
    for sku, qty in requests.items():
        if type(qty) is not int or qty <= 0: raise ValueError("invalid quantity")
        if sku not in result or result[sku] < qty: raise ValueError("unavailable")
        result[sku] -= qty
    return result
''', [('result = dict(stock)','result = stock'), ('result[sku] < qty','result[sku] <= qty')], {
"test_exact_stock": 'self.assertEqual(allocate({"a":2},{"a":2}),{"a":0})',
"test_no_input_mutation": 'stock={"a":5}\nself.assertEqual(allocate(stock,{"a":2}),{"a":3})\nself.assertEqual(stock,{"a":5})',
"test_failure_atomicity": 'stock={"a":5}\nwith self.assertRaises(ValueError): allocate(stock,{"a":2,"missing":1})\nself.assertEqual(stock,{"a":5})',
"test_invalid_quantities": 'for qty in [0,-1,True]:\n    with self.assertRaises(ValueError): allocate({"a":5},{"a":qty})',
}, '''map<string,int> allocate(const map<string,int>& stock,const map<string,int>& requests){for(auto row:stock)if(row.second<0)throw invalid_argument("stock");auto result=stock;for(auto row:requests){if(row.second<=0 || !result.count(row.first) || result.at(row.first)<row.second)throw invalid_argument("unavailable");result[row.first]-=row.second;}return result;}
''', [('result.at(row.first)<row.second','result.at(row.first)<=row.second'), ('result[row.first]-=row.second','result[row.first]-=1')], {
"test_exact_stock": 'require(allocate({{"a",2}},{{"a",2}}).at("a")==0);',
"test_no_input_mutation": 'map<string,int> stock={{"a",5}};require(allocate(stock,{{"a",2}}).at("a")==3&&stock.at("a")==5);',
"test_failure_atomicity": 'map<string,int> stock={{"a",5}};throws([&]{allocate(stock,{{"a",2},{"missing",1}});});require(stock.at("a")==5);',
"test_invalid_quantities": 'for(int n:{0,-1})throws([&]{allocate({{"a",5}},{{"a",n}});});',
}, difficulty="Easy")

    add("job-scheduler", "The Scheduler That Runs Jobs Too Soon",
        "Deployment jobs sometimes run before their prerequisites, and circular pipelines silently produce partial schedules.",
        "schedule(dependencies) returns each job once, after all prerequisites, picking the lexicographically smallest ready job each step. Every dependency must be a declared job. Duplicate dependency entries count once. Cycles and missing jobs throw; empty input returns empty. Never mutate the dependency graph. C++ uses map<string,vector<string>>.",
        '''def schedule(dependencies):
    remaining={job:set(needs) for job,needs in dependencies.items()}
    if any(need not in remaining for needs in remaining.values() for need in needs): raise ValueError("missing job")
    result=[]
    while remaining:
        ready=sorted(job for job,needs in remaining.items() if not needs)
        if not ready: raise ValueError("cycle")
        job=ready[0]; result.append(job); del remaining[job]
        for needs in remaining.values(): needs.discard(job)
    return result
''', [('if not ready: raise ValueError("cycle")','if not ready: return result'), ('if not needs','if needs')], {
"test_dependency_order": 'self.assertEqual(schedule({"deploy":["build"],"build":[]}),["build","deploy"])',
"test_lexical_and_duplicates": 'self.assertEqual(schedule({"c":["a","a"],"b":[],"a":[]}),["a","b","c"])',
"test_cycles_and_missing": 'for graph in [{"a":["a"]},{"a":["b"],"b":["a"]},{"a":["missing"]}]:\n    with self.assertRaises(ValueError): schedule(graph)',
"test_empty_and_immutable": 'graph={"a":[],"b":["a"]}\nschedule(graph)\nself.assertEqual(graph,{"a":[],"b":["a"]})\nself.assertEqual(schedule({}),[])',
}, '''vector<string> schedule(map<string,vector<string>> graph){for(auto row:graph)for(auto need:row.second)if(!graph.count(need))throw invalid_argument("missing");vector<string> result;while(!graph.empty()){auto ready=find_if(graph.begin(),graph.end(),[](auto row){return row.second.empty();});if(ready==graph.end())throw invalid_argument("cycle");string job=ready->first;result.push_back(job);graph.erase(job);for(auto& row:graph){auto& needs=row.second;needs.erase(remove(needs.begin(),needs.end(),job),needs.end());}}return result;}
''', [('return row.second.empty();','return !row.second.empty();'), ('if(ready==graph.end())throw invalid_argument("cycle");','if(ready==graph.end())return result;')], {
"test_dependency_order": 'require(schedule({{"deploy",{"build"}},{"build",{}}})==vector<string>({"build","deploy"}));',
"test_lexical_and_duplicates": 'require(schedule({{"c",{"a","a"}},{"b",{}},{"a",{}}})==vector<string>({"a","b","c"}));',
"test_cycles_and_missing": 'throws([]{schedule({{"a",{"a"}}});});throws([]{schedule({{"a",{"missing"}}});});',
"test_empty_and_immutable": 'map<string,vector<string>> g={{"a",{}},{"b",{"a"}}};auto before=g;schedule(g);require(g==before&&schedule({}).empty());',
}, difficulty="Hard")

    add("booking-intervals", "The Calendar That Merges Separate Meetings",
        "Adjacent meetings disappear into one booking and unsorted imports produce overlapping blocks.",
        "merge_bookings(intervals) sorts and merges overlapping half-open [start,end) intervals, keeping touching intervals separate. Require start < end. Preserve caller input; empty input returns empty. C++ uses vector<pair<int,int>>.",
        '''def merge_bookings(intervals):
    if any(start>=end for start,end in intervals): raise ValueError("invalid interval")
    result=[]
    for start,end in sorted(intervals):
        if result and start < result[-1][1]: result[-1]=(result[-1][0], max(result[-1][1],end))
        else: result.append((start,end))
    return result
''', [('start < result[-1][1]','start <= result[-1][1]'), ('max(result[-1][1],end)','end')], {
"test_overlapping_unsorted": 'self.assertEqual(merge_bookings([(5,9),(1,6)]),[(1,9)])',
"test_touching_separate": 'self.assertEqual(merge_bookings([(1,3),(3,5)]),[(1,3),(3,5)])',
"test_nested": 'self.assertEqual(merge_bookings([(1,10),(2,3),(4,5)]),[(1,10)])',
"test_invalid_empty_and_immutable": 'rows=[(3,4),(1,2)]\nmerge_bookings(rows)\nself.assertEqual(rows,[(3,4),(1,2)])\nself.assertEqual(merge_bookings([]),[])\nwith self.assertRaises(ValueError): merge_bookings([(1,1)])',
}, '''vector<pair<int,int>> merge_bookings(vector<pair<int,int>> rows){for(auto row:rows)if(row.first>=row.second)throw invalid_argument("interval");sort(rows.begin(),rows.end());vector<pair<int,int>> out;for(auto row:rows){if(!out.empty()&&row.first<out.back().second)out.back().second=max(out.back().second,row.second);else out.push_back(row);}return out;}
''', [('row.first<out.back().second','row.first<=out.back().second'), ('max(out.back().second,row.second)','row.second')], {
"test_overlapping_unsorted": 'require(merge_bookings({{5,9},{1,6}})==vector<pair<int,int>>({{1,9}}));',
"test_touching_separate": 'require(merge_bookings({{1,3},{3,5}})==vector<pair<int,int>>({{1,3},{3,5}}));',
"test_nested": 'require(merge_bookings({{1,10},{2,3},{4,5}})==vector<pair<int,int>>({{1,10}}));',
"test_invalid_empty_and_immutable": 'vector<pair<int,int>> rows={{3,4},{1,2}};auto old=rows;merge_bookings(rows);require(rows==old&&merge_bookings({}).empty());throws([]{merge_bookings({{1,1}});});',
}, difficulty="Easy")

    add("account-ledger", "The Transfer That Charges Twice",
        "Retried payment transfers debit accounts twice and rejected transfers leave balances inconsistent.",
        "Ledger stores nonnegative integer cent balances. transfer(key,source,target,cents) validates a positive amount, distinct existing accounts, sufficient funds and a nonempty key. Replaying the identical key/request has no effect; conflicting reuse throws. Failed requests change neither balances nor replay keys. C++ exposes Ledger.balances as map<string,long long>.",
        '''class Ledger:
    def __init__(self, balances):
        if any(type(n) is not int or n<0 for n in balances.values()): raise ValueError("invalid balance")
        self.balances=dict(balances); self.seen={}
    def transfer(self,key,source,target,cents):
        request=(source,target,cents)
        if key in self.seen:
            if self.seen[key]!=request: raise ValueError("conflicting key")
            return
        if not key or source==target or type(cents) is not int or cents<=0: raise ValueError("invalid request")
        if source not in self.balances or target not in self.balances or self.balances[source]<cents: raise ValueError("unavailable")
        self.balances[source]-=cents; self.balances[target]+=cents
        self.seen[key]=request
''', [('if self.seen[key]!=request: raise ValueError("conflicting key")','if False: raise ValueError("conflicting key")'), ('self.balances[target]+=cents','self.balances[target]+=1')], {
"test_transfer_and_conservation": 'l=Ledger({"a":1000,"b":100})\nl.transfer("k","a","b",200)\nself.assertEqual(l.balances,{"a":800,"b":300})',
"test_idempotency_and_conflict": 'l=Ledger({"a":1000,"b":0})\nl.transfer("k","a","b",100)\nl.transfer("k","a","b",100)\nself.assertEqual(l.balances["a"],900)\nwith self.assertRaises(ValueError): l.transfer("k","a","b",200)',
"test_failed_request_atomicity": 'l=Ledger({"a":100,"b":0})\nwith self.assertRaises(ValueError): l.transfer("k","a","b",200)\nl.transfer("k","a","b",100)\nself.assertEqual(l.balances,{"a":0,"b":100})',
"test_input_isolation_and_validation": 'b={"a":5,"b":0}\nl=Ledger(b)\nfor key,source,target,n in [("k","a","a",1),("","a","b",1),("k","a","b",0)]:\n    with self.assertRaises(ValueError): l.transfer(key,source,target,n)\nself.assertEqual(b,{"a":5,"b":0})',
}, '''class Ledger{map<string,tuple<string,string,long long>> seen;public:map<string,long long> balances;explicit Ledger(map<string,long long> b):balances(b){for(auto row:b)if(row.second<0)throw invalid_argument("balance");}void transfer(string key,string source,string target,long long cents){auto request=make_tuple(source,target,cents);if(seen.count(key)){if(seen[key]!=request)throw invalid_argument("conflict");return;}if(key.empty()||source==target||cents<=0||!balances.count(source)||!balances.count(target)||balances.at(source)<cents)throw invalid_argument("request");balances[source]-=cents;balances[target]+=cents;seen[key]=request;}};
''', [('if(seen[key]!=request)throw invalid_argument("conflict");',''), ('balances[target]+=cents','balances[target]+=1')], {
"test_transfer_and_conservation": 'Ledger l({{"a",1000},{"b",100}});l.transfer("k","a","b",200);require(l.balances.at("a")==800&&l.balances.at("b")==300);',
"test_idempotency_and_conflict": 'Ledger l({{"a",1000},{"b",0}});l.transfer("k","a","b",100);l.transfer("k","a","b",100);require(l.balances.at("a")==900);throws([&]{l.transfer("k","a","b",200);});',
"test_failed_request_atomicity": 'Ledger l({{"a",100},{"b",0}});throws([&]{l.transfer("k","a","b",200);});l.transfer("k","a","b",100);require(l.balances.at("a")==0&&l.balances.at("b")==100);',
"test_input_isolation_and_validation": 'map<string,long long> b={{"a",5},{"b",0}};Ledger l(b);throws([&]{l.transfer("k","a","a",1);});throws([&]{l.transfer("","a","b",1);});throws([&]{l.transfer("k","a","b",0);});require(b.at("a")==5);',
}, difficulty="Hard")

    add("csv-import", "The Importer That Splits Customer Names",
        "Quoted customer names split into extra columns and doubled quotes are silently stripped during a CSV import.",
        "parse_row(line) parses one CSV record into string fields. Support comma separators, quoted commas, doubled quotes inside quoted fields, empty fields, and a trailing empty field. Quotes must begin at field start and close before a separator/end. Reject malformed or unterminated quotes and CR/LF (one record only). Empty input is one empty field. C++ returns vector<string>.",
        '''def parse_row(line):
    if "\\n" in line or "\\r" in line: raise ValueError("one record only")
    fields=[]; value=""; quoted=False; closed=False; i=0
    while i<len(line):
        c=line[i]
        if quoted:
            if c=='"':
                if i+1<len(line) and line[i+1]=='"': value+='"'; i+=1
                else: quoted=False; closed=True
            else: value+=c
        elif c==',': fields.append(value); value=""; closed=False
        elif closed: raise ValueError("characters after quote")
        elif c=='"':
            if value: raise ValueError("quote inside unquoted field")
            quoted=True
        else: value+=c
        i+=1
    if quoted: raise ValueError("unterminated quote")
    fields.append(value)
    return fields
''', [("elif c==',': fields.append(value); value=\"\"; closed=False", "elif c==',': fields.append(value); closed=False"), ("value+='\"'; i+=1", "i+=1")], {
"test_simple_and_trailing": 'self.assertEqual(parse_row("a,b,"),["a","b",""])',
"test_quoted_comma": 'self.assertEqual(parse_row(\'"Doe, Jane",active\'),["Doe, Jane","active"])',
"test_escaped_quotes": 'self.assertEqual(parse_row(\'"Say ""hi""",ok\'),[\'Say "hi"\',"ok"])',
"test_invalid_and_empty": 'self.assertEqual(parse_row(""),[""])\nfor line in [\'"missing\',\'ab"cd\',\'"x"y\',"a\\nb"]:\n    with self.assertRaises(ValueError): parse_row(line)',
}, r'''vector<string> parse_row(string line){if(line.find_first_of("\r\n")!=string::npos)throw invalid_argument("one record");vector<string> fields;string value;bool quoted=false,closed=false;for(size_t i=0;i<line.size();i++){char c=line[i];if(quoted){if(c=='"'){if(i+1<line.size()&&line[i+1]=='"'){value+='"';i++;}else{quoted=false;closed=true;}}else value+=c;}else if(c==','){fields.push_back(value);value.clear();closed=false;}else if(closed)throw invalid_argument("after quote");else if(c=='"'){if(!value.empty())throw invalid_argument("quote");quoted=true;}else value+=c;}if(quoted)throw invalid_argument("unterminated");fields.push_back(value);return fields;}
''', [('value.clear();closed=false;','closed=false;'), ("value+='\"';i++;",'i++;')], {
"test_simple_and_trailing": 'require(parse_row("a,b,")==vector<string>({"a","b",""}));',
"test_quoted_comma": r'require(parse_row("\"Doe, Jane\",active")==vector<string>({"Doe, Jane","active"}));',
"test_escaped_quotes": r'require(parse_row("\"Say \"\"hi\"\"\",ok")==vector<string>({"Say \"hi\"","ok"}));',
"test_invalid_and_empty": r'require(parse_row("")==vector<string>({""}));for(string line:{"\"missing","ab\"cd","\"x\"y","a\nb"})throws([&]{parse_row(line);});',
})

    add("feature-rollout", "The Feature Flag That Ignores Opt-Outs",
        "Customers who explicitly opted out still receive a new feature, while allowlisted customers are blocked by rollout percentages.",
        "enabled(user,bucket,percent,allow,deny) validates percent in 0..100 and bucket in 0..99. Deny overrides allow; allow overrides percentage. Other users are enabled exactly when bucket < percent. Inputs are immutable. C++ uses vector<string> allow/deny and integer bucket/percent.",
        '''def enabled(user,bucket,percent,allow,deny):
    if type(bucket) is not int or type(percent) is not int or not 0<=bucket<100 or not 0<=percent<=100: raise ValueError("invalid rollout")
    if user in deny: return False
    if user in allow: return True
    return bucket < percent
''', [('if user in deny: return False','if user in deny: return True'), ('return bucket < percent','return bucket <= percent')], {
"test_deny_wins": 'self.assertFalse(enabled("a",0,100,["a"],["a"]))',
"test_allow_overrides_zero": 'self.assertTrue(enabled("a",99,0,["a"],[]))',
"test_rollout_boundary": 'self.assertFalse(enabled("a",20,20,[],[]))\nself.assertTrue(enabled("a",19,20,[],[]))\nself.assertFalse(enabled("a",0,0,[],[]))',
"test_invalid_and_no_mutation": 'a=["x"];d=["y"]\nenabled("a",1,50,a,d)\nself.assertEqual((a,d),(["x"],["y"]))\nwith self.assertRaises(ValueError): enabled("a",100,20,[],[])',
}, '''bool enabled(string user,int bucket,int percent,const vector<string>& allow,const vector<string>& deny){if(bucket<0||bucket>=100||percent<0||percent>100)throw invalid_argument("rollout");if(find(deny.begin(),deny.end(),user)!=deny.end())return false;if(find(allow.begin(),allow.end(),user)!=allow.end())return true;return bucket<percent;}
''', [('!=deny.end())return false','!=deny.end())return true'), ('return bucket<percent','return bucket<=percent')], {
"test_deny_wins": 'require(!enabled("a",0,100,{"a"},{"a"}));',
"test_allow_overrides_zero": 'require(enabled("a",99,0,{"a"},{}));',
"test_rollout_boundary": 'require(!enabled("a",20,20,{},{})&&enabled("a",19,20,{},{})&&!enabled("a",0,0,{},{}));',
"test_invalid_and_no_mutation": 'vector<string>a={"x"},d={"y"};enabled("a",1,50,a,d);require(a==vector<string>({"x"})&&d==vector<string>({"y"}));throws([]{enabled("a",100,20,{},{});});',
}, difficulty="Easy")

    add("route-matcher", "The Router That Sends Users to the Wrong Service",
        "The /api route captures /apiculture, and a generic route steals traffic from a more specific service.",
        "match_route(path,routes) returns the handler of the longest matching prefix at a path-segment boundary, or None/nullopt. / matches all absolute paths. Strip query strings from the request; ignore trailing slashes on prefixes except root. Require absolute request/prefix paths. C++ routes is map<string,string>. Inputs stay unchanged.",
        '''def match_route(path,routes):
    path=path.split("?",1)[0]
    if not path.startswith("/"): raise ValueError("absolute path required")
    candidates=[]
    for prefix,handler in routes.items():
        if not prefix.startswith("/"): raise ValueError("absolute prefix required")
        prefix=prefix.rstrip("/") or "/"
        if prefix=="/" or path==prefix or path.startswith(prefix+"/"): candidates.append((len(prefix),prefix,handler))
    return max(candidates)[2] if candidates else None
''', [('path.startswith(prefix+"/")','path.startswith(prefix)'), ('max(candidates)[2]','min(candidates)[2]')], {
"test_segment_boundary": 'self.assertIsNone(match_route("/apiculture",{"/api":"api"}))',
"test_longest_prefix": 'self.assertEqual(match_route("/api/users/42",{"/":"root","/api":"api","/api/users":"users"}),"users")',
"test_query_and_trailing": 'self.assertEqual(match_route("/api?debug=1",{"/api/":"api"}),"api")',
"test_invalid_and_empty": 'self.assertIsNone(match_route("/x",{}))\nwith self.assertRaises(ValueError): match_route("x",{})\nwith self.assertRaises(ValueError): match_route("/x",{"bad":"x"})',
}, '''optional<string> match_route(string path,const map<string,string>& routes){path=path.substr(0,path.find('?'));if(path.empty()||path[0]!='/')throw invalid_argument("path");optional<string> result;size_t longest=0;for(auto row:routes){string prefix=row.first;if(prefix.empty()||prefix[0]!='/')throw invalid_argument("prefix");while(prefix.size()>1&&prefix.back()=='/')prefix.pop_back();bool matches=prefix=="/"||path==prefix||path.rfind(prefix+"/",0)==0;if(matches&&prefix.size()>longest){longest=prefix.size();result=row.second;}}return result;}
''', [('path.rfind(prefix+"/",0)==0','path.rfind(prefix,0)==0'), ('prefix.size()>longest','(!result||prefix.size()<longest)')], {
"test_segment_boundary": 'require(!match_route("/apiculture",{{"/api","api"}}));',
"test_longest_prefix": 'require(match_route("/api/users/42",{{"/","root"},{"/api","api"},{"/api/users","users"}})=="users");',
"test_query_and_trailing": 'require(match_route("/api?debug=1",{{"/api/","api"}})=="api");',
"test_invalid_and_empty": 'require(!match_route("/x",{}));throws([]{match_route("x",{});});throws([]{match_route("/x",{{"bad","x"}});});',
})

    add("event-dedup", "The Event Feed That Keeps Stale Updates",
        "Replayed messages replace newer event data, and event order changes when the same batch is imported twice.",
        "latest_events(rows) selects the greatest version per event ID; equal versions keep the first record. Output is sorted by event ID. Reject empty IDs or negative versions, never mutate input. Python rows are dicts with id/version/value. C++ Event has string id, int version, string value.",
        '''def latest_events(rows):
    latest={}
    for row in rows:
        if not row["id"] or row["version"]<0: raise ValueError("invalid event")
        if row["id"] not in latest or row["version"]>latest[row["id"]]["version"]: latest[row["id"]]=dict(row)
    return [latest[key] for key in sorted(latest)]
''', [('row["version"]>latest[row["id"]]["version"]','row["version"]>=latest[row["id"]]["version"]'), ('for key in sorted(latest)','for key in latest')], {
"test_latest_and_stale": 'rows=[{"id":"a","version":2,"value":"new"},{"id":"a","version":1,"value":"old"}]\nself.assertEqual(latest_events(rows),[rows[0]])',
"test_ties_keep_first": 'rows=[{"id":"a","version":2,"value":"first"},{"id":"a","version":2,"value":"second"}]\nself.assertEqual(latest_events(rows),[rows[0]])',
"test_sorted_output": 'rows=[{"id":k,"version":1,"value":k} for k in ["z","a","m"]]\nself.assertEqual([r["id"] for r in latest_events(rows)],["a","m","z"])',
"test_invalid_empty_and_copy": 'self.assertEqual(latest_events([]),[])\nwith self.assertRaises(ValueError): latest_events([{"id":"","version":1,"value":"x"}])\nrows=[{"id":"a","version":1,"value":"x"}]\nlatest_events(rows)[0]["value"]="changed"\nself.assertEqual(rows[0]["value"],"x")',
}, '''struct Event{string id;int version;string value;};vector<Event> latest_events(const vector<Event>& rows){map<string,Event> latest;for(auto row:rows){if(row.id.empty()||row.version<0)throw invalid_argument("event");if(!latest.count(row.id)||row.version>latest.at(row.id).version)latest[row.id]=row;}vector<Event> result;for(auto row:latest)result.push_back(row.second);return result;}
''', [('row.version>latest.at(row.id).version','row.version>=latest.at(row.id).version'), ('result.push_back(row.second)','result.insert(result.begin(),row.second)')], {
"test_latest_and_stale": 'require(latest_events({{"a",2,"new"},{"a",1,"old"}})[0].value=="new");',
"test_ties_keep_first": 'require(latest_events({{"a",2,"first"},{"a",2,"second"}})[0].value=="first");',
"test_sorted_output": 'auto rows=latest_events({{"z",1,"z"},{"a",1,"a"},{"m",1,"m"}});require(rows[0].id=="a"&&rows[1].id=="m"&&rows[2].id=="z");',
"test_invalid_empty_and_copy": 'require(latest_events({}).empty());throws([]{latest_events({{"",1,"x"}});});vector<Event> rows={{"a",1,"x"}};auto out=latest_events(rows);out[0].value="changed";require(rows[0].value=="x");',
}, difficulty="Easy")

    add("sensor-window", "The Dashboard That Mixes Sensor Readings",
        "A sensor dashboard includes stale/future readings and leaks one device's samples into another device's average.",
        "window_average(rows,device,now,window) returns the arithmetic mean for that device at timestamps in (now-window,now], or None/nullopt if no matching readings. Require positive window. Input readings have device, time, value; zero and negative values are valid. C++ Reading has string device and double time/value. Never mutate rows.",
        '''def window_average(rows,device,now,window):
    if window<=0: raise ValueError("invalid window")
    values=[r["value"] for r in rows if r["device"]==device and now-window<r["time"]<=now]
    return sum(values)/len(values) if values else None
''', [('r["device"]==device and ','') , ('now-window<r["time"]<=now','now-window<=r["time"]')], {
"test_device_isolation": 'self.assertEqual(window_average([{"device":"a","time":5,"value":10},{"device":"b","time":5,"value":100}],"a",10,10),10)',
"test_boundaries": 'rows=[{"device":"a","time":t,"value":v} for t,v in [(0,100),(1,10),(10,20),(11,100)]]\nself.assertEqual(window_average(rows,"a",10,10),15)',
"test_zero_and_negative": 'rows=[{"device":"a","time":5,"value":v} for v in [0,-4]]\nself.assertEqual(window_average(rows,"a",10,10),-2)',
"test_empty_and_invalid": 'self.assertIsNone(window_average([],"a",10,10))\nwith self.assertRaises(ValueError): window_average([],"a",10,0)',
}, '''struct Reading{string device;double time,value;};optional<double> window_average(const vector<Reading>& rows,string device,double now,double window){if(window<=0)throw invalid_argument("window");double sum=0;int n=0;for(auto row:rows)if(row.device==device&&row.time>now-window&&row.time<=now){sum+=row.value;n++;}if(!n)return nullopt;return sum/n;}
''', [('row.device==device&&',''), ('row.time>now-window&&row.time<=now','row.time>=now-window')], {
"test_device_isolation": 'near(*window_average({{"a",5,10},{"b",5,100}},"a",10,10),10);',
"test_boundaries": 'near(*window_average({{"a",0,100},{"a",1,10},{"a",10,20},{"a",11,100}},"a",10,10),15);',
"test_zero_and_negative": 'near(*window_average({{"a",5,0},{"a",5,-4}},"a",10,10),-2);',
"test_empty_and_invalid": 'require(!window_average({},"a",10,10));throws([]{window_average({},"a",10,0);});',
})

    add("refund-ledger", "The Refund Service That Pays Too Much",
        "Partial refunds can exceed the original charge, and a rejected request consumes its retry key.",
        "RefundLedger(charged_cents) requires nonnegative integer cents. refund(key,cents) requires a nonempty key and positive cents, returns cumulative refunded cents, and must never exceed charged cents. Identical retry keys return the current cumulative total without paying again; conflicting amounts throw. A failed refund leaves totals and keys unchanged. C++ uses long long cents.",
        '''class RefundLedger:
    def __init__(self, charged_cents):
        if type(charged_cents) is not int or charged_cents<0: raise ValueError("charge")
        self.charged=charged_cents; self.total=0; self.seen={}
    def refund(self,key,cents):
        if not key or type(cents) is not int or cents<=0: raise ValueError("refund")
        if key in self.seen:
            if self.seen[key]!=cents: raise ValueError("conflict")
            return self.total
        if self.total+cents>self.charged: raise ValueError("excess refund")
        self.total+=cents; self.seen[key]=cents
        return self.total
''', [('self.total+cents>self.charged','cents>self.charged'), ('if self.seen[key]!=cents: raise ValueError("conflict")','if False: raise ValueError("conflict")')], {
"test_partial_and_exact": 'r=RefundLedger(1000)\nself.assertEqual(r.refund("a",400),400)\nself.assertEqual(r.refund("b",600),1000)',
"test_cumulative_limit": 'r=RefundLedger(1000)\nr.refund("a",600)\nwith self.assertRaises(ValueError): r.refund("b",500)\nself.assertEqual(r.total,600)',
"test_retry_and_conflict": 'r=RefundLedger(1000)\nr.refund("a",200)\nself.assertEqual(r.refund("a",200),200)\nwith self.assertRaises(ValueError): r.refund("a",300)',
"test_failed_key_and_validation": 'r=RefundLedger(100)\nwith self.assertRaises(ValueError): r.refund("key",200)\nself.assertEqual(r.refund("key",100),100)\nwith self.assertRaises(ValueError): r.refund("",1)',
}, '''class RefundLedger{long long charged;map<string,long long> seen;public:long long total=0;explicit RefundLedger(long long cents):charged(cents){if(cents<0)throw invalid_argument("charge");}long long refund(string key,long long cents){if(key.empty()||cents<=0)throw invalid_argument("refund");if(seen.count(key)){if(seen[key]!=cents)throw invalid_argument("conflict");return total;}if(cents>charged-total)throw invalid_argument("excess");total+=cents;seen[key]=cents;return total;}};
''', [('cents>charged-total','cents>charged'), ('if(seen[key]!=cents)throw invalid_argument("conflict");','')], {
"test_partial_and_exact": 'RefundLedger r(1000);require(r.refund("a",400)==400&&r.refund("b",600)==1000);',
"test_cumulative_limit": 'RefundLedger r(1000);r.refund("a",600);throws([&]{r.refund("b",500);});require(r.total==600);',
"test_retry_and_conflict": 'RefundLedger r(1000);r.refund("a",200);require(r.refund("a",200)==200);throws([&]{r.refund("a",300);});',
"test_failed_key_and_validation": 'RefundLedger r(100);throws([&]{r.refund("key",200);});require(r.refund("key",100)==100);throws([&]{r.refund("",1);});',
})

    add("permission-roles", "The Role Resolver That Grants Too Much",
        "Inherited denies are ignored and circular role inheritance causes inconsistent authorization decisions.",
        "can_access(roles,assigned,permission) traverses assigned roles and all parents. Any explicit deny wins over any allow; no matching allow means false. Unknown roles and reachable inheritance cycles throw. Duplicate roles are harmless; evaluate the whole reachable graph even when an allow is found. Python Role dicts contain parents/allow/deny lists; C++ Role has vector<string> parents,allow,deny. Never mutate inputs.",
        '''def can_access(roles, assigned, permission):
    visiting=set(); visited=set(); allowed=False; denied=False
    def visit(name):
        nonlocal allowed,denied
        if name in visiting: raise ValueError("cycle")
        if name in visited: return
        if name not in roles: raise ValueError("unknown role")
        visiting.add(name); role=roles[name]
        allowed=allowed or permission in role["allow"]
        denied=denied or permission in role["deny"]
        for parent in role["parents"]: visit(parent)
        visiting.remove(name); visited.add(name)
    for name in assigned: visit(name)
    return allowed and not denied
''', [('return allowed and not denied','return allowed'), ('if name in visiting: raise ValueError("cycle")','if name in visiting: return')], {
"test_inherited_allow": 'roles={"base":{"parents":[],"allow":["read"],"deny":[]},"child":{"parents":["base"],"allow":[],"deny":[]}}\nself.assertTrue(can_access(roles,["child"],"read"))',
"test_deny_overrides": 'roles={"base":{"parents":[],"allow":[],"deny":["read"]},"child":{"parents":["base"],"allow":["read"],"deny":[]}}\nself.assertFalse(can_access(roles,["child"],"read"))',
"test_cycle_and_unknown": 'roles={"a":{"parents":["a"],"allow":["read"],"deny":[]}}\nwith self.assertRaises(ValueError): can_access(roles,["a"],"read")\nwith self.assertRaises(ValueError): can_access({},["missing"],"read")',
"test_default_deny_and_duplicates": 'roles={"a":{"parents":[],"allow":["read"],"deny":[]}}\nself.assertFalse(can_access(roles,["a"],"write"))\nself.assertTrue(can_access(roles,["a","a"],"read"))\nself.assertFalse(can_access({},[],"read"))',
}, '''struct Role{vector<string> parents,allow,deny;};bool can_access(const map<string,Role>& roles,const vector<string>& assigned,string permission){map<string,int> state;bool allowed=false,denied=false;function<void(string)>visit=[&](string name){if(state[name]==1)throw invalid_argument("cycle");if(state[name]==2)return;if(!roles.count(name))throw invalid_argument("unknown");state[name]=1;const auto& role=roles.at(name);allowed=allowed||find(role.allow.begin(),role.allow.end(),permission)!=role.allow.end();denied=denied||find(role.deny.begin(),role.deny.end(),permission)!=role.deny.end();for(auto parent:role.parents)visit(parent);state[name]=2;};for(auto name:assigned)visit(name);return allowed&&!denied;}
''', [('return allowed&&!denied','return allowed'), ('if(state[name]==1)throw invalid_argument("cycle");','if(state[name]==1)return;')], {
"test_inherited_allow": 'require(can_access({{"base",{{},{"read"},{}}},{"child",{{"base"},{},{}}}},{"child"},"read"));',
"test_deny_overrides": 'require(!can_access({{"base",{{},{},{"read"}}},{"child",{{"base"},{"read"},{}}}},{"child"},"read"));',
"test_cycle_and_unknown": 'throws([]{can_access({{"a",{{"a"},{"read"},{}}}},{"a"},"read");});throws([]{can_access({},{"missing"},"read");});',
"test_default_deny_and_duplicates": 'map<string,Role> roles={{"a",{{},{"read"},{}}}};require(!can_access(roles,{"a"},"write")&&can_access(roles,{"a","a"},"read")&&!can_access({}, {},"read"));',
}, difficulty="Hard")

    add("search-ranking", "The Search That Matches the Wrong Products",
        "Searching for a complete word matches unrelated substrings, and changing input order changes tied search results.",
        "search(documents,query) tokenizes ASCII alphanumeric words case-insensitively. Every distinct query word must occur as a complete token in the document text. Rank matching documents by total occurrences of query words descending, then ID ascending. Empty queries return empty. Reject duplicate/empty IDs. Never mutate input. Python documents are {id,text}; C++ Document has string id,text.",
        '''import re
def search(documents,query):
    tokens=lambda text: re.findall(r"[a-z0-9]+",text.lower())
    words=set(tokens(query)); seen=set(); scored=[]
    for doc in documents:
        if not doc["id"] or doc["id"] in seen: raise ValueError("duplicate or empty id")
        seen.add(doc["id"]); body=tokens(doc["text"])
        if words and all(word in body for word in words): scored.append((-sum(body.count(w) for w in words),doc["id"]))
    return [identifier for _,identifier in sorted(scored)]
''', [('all(word in body for word in words)','any(word in body for word in words)'), ('for _,identifier in sorted(scored)','for _,identifier in scored')], {
"test_all_terms_and_whole_words": 'docs=[{"id":"a","text":"cart checkout"},{"id":"b","text":"cart"},{"id":"c","text":"cartwheel checkout"}]\nself.assertEqual(search(docs,"cart checkout"),["a"])',
"test_ranking_and_ties": 'docs=[{"id":"z","text":"duck"},{"id":"a","text":"duck"},{"id":"b","text":"duck duck"}]\nself.assertEqual(search(docs,"duck"),["b","a","z"])',
"test_case_and_duplicates_in_query": 'self.assertEqual(search([{"id":"a","text":"Blue-duck DUCK"}],"DUCK duck blue"),["a"])',
"test_empty_and_invalid_ids": 'self.assertEqual(search([],"duck"),[])\nself.assertEqual(search([{"id":"a","text":"duck"}],""),[])\nwith self.assertRaises(ValueError): search([{"id":"a","text":"x"},{"id":"a","text":"y"}],"x")',
}, '''struct Document{string id,text;};vector<string> tokenize(string text){vector<string> out;string word;for(unsigned char c:text){if((c>='a'&&c<='z')||(c>='A'&&c<='Z')||(c>='0'&&c<='9'))word+=char(tolower(c));else if(!word.empty()){out.push_back(word);word.clear();}}if(!word.empty())out.push_back(word);return out;}vector<string> search(const vector<Document>& documents,string query){map<string,bool> words;for(auto word:tokenize(query))words[word]=true;map<string,bool> seen;vector<pair<int,string>> scores;for(auto doc:documents){if(doc.id.empty()||seen.count(doc.id))throw invalid_argument("id");seen[doc.id]=true;map<string,int> counts;for(auto token:tokenize(doc.text))counts[token]++;bool match=!words.empty();int score=0;for(auto word:words){if(!counts[word.first])match=false;score+=counts[word.first];}if(match)scores.push_back({-score,doc.id});}sort(scores.begin(),scores.end());vector<string> out;for(auto row:scores)out.push_back(row.second);return out;}
''', [('if(!counts[word.first])match=false;','if(counts[word.first])match=true;'), ('sort(scores.begin(),scores.end());','')], {
"test_all_terms_and_whole_words": 'require(search({{"a","cart checkout"},{"b","cart"},{"c","cartwheel checkout"}},"cart checkout")==vector<string>({"a"}));',
"test_ranking_and_ties": 'require(search({{"z","duck"},{"a","duck"},{"b","duck duck"}},"duck")==vector<string>({"b","a","z"}));',
"test_case_and_duplicates_in_query": 'require(search({{"a","Blue-duck DUCK"}},"DUCK duck blue")==vector<string>({"a"}));',
"test_empty_and_invalid_ids": 'require(search({},"duck").empty()&&search({{"a","duck"}},"").empty());throws([]{search({{"a","x"},{"a","y"}},"x");});',
})

    (ROOT / "tests/fixtures/repo_additional_solutions.json").write_text(json.dumps(repairs,indent=2)+'\n',encoding="utf-8")
