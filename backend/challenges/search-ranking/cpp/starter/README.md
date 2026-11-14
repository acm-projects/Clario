# The Search That Matches the Wrong Products (C++)

Searching for a complete word matches unrelated substrings, and changing input order changes tied search results.

search(documents,query) tokenizes ASCII alphanumeric words case-insensitively. Every distinct query word must occur as a complete token in the document text. Rank matching documents by total occurrences of query words descending, then ID ascending. Empty queries return empty. Reject duplicate/empty IDs. Never mutate input. Python documents are {id,text}; C++ Document has string id,text.

Edit solution.hpp. Read-only tests show the public interface. Run Tests compiles and runs the repository in the C++ sandbox.
