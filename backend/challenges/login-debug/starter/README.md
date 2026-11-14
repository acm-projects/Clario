# Demo login incident

`main.login` receives raw form values and calls `auth.authenticate`.
`users.py` supplies read-only dummy user records. These are not real
credentials and this sample is not production authentication code.

Usernames are case-insensitive and may contain surrounding whitespace.
Passwords must match exactly, including case and whitespace. Only active
users may log in. Invalid input types, empty fields, missing users, and
wrong credentials return False, never an exception. Both public functions
must honor this contract. Do not alter user records to make tests pass.
