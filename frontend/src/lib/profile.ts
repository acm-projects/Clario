import type { SupabaseClient, User } from "@supabase/supabase-js";
import { buildPracticeProfile, type OnboardingAnswers } from "./practiceProfile.ts";

export interface UserProfile {
  id: string;
  display_name: string | null;
  preferred_language: string | null;
  starting_difficulty: string | null;
  weekly_interview_goal: number | null;
  assessment_completed: boolean | null;
  has_leetcode_experience: boolean | null;
  has_coding_experience: boolean | null;
  language_comfort: number | null;
  interview_confidence: number | null;
}

export interface ProfileContext {
  user: User;
  profile: UserProfile;
  startRetake: () => void;
}

export function getProfileUpdate(answers: OnboardingAnswers) {
  const result = buildPracticeProfile(answers).answers;
  if (!result.difficulty) throw new Error("Please complete your assessment before saving.");
  return {
    has_leetcode_experience: result.hasLeetCodeExperience,
    has_coding_experience: result.hasCodingExperience,
    preferred_language: result.selectedLanguage,
    language_comfort: result.languageComfort,
    starting_difficulty: result.difficulty.charAt(0).toUpperCase() + result.difficulty.slice(1),
    interview_confidence: result.interviewConfidence,
    weekly_interview_goal: result.weeklyInterviewGoal,
    assessment_completed: true,
    updated_at: new Date().toISOString(),
  };
}

// UPDATE only: profile creation remains the responsibility of the existing signup setup.
export async function saveAssessment(client: SupabaseClient, answers: OnboardingAnswers, expectedUserId: string) {
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Your session has ended. Please sign in again before saving.");
  if (user.id !== expectedUserId) throw new Error("Your signed-in account changed. Please reload before continuing.");
  const update = getProfileUpdate(answers);
  const { data, error } = await client.from("profiles").update(update).eq("id", user.id).select("id").single();
  if (error) throw error;
  // A successful HTTP response with zero rows is not a successful assessment save.
  if (!data || data.id !== user.id) throw new Error("Your profile could not be updated. Please try again.");
}


