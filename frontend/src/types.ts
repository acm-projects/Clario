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

export type Language = keyof Problem["starter_code"];
