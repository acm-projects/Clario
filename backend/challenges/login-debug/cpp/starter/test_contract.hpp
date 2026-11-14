#pragma once
#include "solution.hpp"
inline void require(bool ok){if(!ok)throw runtime_error("Contract check failed");}
inline void near(double a,double b){require(abs(a-b)<0.000001);}
template<class F> void throws(F fn){bool caught=false;try{fn();}catch(const exception&){caught=true;}require(caught);}
inline map<string,function<void()>> tests(){return {
{"test_inactive_user", []{require(!login("paused","Paused123!"));}},
{"test_invalid_inputs", []{require(!login(nullopt,nullopt) && !login("","") && !authenticate("alice",""));}},
{"test_invalid_password", []{require(!login("alice","wrong"));}},
{"test_password_case", []{require(!login("alice","riverduck42!"));}},
{"test_password_whitespace", []{require(!login("alice"," RiverDuck42! ") && login("space"," two spaces ") && !login("space","two spaces"));}},
{"test_unknown_user", []{require(!authenticate("nobody","RiverDuck42!"));}},
{"test_username_normalization", []{require(login("  ALIce  ","RiverDuck42!"));}},
{"test_valid_credentials", []{require(login("alice","RiverDuck42!") && authenticate("bob","pond-pass"));}}
};}
