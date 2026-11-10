// Executed in Piston only; include the candidate headers through the test suite.
#include <iostream>
#include <sstream>
#include <iomanip>
#include "_clario_tests.hpp"
std::string json_string(const std::string& value) {
    std::ostringstream out;
    out << '"';
    for (unsigned char c : value) {
        if (c == '"' || c == '\\') out << '\\' << c;
        else if (c < 32) out << "\\u" << std::hex << std::setw(4) << std::setfill('0') << int(c) << std::dec;
        else out << c;
    }
    out << '"';
    return out.str();
}
int main() {
    std::ostringstream sink;
    auto output = std::cout.rdbuf(sink.rdbuf());
    auto errors = std::cerr.rdbuf(sink.rdbuf());
    struct Result { std::string name; bool passed; std::string message; };
    std::vector<Result> rows;
    for (const auto& test : tests()) {
        bool passed = false;
        std::string message;
        try { test.second(); passed = true; }
        catch (const std::exception& e) { message = std::string("Unit test failed: ") + e.what(); }
        catch (...) { message = "Unit test raised an unknown exception."; }
        rows.push_back({test.first, passed, message});
        sink.str("");
    }
    std::cout.rdbuf(output);
    std::cerr.rdbuf(errors);
    std::cout << "__CLARIO_REPO_RESULTS__[";
    for (size_t i = 0; i < rows.size(); ++i) {
        if (i) std::cout << ',';
        std::cout << "{\"name\":\"" << rows[i].name << "\",\"passed\":"
                  << (rows[i].passed ? "true" : "false") << ",\"message\":" << json_string(rows[i].message.substr(0, 3000)) << '}';
    }
    std::cout << ']';
}
