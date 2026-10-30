import { buildPracticeProfile, getPracticeLanguage, getQuestionPath, isBeginnerPath, validateQuestion, type OnboardingAnswers, type QuestionId } from "./practiceProfile.ts";
import type { AssessmentAnswers } from "./assessmentContract.ts";

export type AssessmentQuestionId = QuestionId | "experience" | "confidentTopics" | "timeline";
export interface RecommendationAnswers {
  experience: AssessmentAnswers["experience"] | null;
  confidentTopics: string[];
  timeline: AssessmentAnswers["timeline"] | null;
}
export const initialRecommendationAnswers: RecommendationAnswers = { experience: null, confidentTopics: [], timeline: null };

export function getAssessmentPath(answers: OnboardingAnswers): AssessmentQuestionId[] {
  return [...getQuestionPath(answers), "experience", "confidentTopics", "timeline"];
}

export function getAssessmentQuestion(id: AssessmentQuestionId, answers: OnboardingAnswers) {
  const beginner = isBeginnerPath(answers);
  switch (id) {
    case "leetcode": return { label: "YOUR EXPERIENCE", title: "Have you used LeetCode before?", description: "We'll use this to choose a better starting point for your practice." };
    case "coding": return { label: "YOUR EXPERIENCE", title: "Have you coded before?", description: "No LeetCode experience is totally fine. We just want to understand your coding background." };
    case "used": return { label: "YOUR EXPERIENCE", title: answers.hasLeetCodeExperience ? "Which language have you used on LeetCode?" : "Which of these have you used?", description: answers.hasLeetCodeExperience ? "Python, Java, both, or a different language?" : "Tell us whether you've worked with Python, Java, both, or neither." };
    case "language": return { label: "YOUR LANGUAGE", title: answers.hasLeetCodeExperience === true && answers.languagesUsed === "other" ? "Which language would you like to practice with?" : beginner ? "Which language would you like to start with?" : "Which language do you want to practice in?", description: beginner ? "Choose a language to begin with. No prior experience needed." : "Choose the language you want to use during your mock interviews." };
    case "languageComfort": return { label: "YOUR COMFORT", title: `How comfortable are you with ${getPracticeLanguage(answers)}?`, description: "Choose what feels right today. We'll use this to set your starting point." };
    case "interviewConfidence": return { label: "YOUR COMFORT", title: "How comfortable do you feel with technical interviews?", description: "Think about explaining your approach, coding out loud, and answering follow-up questions." };
    case "strugglingTopics": return { label: "YOUR FOCUS", title: "What topics do you struggle with?", description: "Select any topics you want to practice. You can leave this blank if you're unsure." };
    case "targetCompany": return { label: "YOUR GOAL", title: "What companies are you preparing for?", description: "Optional: enter a company or companies, separated by commas." };
    case "interviewDate": return { label: "YOUR TIMELINE", title: "When is your next interview?", description: "Optional: choose a date if you have an interview scheduled." };
    case "weekly": return { label: "YOUR PRACTICE GOAL", title: answers.hasCodingExperience === false && answers.hasLeetCodeExperience === false ? "How many mock interviews do you want to work toward each week?" : "How many mock interviews do you want to complete per week?", description: beginner ? "Start small. You can always increase your goal later." : "Choose a goal that feels realistic. You can change this later." };
    case "experience": return { label: "YOUR STARTING POINT", title: "What is your coding interview experience level?", description: "Choose the level that best describes you so we can recommend suitable problems." };
    case "confidentTopics": return { label: "YOUR STRENGTHS", title: "Which topics do you feel confident in?", description: "Optional: select any topics you already know well." };
    case "timeline": return { label: "YOUR TIMELINE", title: "When are you preparing to interview?", description: "Choose your preparation timeline. This helps us prioritize your next problems." };
  }
}

export function validateAssessmentQuestion(id: AssessmentQuestionId, answers: OnboardingAnswers, extra: RecommendationAnswers): string | null {
  if (id === "experience") return extra.experience ? null : "Choose your experience level.";
  if (id === "timeline") return extra.timeline ? null : "Choose your preparation timeline.";
  if (id === "confidentTopics") return null;
  return validateQuestion(id, answers);
}

export function buildAssessmentPayload(answers: OnboardingAnswers, extra: RecommendationAnswers): AssessmentAnswers {
  for (const id of getAssessmentPath(answers)) {
    const error = validateAssessmentQuestion(id, answers, extra);
    if (error) throw new Error(error);
  }
  const normalized = buildPracticeProfile(answers).answers;
  if (!normalized.selectedLanguage || !extra.experience || !extra.timeline) throw new Error("Please complete your assessment.");
  return {
    experience: extra.experience,
    language: normalized.selectedLanguage === "Java" ? "java" : "python3",
    timeline: extra.timeline,
    confident_topics: [...new Set(extra.confidentTopics)],
    struggle_topics: normalized.strugglingTopics,
    companies: [...new Set(normalized.targetCompany.split(",").map(value => value.trim()).filter(Boolean))],
  };
}
