# The Importer That Splits Customer Names

Quoted customer names split into extra columns and doubled quotes are silently stripped during a CSV import.

parse_row(line) parses one CSV record into string fields. Support comma separators, quoted commas, doubled quotes inside quoted fields, empty fields, and a trailing empty field. Quotes must begin at field start and close before a separator/end. Reject malformed or unterminated quotes and CR/LF (one record only). Empty input is one empty field. C++ returns vector<string>.

Start in service.py; policy.py records the shared mutation policy. Tests are read-only.
