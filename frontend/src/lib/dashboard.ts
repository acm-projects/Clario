import { listSessions } from "./api";
import { loadProblems } from "./problems.ts";
import type { UserProfile } from "./profile.ts";

export interface DashboardProblem { slug: string; title: string; difficulty: string; topic: string | null }
export interface RecentPractice { id: string; problemId: string | null; problemTitle: string; difficulty: string | null; endedAt: string | null; status: string; startedAt: string | null }
export interface SessionSummary { completedThisWeek: number; recent: RecentPractice[]; completedSessionIds: string[]; completionDates: string[] }

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

export async function loadRecommendedProblem(difficulty: string | null): Promise<DashboardProblem | null> {
  const fallback = { slug: "two-sum", title: "Two Sum", difficulty: "Easy", topic: "Array / Hash Table" };
  if (!difficulty || !["easy", "medium", "hard"].includes(difficulty.toLowerCase())) return fallback;
  try {
    const problems = await loadProblems();
    const problem = problems.find((item) => item.difficulty.toLowerCase() === difficulty.toLowerCase());
    return problem ? { slug: problem.slug, title: problem.title, difficulty: problem.difficulty, topic: problem.topics.join(" / ") || null } : fallback;
  } catch { return fallback; }
}

// Inspect returned session fields before using them. Unknown completion schemas fail
// visibly rather than producing invented progress or counting unfinished sessions.
export function summarizeSessions(rows: Record<string, unknown>[], now = new Date()): SessionSummary {
  const { start, end } = getWeekBounds(now);
  const unsuccessfulStatuses = ["cancelled", "canceled", "abandoned", "failed", "interrupted"];
  let completedThisWeek = 0;
  const completedRows: { id: string; ended: number }[] = [];
  const recent: RecentPractice[] = rows.map((row) => {
    if (!("ended_at" in row)) throw new Error("Weekly progress needs the interview session completion timestamp. Confirm the sessions API schema.");
    const status = typeof row.status === "string" ? row.status.toLowerCase() : null;
    const endedAt = typeof row.ended_at === "string" ? row.ended_at : null;
    const ended = endedAt ? new Date(endedAt) : null;
    if (ended && Number.isNaN(ended.getTime())) throw new Error("An interview completion date could not be read.");
    const completed = ended !== null && ended <= now && (!status || ["completed", "finished"].includes(status)) && !unsuccessfulStatuses.includes(status ?? "");
    if (completed) completedRows.push({ id: String(row.id), ended: ended.getTime() });
    if (completed && ended >= start && ended < end) completedThisWeek++;
    return {
      id: String(row.id),
      problemId: typeof row.problem_slug === "string" ? row.problem_slug : null,
      problemTitle: typeof row.problem_slug === "string" ? row.problem_slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") : "Practice interview",
      difficulty: null,
      endedAt,
      startedAt: typeof row.started_at === "string" ? row.started_at : null,
      status: completed ? "Completed" : status === "completed" ? "Completion date unavailable" : status ? status.replaceAll("_", " ") : "In progress",
    };
  });
  recent.sort((a, b) => new Date(b.startedAt || b.endedAt || 0).getTime() - new Date(a.startedAt || a.endedAt || 0).getTime());
  return { completedThisWeek, completionDates: completedRows.map((row) => new Date(row.ended).toISOString()), recent: recent.slice(0, 5), completedSessionIds: completedRows.sort((a, b) => b.ended - a.ended).slice(0, 5).map((row) => row.id) };
}

export async function loadSessionSummary(): Promise<SessionSummary> {
  return summarizeSessions(await listSessions());
}

export interface SkillScore { label: string; score: number | null }

// Feedback storage is not integrated yet; the existing UI shows its empty state.
export async function loadSkillScores(): Promise<SkillScore[]> {
  return [];
}
