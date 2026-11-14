# The Transfer That Charges Twice

Retried payment transfers debit accounts twice and rejected transfers leave balances inconsistent.

Ledger stores nonnegative integer cent balances. transfer(key,source,target,cents) validates a positive amount, distinct existing accounts, sufficient funds and a nonempty key. Replaying the identical key/request has no effect; conflicting reuse throws. Failed requests change neither balances nor replay keys. C++ exposes Ledger.balances as map<string,long long>.

Start in service.py; policy.py records the shared mutation policy. Tests are read-only.
