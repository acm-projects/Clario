import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile } from "./profile.ts";

export interface DashboardProblem { id: string; title: string; difficulty: string; topic: string | null }
export interface RecentPractice { id: string; problemId: string | null; problemTitle: string; difficulty: string | null; endedAt: string | null; status: string; startedAt: string | null }
export interface SessionSummary { completedThisWeek: number; recent: RecentPractice[]; completedSessionIds: string[] }

// Monday-to-Monday in the user's timezone, including daylight-saving changes.
export function getWeekBounds(now = new Date(), timeZone = "America/Chicago") {
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" });
  function wallTime(date: Date) {
    const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, Number(part.value)]));
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  }
  const wall = new Date(wallTime(now));
  wall.setUTCHours(0, 0, 0, 0);
  wall.setUTCDate(wall.getUTCDate() - (wall.getUTCDay() + 6) % 7);
  function toUtc(midnight: number) {
    let utc = midnight;
    for (let i = 0; i < 3; i++) utc += midnight - wallTime(new Date(utc));
    return new Date(utc);
  }
  const next = new Date(wall);
  next.setUTCDate(next.getUTCDate() + 7);
  return { start: toUtc(wall.getTime()), end: toUtc(next.getTime()) };
}

export function getWeeklyGoal(profile: UserProfile): number | null {
  const value = profile.weekly_interview_goal;
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

export function getGreetingCopy(profile: UserProfile) {
  const language = profile.preferred_language || "coding";
  if (profile.has_coding_experience === false) return `Start building your ${language} fundamentals, one conversation at a time.`;
  if (profile.interview_confidence !== null && profile.interview_confidence <= 4) return "Build confidence with a little consistent practice.";
  if (profile.starting_difficulty?.toLowerCase() === "hard" || (profile.language_comfort !== null && profile.language_comfort >= 8)) return `Ready for another advanced ${language} challenge?`;
  if (profile.starting_difficulty?.toLowerCase() === "easy") return `Keep building your ${language} fundamentals.`;
  if (profile.has_leetcode_experience === false) return "Bring your coding skills into the interview conversation.";
  return "Let's keep sharpening your interview patterns.";
}

export async function loadRecommendedProblem(client: SupabaseClient, difficulty: string | null): Promise<DashboardProblem | null> {
  if (!difficulty || !["easy", "medium", "hard"].includes(difficulty.toLowerCase())) return null;
  // Match existing title-case or lowercase storage without altering the database.
  const { data, error } = await client.from("problems").select("id, title, difficulty, topic").ilike("difficulty", difficulty).order("id").limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

// Inspect returned session fields before using them. Unknown completion schemas fail
// visibly rather than producing invented progress or counting unfinished sessions.
export function summarizeSessions(rows: Record<string, unknown>[], now = new Date()): SessionSummary {
  const { start, end } = getWeekBounds(now);
  const unsuccessfulStatuses = ["cancelled", "canceled", "abandoned", "failed", "interrupted"];
  let completedThisWeek = 0;
  const completedRows: { id: string; ended: number }[] = [];
  const recent: RecentPractice[] = rows.map((row) => {
    if (!("ended_at" in row)) throw new Error("Weekly progress needs the interview session completion timestamp. Confirm the interview_sessions schema.");
    const status = typeof row.status === "string" ? row.status.toLowerCase() : null;
    const endedAt = typeof row.ended_at === "string" ? row.ended_at : null;
    const ended = endedAt ? new Date(endedAt) : null;
    if (ended && Number.isNaN(ended.getTime())) throw new Error("An interview completion date could not be read.");
    const completed = ended !== null && (!status || !unsuccessfulStatuses.includes(status));
    if (completed) completedRows.push({ id: String(row.id), ended: ended.getTime() });
    if (completed && ended >= start && ended < end) completedThisWeek++;
    return {
      id: String(row.id),
      problemId: row.problem_id !== null && row.problem_id !== undefined ? String(row.problem_id) : null,
      problemTitle: "Practice interview",
      difficulty: null,
      endedAt,
      startedAt: typeof row.started_at === "string" ? row.started_at : null,
      status: completed ? "Completed" : status === "completed" ? "Completion date unavailable" : status ? status.replaceAll("_", " ") : "In progress",
    };
  });
  recent.sort((a, b) => new Date(b.startedAt || b.endedAt || 0).getTime() - new Date(a.startedAt || a.endedAt || 0).getTime());
  return { completedThisWeek, recent: recent.slice(0, 5), completedSessionIds: completedRows.sort((a, b) => b.ended - a.ended).slice(0, 5).map((row) => row.id) };
}

export async function loadSessionSummary(client: SupabaseClient, userId: string): Promise<SessionSummary> {
  const rows: Record<string, unknown>[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.from("interview_sessions")
      .select("id, problem_id, status, language, started_at, ended_at")
      .eq("user_id", userId).order("id").range(offset, offset + pageSize - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  const summary = summarizeSessions(rows);
  const ids = [...new Set(summary.recent.flatMap((session) => session.problemId ? [session.problemId] : []))];
  if (!ids.length) return summary;
  const { data: problems, error: problemError } = await client.from("problems").select("id, title, difficulty").in("id", ids);
  if (problemError) throw problemError;
  for (const session of summary.recent) {
    const problem = problems?.find((item) => String(item.id) === session.problemId);
    if (problem) { session.problemTitle = problem.title; session.difficulty = problem.difficulty; }
  }
  return summary;
}


export interface SkillScore { label: string; score: number | null }

export async function loadSkillScores(client: SupabaseClient, sessionIds: string[]): Promise<SkillScore[]> {
  if (!sessionIds.length) return [];
  const { data, error } = await client.from("feedback_reports")
    .select("technical_score, communication_score, reasoning_score, overall_score")
    .in("session_id", sessionIds);
  if (error) throw error;
  if (!data?.length) return [];
  const columns = [{ label: "Coding", key: "technical_score" }, { label: "Communication", key: "communication_score" }, { label: "Reasoning", key: "reasoning_score" }, { label: "Overall", key: "overall_score" }] as const;
  return columns.map(({ label, key }) => {
    const values = data.map((row) => row[key]).filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100);
    return { label, score: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null };
  });
}

