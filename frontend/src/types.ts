export type Problem = {
  slug: string;
  leetcode_id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: string[];
  description_html: string;
  example_testcases: string;
  starter_code: { python3: string; java: string };
};

export const fakeProblem: Problem = {
  slug: "two-sum",
  leetcode_id: 1,
  title: "Two Sum",
  difficulty: "Easy",
  topics: ["Array", "Hash Table"],
  description_html: `
    <p>Given an integer array <code>nums</code> and an integer <code>target</code>, find the positions of two different elements whose values add up to <code>target</code>.</p>
    <p>Return the two indices in either order. Each input is designed to have exactly one valid pair, and you may not use the same array element twice.</p>
    <p><strong>Example 1</strong></p>
    <pre>Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
Explanation: nums[0] + nums[1] equals 9.</pre>
    <p><strong>Example 2</strong></p>
    <pre>Input: nums = [3, 2, 4], target = 6
Output: [1, 2]</pre>
    <p><strong>Example 3</strong></p>
    <pre>Input: nums = [3, 3], target = 6
Output: [0, 1]</pre>
    <p><strong>Constraints</strong></p>
    <ul>
      <li><code>2 &lt;= nums.length &lt;= 10,000</code></li>
      <li><code>-1,000,000,000 &lt;= nums[i] &lt;= 1,000,000,000</code></li>
      <li><code>-1,000,000,000 &lt;= target &lt;= 1,000,000,000</code></li>
      <li>Exactly one pair of distinct indices produces the target.</li>
    </ul>`,
  example_testcases: "[2,7,11,15]\n9",
  starter_code: {
    python3: "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        ",
    java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}",
  },
};
export type Language = keyof Problem["starter_code"];
