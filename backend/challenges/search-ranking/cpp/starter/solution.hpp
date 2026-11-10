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
struct Document{string id,text;};vector<string> tokenize(string text){vector<string> out;string word;for(unsigned char c:text){if((c>='a'&&c<='z')||(c>='A'&&c<='Z')||(c>='0'&&c<='9'))word+=char(tolower(c));else if(!word.empty()){out.push_back(word);word.clear();}}if(!word.empty())out.push_back(word);return out;}vector<string> search(const vector<Document>& documents,string query){map<string,bool> words;for(auto word:tokenize(query))words[word]=true;map<string,bool> seen;vector<pair<int,string>> scores;for(auto doc:documents){if(doc.id.empty()||seen.count(doc.id))throw invalid_argument("id");seen[doc.id]=true;map<string,int> counts;for(auto token:tokenize(doc.text))counts[token]++;bool match=!words.empty();int score=0;for(auto word:words){if(counts[word.first])match=true;score+=counts[word.first];}if(match)scores.push_back({-score,doc.id});}vector<string> out;for(auto row:scores)out.push_back(row.second);return out;}
