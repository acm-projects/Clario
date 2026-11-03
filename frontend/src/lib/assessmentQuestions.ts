import { buildPracticeProfile, getChosenLanguage, getLanguageRatings, initialAnswers, getQuestionPath, isBeginnerPath, validateQuestion, type OnboardingAnswers, type QuestionId } from "./practiceProfile.ts";
import type { AssessmentAnswers } from "./assessmentContract.ts";

export type AssessmentQuestionId = QuestionId | "experience" | "confidentTopics";
export interface RecommendationAnswers {
  experience: AssessmentAnswers["experience"] | null;
  confidentTopics: string[];
}
export const initialRecommendationAnswers: RecommendationAnswers = { experience: null, confidentTopics: [] };

export function getAssessmentPath(answers: OnboardingAnswers): AssessmentQuestionId[] {
  return [...getQuestionPath(answers), "experience", "confidentTopics"];
}

export function getAssessmentQuestion(id: AssessmentQuestionId, answers: OnboardingAnswers) {
  const beginner = isBeginnerPath(answers);
  switch (id) {
    case "leetcode": return { label: "YOUR EXPERIENCE", title: "Have you used LeetCode before?", description: "We'll use this to choose a better starting point for your practice." };
    case "coding": return { label: "YOUR EXPERIENCE", title: "Have you coded before?", description: "No LeetCode experience is totally fine. We just want to understand your coding background." };
    case "used": return { label: "YOUR EXPERIENCE", title: answers.hasLeetCodeExperience ? "Which language have you used on LeetCode?" : "Which of these have you used?", description: answers.hasLeetCodeExperience ? "Python, Java, both, or a different language?" : "Tell us whether you've worked with Python, Java, both, or neither." };
    case "language": return { label: "YOUR LANGUAGE", title: answers.hasLeetCodeExperience === true && answers.languagesUsed === "other" ? "Which language would you like to practice with?" : beginner ? "Which language would you like to start with?" : "Which language do you want to practice in?", description: beginner ? "Choose a language to begin with. No prior experience needed." : "Choose the language you want to use during your mock interviews." };
    case "languageComfort": return { label: "YOUR COMFORT", title: "How comfortable are you with these languages?", description: "Rate each language from 1 (not comfortable at all) to 10 (extremely comfortable)." };
    case "interviewConfidence": return { label: "YOUR COMFORT", title: "How comfortable do you feel with technical interviews?", description: "Think about explaining your approach, coding out loud, and answering follow-up questions." };
    case "strugglingTopics": return { label: "YOUR FOCUS", title: "What topics do you struggle with?", description: "Select any topics you want to practice. You can leave this blank if you're unsure." };
    case "targetCompany": return { label: "YOUR GOAL", title: "What companies are you preparing for?", description: "Optional: enter a company or companies, separated by commas." };
    case "interviewDate": return { label: "YOUR TIMELINE", title: "When is your next interview date?", description: "Choose today or a future date. We use it to personalize your preparation." };
    case "weekly": return { label: "YOUR PRACTICE GOAL", title: answers.hasCodingExperience === false && answers.hasLeetCodeExperience === false ? "How many mock interviews do you want to work toward each week?" : "How many mock interviews do you want to complete per week?", description: beginner ? "Start small. You can always increase your goal later." : "Choose a goal that feels realistic. You can change this later." };
    case "experience": return { label: "YOUR STARTING POINT", title: "What is your coding interview experience level?", description: "Choose the level that best describes you so we can recommend suitable problems." };
    case "confidentTopics": return { label: "YOUR STRENGTHS", title: "Which topics do you feel confident in?", description: "Optional: select any topics you already know well." };
  }
}

export function validateAssessmentQuestion(id: AssessmentQuestionId, answers: OnboardingAnswers, extra: RecommendationAnswers): string | null {
  if (id === "experience") return extra.experience ? null : "Choose your experience level.";
  if (id === "confidentTopics") return null;
  return validateQuestion(id, answers);
}

export function buildAssessmentPayload(answers: OnboardingAnswers, extra: RecommendationAnswers): AssessmentAnswers {
  for (const id of getAssessmentPath(answers)) {
    const error = validateAssessmentQuestion(id, answers, extra);
    if (error) throw new Error(error);
  }
  const normalized = buildPracticeProfile(answers).answers;
  if (!normalized.selectedLanguage || !extra.experience) throw new Error("Please complete your assessment.");
  return {
    experience: extra.experience,
    language: normalized.selectedLanguage === "Java" ? "java" : "python3",
    preferred_language: getChosenLanguage(answers)!,
    other_language_used: normalized.otherLanguageUsed || null,
    language_comfort: getLanguageRatings(answers),
    interview_date: normalized.interviewDate,
    has_leetcode_experience: normalized.hasLeetCodeExperience,
    has_coding_experience: normalized.hasCodingExperience,
    languages_used: normalized.languagesUsed,
    weekly_interview_goal: normalized.weeklyInterviewGoal,
    interview_confidence: normalized.interviewConfidence,
    confident_topics: [...new Set(extra.confidentTopics)],
    struggle_topics: normalized.strugglingTopics,
    companies: [...new Set(normalized.targetCompany.split(",").map(value => value.trim()).filter(Boolean))],
  };
}

export function restoreAssessmentAnswers(saved: AssessmentAnswers): {answers: OnboardingAnswers; extra: RecommendationAnswers} {
  const preferred = saved.preferred_language || (saved.language === "java" ? "Java" : "Python");
  const answers: OnboardingAnswers = {
    ...initialAnswers,
    hasLeetCodeExperience: saved.has_leetcode_experience ?? null,
    hasCodingExperience: saved.has_coding_experience ?? null,
    languagesUsed: saved.languages_used ?? (saved.other_language_used ? "other" : null),
    selectedLanguage: preferred === "Python" || preferred === "Java" ? preferred : "other",
    customLanguage: preferred === "Python" || preferred === "Java" ? "" : preferred,
    otherLanguageUsed: saved.other_language_used || "",
    languageComfort: typeof saved.language_comfort === "number" ? saved.language_comfort : null,
    languageRatings: typeof saved.language_comfort === "object" && saved.language_comfort !== null ? {...saved.language_comfort} : undefined,
    interviewDate: saved.interview_date || "",
    strugglingTopics: [...saved.struggle_topics],
    targetCompany: saved.companies.join(", "),
    weeklyInterviewGoal: saved.weekly_interview_goal ?? null,
    interviewConfidence: saved.interview_confidence ?? null,
  };
  return { answers, extra: { experience: saved.experience, confidentTopics: [...saved.confident_topics] } };
}
