import pytest

from piston.testcases import UnsupportedProblem, build_test_cases, parse_expected, parse_inputs


def test_parse_inputs_groups_arguments():
    assert parse_inputs("[1,2]\n9\n[3,3]\n6", 2) == [
        [[1, 2], 9],
        [[3, 3], 6],
    ]


def test_parse_expected_unescapes_html():
    assert parse_expected("<pre>Output: [0,1]</pre>\nOutput: 2") == [[0, 1], 2]


def test_build_test_cases_uses_signature_and_expected_values():
    problem = {
        "starter_code": {
            "python3": "class Solution:\n    def twoSum(self, nums, target):\n        "
        },
        "example_testcases": "[2,7]\n9",
        "description_html": "<pre>Output: [0,1]</pre>",
    }
    assert build_test_cases(problem) == [{"input": [[2, 7], 9], "expected": [0, 1]}]


def test_unsupported_data_structures_are_rejected():
    with pytest.raises(UnsupportedProblem):
        from piston.testcases import parse_signature

        parse_signature("class Solution:\n    def reverse(self, head: ListNode):")
