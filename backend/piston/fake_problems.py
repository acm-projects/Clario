"""
TEMPORARY test data so you can try /run/tests before get_problem() exists.
Delete this file once load_problem() uses the real database.
"""
FAKE_PROBLEMS = {
    "two-sum": {
        "slug": "two-sum",
        "description_html": """
<p><strong>Example 1</strong></p>
<pre>Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: nums[0] + nums[1] equals 9.</pre>
<p><strong>Example 2</strong></p>
<pre>Input: nums = [3,2,4], target = 6
Output: [1,2]</pre>
<p><strong>Example 3</strong></p>
<pre>Input: nums = [3,3], target = 6
Output: [0,1]</pre>""",
        "example_testcases": "[2,7,11,15]\n9\n[3,2,4]\n6\n[3,3]\n6",
        "starter_code": {
            "python3": "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        ",
            "java": "",
        },
    },
    "reverse-linked-list": {
        "slug": "reverse-linked-list",
        "description_html": "<pre>Input: head = [1,2,3]\nOutput: [3,2,1]</pre>",
        "example_testcases": "[1,2,3]",
        "starter_code": {
            "python3": "# Definition for singly-linked list.\n# class ListNode:\n#     pass\nclass Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        ",
            "java": "",
        },
    },
}