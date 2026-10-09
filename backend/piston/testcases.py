"""
testcases.py  --  turns a LeetCode problem into a list of test cases.

it should return something like :
    [{"input": [[2,7,11,15], 9], "expected": [0,1]}, ...]
          ^ one value per method parameter, in order
"""
import ast
import html
import json
import re
from typing import Any

#makeing our own kind of error
class UnsupportedProblem(Exception):
    """Raised when we can't build test cases (ListNode, TreeNode, design problems...)."""

#figure out what function the user needs to write + takes the starter code from LeetCode
def parse_signature(starter_code: str) -> tuple[str, list[str]]:
    """
    Reads the Python starter code and returns (method_name, [param names]).
    Example: "def twoSum(self, nums, target)" -> ("twoSum", ["nums", "target"])
    """
    #check whether problem is supported
    if "class Solution" not in starter_code:
        raise UnsupportedProblem("Test cases not supported for this problem yet")
    #these data structures need special handling so reject for now
    if re.search(r"\b(ListNode|TreeNode|Node)\b", starter_code):
        raise UnsupportedProblem("Test cases not supported for this problem yet")

    # The starter code stops right after the `def ...:` line, so there's no body yet.
    # Adding "pass" makes it valid Python that we can read.
    # (ast.parse never runs the code or checks that `List` exists.)
    try:
        tree = ast.parse(starter_code.rstrip() + " pass")
    except SyntaxError:
        raise UnsupportedProblem("Test cases not supported for this problem yet")

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name != "__init__":
            params = [a.arg for a in node.args.args if a.arg != "self"]
            return node.name, params
    raise UnsupportedProblem("Test cases not supported for this problem yet")

#turning leetcodes raw inputs into test cases based on number of params
def parse_inputs(example_testcases: str, n_params: int) -> list[list[Any]]:
    lines = [ln for ln in example_testcases.split("\n") if ln.strip()]
    cases = []
    for i in range(0, len(lines) - n_params + 1, n_params):
        cases.append([json.loads(x) for x in lines[i:i + n_params]])
    return cases

#extracts the correct outputs from LeetCodes HTML description
def parse_expected(description_html: str) -> list[Any]:
    """
    Finds each 'Output: ...' line in the problem description (Example 1, 2, 3...)
    and turns it into a Python value. Unparseable ones become a sentinel None-marker.
    """
    text = re.sub(r"<[^>]+>", "", description_html)   # remove HTML tags
    text = html.unescape(text)                         # &lt; -> <  etc.
    found = []
    for m in re.finditer(r"^\s*Output:\s*(.+)$", text, re.MULTILINE):
        try:
            found.append(json.loads(m.group(1).strip()))
        except ValueError:
            found.append(_UNPARSEABLE)
    return found


_UNPARSEABLE = object()

#calls both functions and pairs each input with expected output
def build_test_cases(problem: dict) -> list[dict]:
    """
    Main function. problem = what get_problem(slug) returns.
    Returns [{"input": [...], "expected": ...}, ...]
    Raises UnsupportedProblem if we can't do this problem yet.
    """
    method_name, params = parse_signature(problem["starter_code"]["python3"])
    try:
        inputs = parse_inputs(problem["example_testcases"], len(params))
    except ValueError:
        raise UnsupportedProblem("Test cases not supported for this problem yet")
    expected = parse_expected(problem["description_html"])

    cases = []
    # zip stops at the shorter list, so we only keep cases that have BOTH an input and an answer
    for args, exp in zip(inputs, expected):
        if exp is _UNPARSEABLE:
            continue
        cases.append({"input": args, "expected": exp})

    if not cases:
        raise UnsupportedProblem("Test cases not supported for this problem yet")
    return cases