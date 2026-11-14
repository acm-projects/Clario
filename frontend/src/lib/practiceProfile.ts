import { chicagoDate } from "./interviewCalendar.ts";

export type PracticeLanguage = "Python" | "Java";
export type LanguagesUsed = "Python" | "Java" | "both" | "neither" | "other";
export type ProblemDifficulty = "easy" | "medium" | "hard";
export type QuestionId = "leetcode" | "coding" | "used" | "language" | "languageComfort" | "interviewConfidence" | "weekly" | "strugglingTopics" | "targetCompany" | "interviewDate";

export interface OnboardingAnswers {
  hasLeetCodeExperience: boolean | null;
  hasCodingExperience: boolean | null;
  languagesUsed: LanguagesUsed | null;
  selectedLanguage: PracticeLanguage | "other" | null;
  otherLanguageUsed?: string;
  customLanguage?: string;
  languageComfort: number | null;
  languageRatings?: Record<string, number>;
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
  otherLanguageUsed: "",
  customLanguage: "",
  languageComfort: null,
  languageRatings: {},
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
    return ["leetcode", "coding", "language", "languageComfort", "interviewConfidence", "weekly", "targetCompany", "interviewDate"];
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
  if (answers.selectedLanguage === "other") {
    return answers.customLanguage?.trim().toLowerCase() === "java" ? "Java" : "Python";
  }
  return answers.selectedLanguage;
}

export function getChosenLanguage(answers: OnboardingAnswers): string | null {
  const usesPreviousLanguage = !isBeginnerPath(answers) && (answers.languagesUsed === "Python" || answers.languagesUsed === "Java");
  if (usesPreviousLanguage) return answers.languagesUsed;
  return answers.selectedLanguage === "other" ? answers.customLanguage?.trim() || null : answers.selectedLanguage;
}

export function languageKey(language: string): string {
  const key = language.trim().toLowerCase();
  return key === "python3" ? "python" : key;
}

export function getRatingLanguages(answers: OnboardingAnswers): {key: string; label: string}[] {
  const languages = new Map<string, string>([["python", "Python"], ["java", "Java"]]);
  if (getQuestionPath(answers).includes("used") && answers.languagesUsed === "other" && answers.otherLanguageUsed?.trim()) languages.set(languageKey(answers.otherLanguageUsed), answers.otherLanguageUsed.trim());
  if (getQuestionPath(answers).includes("language") && answers.selectedLanguage === "other" && answers.customLanguage?.trim()) languages.set(languageKey(answers.customLanguage), answers.customLanguage.trim());
  return [...languages].map(([key, label]) => ({key, label}));
}

export function getLanguageRatings(answers: OnboardingAnswers): Record<string, number> {
  // Legacy single ratings belong only to the language they originally described.
  const ratings = {...answers.languageRatings};
  if (answers.languageRatings === undefined && answers.languageComfort !== null) {
    const chosen = getChosenLanguage(answers);
    if (chosen) ratings[languageKey(chosen)] = answers.languageComfort;
  }
  return Object.fromEntries(getRatingLanguages(answers).filter(item => ratings[item.key] !== undefined).map(item => [item.key, ratings[item.key]]));
}

export function updateAssessmentAnswers(current: OnboardingAnswers, patch: Partial<OnboardingAnswers>): OnboardingAnswers {
  const next = { ...current, ...patch };
  if (next.languagesUsed !== "other") next.otherLanguageUsed = "";
  if (next.selectedLanguage !== "other" || !getQuestionPath(next).includes("language")) next.customLanguage = "";
  const currentRatings = getLanguageRatings(current);
  const previousLanguages = new Set(getRatingLanguages(current).map(item => item.key));
  const updatedRatings = patch.languageRatings ?? currentRatings;
  next.languageRatings = Object.fromEntries(getRatingLanguages(next)
    .filter(item => item.key === "python" || item.key === "java" || previousLanguages.has(item.key))
    .filter(item => updatedRatings[item.key] !== undefined)
    .map(item => [item.key, updatedRatings[item.key]]));
  const chosen = getChosenLanguage(next);
  next.languageComfort = chosen ? next.languageRatings[languageKey(chosen)] ?? null : null;
  return next;
}

export function validateInterviewDate(value: string, today = chicagoDate()): string | null {
  if (!value) return "Enter your next interview date.";
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return "Choose a valid interview date in YYYY-MM-DD format.";
  return value < today ? "Choose today or a future interview date." : null;
}

export function normalizeAnswers(answers: OnboardingAnswers): OnboardingAnswers {
  const path = getQuestionPath(answers);
  const language = getPracticeLanguage(answers);
  const ratings = getLanguageRatings(answers);
  const comfort = ratings[languageKey(getChosenLanguage(answers) || "")] ?? null;
  return {
    hasLeetCodeExperience: answers.hasLeetCodeExperience,
    hasCodingExperience: answers.hasLeetCodeExperience === false ? answers.hasCodingExperience : null,
    languagesUsed: path.includes("used") ? answers.languagesUsed : null,
    selectedLanguage: language,
    otherLanguageUsed: path.includes("used") && answers.languagesUsed === "other" ? answers.otherLanguageUsed?.trim() || "" : "",
    customLanguage: path.includes("language") && answers.selectedLanguage === "other" ? answers.customLanguage?.trim() || "" : "",
    languageComfort: comfort,
    languageRatings: ratings,
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
  if (id === "used" && !(answers.hasLeetCodeExperience === true ? ["Python", "Java", "both", "other"] : ["Python", "Java", "both", "neither", "other"]).includes(answers.languagesUsed ?? "")) return "Choose which languages you've used.";
  if (id === "used" && answers.languagesUsed === "other" && !answers.otherLanguageUsed?.trim()) return "Enter the language you have used.";
  if (id === "language" && !getChosenLanguage(answers)) return "Choose a language or enter your own to continue.";
  if (id === "languageComfort") {
    const ratings = getLanguageRatings(answers);
    for (const item of getRatingLanguages(answers)) {
      if (!Number.isInteger(ratings[item.key]) || ratings[item.key] < 1 || ratings[item.key] > 10) return `Choose a comfort level from 1 to 10 for ${item.label}.`;
    }
  }
  const rating = id === "interviewConfidence" ? answers.interviewConfidence : undefined;
  if (rating !== undefined && (rating === null || !Number.isInteger(rating) || rating < (id === "languageComfort" ? 1 : 0) || rating > 10)) return id === "languageComfort" ? "Choose a comfort level from 1 to 10." : "Choose a comfort level from 0 to 10.";
  if (id === "weekly" && ![1, 2, 3, 4, 5].includes(answers.weeklyInterviewGoal ?? 0)) return "Choose a weekly mock interview goal.";
  if (id === "strugglingTopics" && answers.strugglingTopics.some(topic => !topicOptions.includes(topic))) return "Choose topics from the list.";
  if (id === "interviewDate") return validateInterviewDate(answers.interviewDate);
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


