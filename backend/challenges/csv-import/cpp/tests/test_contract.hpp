#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("AssertionError: expected true, received false");}
inline void near(double a,double b){if(!(abs(a-b)<0.000001))throw runtime_error("Expected " + to_string(b) + ", received " + to_string(a));}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_escaped_quotes", []{require(parse_row("\"Say \"\"hi\"\"\",ok")==vector<string>({"Say \"hi\"","ok"}));}},
{"test_invalid_and_empty", []{require(parse_row("")==vector<string>({""}));for(string line:{"\"missing","ab\"cd","\"x\"y","a\nb"})throws([&]{parse_row(line);});}},
{"test_quoted_comma", []{require(parse_row("\"Doe, Jane\",active")==vector<string>({"Doe, Jane","active"}));}},
{"test_simple_and_trailing", []{require(parse_row("a,b,")==vector<string>({"a","b",""}));}}
};}
