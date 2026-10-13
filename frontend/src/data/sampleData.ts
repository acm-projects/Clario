import type { FeedbackInterview } from "../lib/feedback";
import type { ProblemSummary } from "../lib/problems";

// Preview fixtures only. Never persisted to accounts or the database.
export const sampleProblems: ProblemSummary[] = [
  { slug: "two-sum", leetcode_id: 1, title: "Two Sum", difficulty: "Easy", topics: ["Arrays", "Hash Table"], description_html: "<p>Find two numbers that add up to a target. Explain how a hash map avoids checking every pair.</p>" },
  { slug: "valid-parentheses", leetcode_id: 20, title: "Valid Parentheses", difficulty: "Easy", topics: ["Stack", "Strings"], description_html: "<p>Determine whether brackets are correctly matched and nested. Consider empty input and unmatched closing brackets.</p>" },
  { slug: "group-anagrams", leetcode_id: 49, title: "Group Anagrams", difficulty: "Medium", topics: ["Strings", "Hash Table"], description_html: "<p>Group words that contain the same letters. Compare sorting with using character counts as a key.</p>" },
  { slug: "binary-tree-level-order-traversal", leetcode_id: 102, title: "Binary Tree Level Order Traversal", difficulty: "Medium", topics: ["Trees", "Breadth-First Search"], description_html: "<p>Return the values of a binary tree one level at a time. Explain how a queue tracks each level.</p>" },
  { slug: "merge-k-sorted-lists", leetcode_id: 23, title: "Merge k Sorted Lists", difficulty: "Hard", topics: ["Linked List", "Heap"], description_html: "<p>Merge sorted linked lists into one sorted list. Compare a min-heap with divide and conquer.</p>" },
  { slug: "trapping-rain-water", leetcode_id: 42, title: "Trapping Rain Water", difficulty: "Hard", topics: ["Arrays", "Two Pointers"], description_html: "<p>Calculate water trapped between elevation bars. Explain the invariant behind a two-pointer solution.</p>" },
];
export const sampleFeedback: FeedbackInterview[] = [
  { id: "DEMO-006", topic: "Merge k Sorted Lists", difficulty: "Hard", date: "2026-10-12T15:00:00Z", summary: null, status: "Pending", scores: { technical_score: null, reasoning_score: null, communication_score: null, overall_score: null } },
  { id: "DEMO-005", topic: "Binary Tree Level Order Traversal", difficulty: "Medium", date: "2026-10-11T15:00:00Z", summary: "Clear queue-based solution. Explain space complexity using the widest level.", status: "Available", scores: { technical_score: 88, reasoning_score: 84, communication_score: 91, overall_score: 88 } },
  { id: "DEMO-004", topic: "Group Anagrams", difficulty: "Medium", date: "2026-10-09T15:00:00Z", summary: "Good frequency key. Discuss alphabet assumptions before estimating complexity.", status: "Available", scores: { technical_score: 82, reasoning_score: 79, communication_score: 85, overall_score: 82 } },
  { id: "DEMO-003", topic: "Trapping Rain Water", difficulty: "Hard", date: "2026-10-07T15:00:00Z", summary: "Strong boundary reasoning. Communication feedback is still pending.", status: "Available", scores: { technical_score: 75, reasoning_score: 83, communication_score: null, overall_score: 79 } },
  { id: "DEMO-002", topic: "Valid Parentheses", difficulty: "Easy", date: "2026-10-05T15:00:00Z", summary: "Correct stack solution. Add empty-input and unmatched-bracket tests.", status: "Available", scores: { technical_score: 74, reasoning_score: 70, communication_score: 78, overall_score: 74 } },
  { id: "DEMO-001", topic: "Two Sum", difficulty: "Easy", date: "2026-10-03T15:00:00Z", summary: "Working solution. Practice explaining the one-pass hash map and duplicate values.", status: "Available", scores: { technical_score: 65, reasoning_score: 62, communication_score: 71, overall_score: 66 } },
];
