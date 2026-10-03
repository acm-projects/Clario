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
  description_html: "<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>",
  example_testcases: "[2,7,11,15]\n9",
  starter_code: {
    python3: "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        ",
    java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}",
  },
};
export type Language = keyof Problem["starter_code"];
