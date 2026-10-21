"""
harness.py  --  wraps the user's code with "driver" code that runs the test cases.

The user's code only DEFINES a class. Nothing calls it. So we add code at the
bottom that calls it once per test case and prints the results as JSON.
"""
import json
from typing import Optional

MARKER = "__CLARIO_RESULTS__"

# Runs AFTER the user's code. __CASES__ / __METHOD__ get filled in below.
# (We use .replace instead of an f-string because this code is full of { } braces.)
_DRIVER = '''
import json as __json
__cases = __json.loads(__CASES__)
__results = []
for __args in __cases:
    try:
        __out = getattr(Solution(), __METHOD__)(*__args)
        __results.append({"ok": True, "output": __out})
    except Exception as __e:
        __results.append({"ok": False, "error": type(__e).__name__ + ": " + str(__e)})
print("\\n" + __MARKER__ + __json.dumps(__results, default=repr))
'''

#now we're swapping in real values from the users code
def wrap_python(user_code: str, method_name: str, cases: list[list]) -> str:
    """cases here is just the argument lists, e.g. [[[2,7,11,15], 9], [[3,2,4], 6]]"""
    driver = (
        _DRIVER
        .replace("__CASES__", repr(json.dumps(cases)))   # repr() makes it a safe Python string
        .replace("__METHOD__", repr(method_name))
        .replace("__MARKER__", repr(MARKER))
    )
    # Imports go on ONE line at the top so the user's line numbers only shift by 1.
    return "from typing import List, Optional\n" + user_code + "\n" + driver

#if the marker never appeared the the program crashed or timed out, so we return None for results
def split_output(stdout: str) -> tuple[str, Optional[list[dict]]]:
    if MARKER not in stdout:
        return stdout, None
    before, _, after = stdout.rpartition(MARKER)
    try:
        results = json.loads(after.strip().splitlines()[0])
    except (ValueError, IndexError):
        return before.rstrip("\n"), None
    return before.rstrip("\n"), results