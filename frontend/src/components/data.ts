import type { Problem } from "../types";

export const problem: Problem = {
  slug: "two-sum",
  leetcode_id: 1,
  title: "Two Sum",
  difficulty: "Easy",
  topics: ["Array", "Hash Table"],
  description_html: `
<p>You are given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to target.</em></p>
<p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p>
<p class="example-title"><strong>Example 1:</strong></p>
<pre><strong>Input:</strong> nums = [2,7,11,15], target = 9
<strong>Output:</strong> [0,1]</pre>`,
  example_testcases: "[2,7,11,15]\n9",
  starter_code: {
    java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        int[] sol = new int[2];

        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] == target) {
                    sol[0] = i;
                    sol[1] = j;
                    return sol;
                }
            }
        }
        return sol;
    }
}`,
    python3: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, n in enumerate(nums):
            if target - n in seen:
                return [seen[target - n], i]
            seen[n] = i
        return []`,
  },
};

// Session state, not part of the Problem type.
export const session = {
  timer: "24:17",
  round: "Technical round",
  interviewer: "Clario",
  solved: true,
};
