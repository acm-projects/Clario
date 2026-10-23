export type PracticeLanguage = "Python" | "Java";
export type LanguagesUsed = "Python" | "Java" | "both" | "neither" | "other";
export type ProblemDifficulty = "easy" | "medium" | "hard";
export type QuestionId = "leetcode" | "coding" | "used" | "language" | "languageComfort" | "interviewConfidence" | "weekly" | "strugglingTopics" | "targetCompany" | "interviewDate";

export interface OnboardingAnswers {
  hasLeetCodeExperience: boolean | null;
  hasCodingExperience: boolean | null;
  languagesUsed: LanguagesUsed | null;
  selectedLanguage: PracticeLanguage | null;
  languageComfort: number | null;
  interviewConfidence: number | null;
  weeklyInterviewGoal: number | null;
  difficulty: ProblemDifficulty | null;
  strugglingTopics: string[];
  targetCompany: string;
  interviewDate: string;
}

export const initialAnswers: OnboardingAnswers = {
  hasLeetCodeExperience: null,
  hasCodingExperience: null,
  languagesUsed: null,
  selectedLanguage: null,
  languageComfort: null,
  interviewConfidence: null,
  weeklyInterviewGoal: null,
  difficulty: null,
  strugglingTopics: [],
  targetCompany: "",
  interviewDate: "",
};

export const topicOptions = [
  "Array", "String", "Dynamic Programming", "Math", "Two Pointers",
  "Backtracking", "Hash Table", "Linked List", "Matrix", "Recursion",
  "Sorting", "Binary Search", "Stack", "Tree", "Binary Tree",
];

export function getStartingDifficulty(score: number): ProblemDifficulty {
  if (score <= 4) return "easy";
  if (score <= 7) return "medium";
  return "hard";
}

export function getQuestionPath(answers: OnboardingAnswers): QuestionId[] {
  if (answers.hasLeetCodeExperience !== false) {
    const languageQuestions: QuestionId[] =
      answers.languagesUsed === "Python" || answers.languagesUsed === "Java"
        ? ["used", "languageComfort"]
        : answers.languagesUsed === "other"
          ? ["used", "language", "languageComfort"]
          : ["used", "language", "languageComfort"];
    return ["leetcode", ...languageQuestions, "strugglingTopics", "weekly", "targetCompany", "interviewDate"];
  }
  if (answers.hasCodingExperience === false) {
    return ["leetcode", "coding", "language", "interviewConfidence", "weekly", "targetCompany", "interviewDate"];
  }
  const languageQuestions: QuestionId[] =
    answers.languagesUsed === "Python" || answers.languagesUsed === "Java"
      ? ["used", "languageComfort"]
      : ["used", "language", "languageComfort"];
  return ["leetcode", "coding", ...languageQuestions, "weekly", "targetCompany", "interviewDate"];
}

export function isBeginnerPath(answers: OnboardingAnswers): boolean {
  return answers.hasLeetCodeExperience === false && answers.hasCodingExperience === false;
}

export function getPracticeLanguage(answers: OnboardingAnswers): PracticeLanguage | null {
  if ((answers.hasLeetCodeExperience === true || (answers.hasLeetCodeExperience === false && answers.hasCodingExperience === true)) &&
      (answers.languagesUsed === "Python" || answers.languagesUsed === "Java")) return answers.languagesUsed;
  return answers.selectedLanguage;
}

export function normalizeAnswers(answers: OnboardingAnswers): OnboardingAnswers {
  const path = getQuestionPath(answers);
  const language = getPracticeLanguage(answers);
  const comfort = path.includes("languageComfort") ? answers.languageComfort : null;
  return {
    hasLeetCodeExperience: answers.hasLeetCodeExperience,
    hasCodingExperience: answers.hasLeetCodeExperience === false ? answers.hasCodingExperience : null,
    languagesUsed: path.includes("used") ? answers.languagesUsed : null,
    selectedLanguage: language,
    languageComfort: comfort,
    interviewConfidence: path.includes("interviewConfidence") ? answers.interviewConfidence : null,
    weeklyInterviewGoal: answers.weeklyInterviewGoal,
    difficulty: isBeginnerPath(answers) ? "easy" : comfort !== null ? getStartingDifficulty(comfort) : "easy",
    strugglingTopics: path.includes("strugglingTopics") ? [...new Set(answers.strugglingTopics)] : [],
    targetCompany: answers.targetCompany.trim(),
    interviewDate: answers.interviewDate,
  };
}

export function validateQuestion(id: QuestionId, answers: OnboardingAnswers): string | null {
  if (id === "leetcode" && answers.hasLeetCodeExperience === null) return "Choose Yes or No to continue.";

  if (id === "coding" && answers.hasCodingExperience === null) return "Choose Yes or No to continue.";
  if (id === "used" && !(answers.hasLeetCodeExperience === true ? ["Python", "Java", "both", "other"] : ["Python", "Java", "both", "neither"]).includes(answers.languagesUsed ?? "")) return "Choose which languages you've used.";
  if (id === "language" && !getPracticeLanguage(answers)) return "Choose Python or Java to continue.";
  const rating = id === "languageComfort" ? answers.languageComfort : id === "interviewConfidence" ? answers.interviewConfidence : undefined;
  if (rating !== undefined && (rating === null || !Number.isInteger(rating) || rating < 0 || rating > 10)) return "Choose a comfort level from 0 to 10.";
  if (id === "weekly" && ![1, 2, 3, 4, 5].includes(answers.weeklyInterviewGoal ?? 0)) return "Choose a weekly mock interview goal.";
  if (id === "strugglingTopics" && answers.strugglingTopics.some(topic => !topicOptions.includes(topic))) return "Choose topics from the list.";
  if (id === "interviewDate" && answers.interviewDate) {
    const date = new Date(`${answers.interviewDate}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(answers.interviewDate) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== answers.interviewDate) return "Choose a valid interview date.";
  }
  return null;
}

export function buildPracticeProfile(answers: OnboardingAnswers) {
  for (const id of getQuestionPath(answers)) {
    const error = validateQuestion(id, answers);
    if (error) throw new Error(error);
  }
  const result = normalizeAnswers(answers);
  return {
    version: 2,
    completedAt: new Date().toISOString(),
    answers: result,
    recommendations: {
      language: result.selectedLanguage,
      difficulty: result.difficulty,
      mode: isBeginnerPath(answers) ? "guided" : "mock",
      // 5 represents the minimum target when the user chooses 5+.
      weeklyInterviewGoal: result.weeklyInterviewGoal,
      focusTopics: result.difficulty === "easy" ? ["Arrays", "Strings", "Hash maps"] : result.difficulty === "medium" ? ["Two pointers", "Binary search", "Trees"] : ["Graphs", "Dynamic programming", "Backtracking"],
    },
  };
}


