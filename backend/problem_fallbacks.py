"""A small bundled practice problem for upstream outages."""
from copy import deepcopy

TWO_SUM = {
    "slug": "two-sum", "leetcode_id": "1", "title": "Two Sum", "difficulty": "Easy", "topics": ["Array", "Hash Table"],
    "description_html": "<p>Given a list of integers nums and an integer target, return the indices of two different entries whose sum equals target. Each input has exactly one valid pair. Return the indices in either order.</p><p>Example 1: nums = [2, 7, 11, 15], target = 9.</p><p><strong>Output:</strong> [0,1]</p><p>Example 2: nums = [3, 2, 4], target = 6.</p><p><strong>Output:</strong> [1,2]</p><p>Example 3: nums = [3, 3], target = 6.</p><p><strong>Output:</strong> [0,1]</p>",
    "example_testcases": "[2,7,11,15]\n9\n[3,2,4]\n6\n[3,3]\n6",
    "starter_code": {"python3": "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        pass\n", "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[0];\n    }\n}\n"},
}

def bundled_problem(slug):
    return deepcopy(TWO_SUM) if slug == "two-sum" else None
