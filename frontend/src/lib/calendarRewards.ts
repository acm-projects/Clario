import { chicagoDate, interviewDays, interviewStreaks } from "./interviewCalendar.ts";

export interface CalendarInterview { id: string; title: string; endedAt: string }
export const streakMilestones = [3, 7, 14, 30] as const;

export function earnedMilestone(days: number): number {
  return [...streakMilestones].reverse().find(milestone => days >= milestone) ?? 0;
}

export function streakProgress(days: number) {
  const current = Math.max(0, Math.floor(days));
  const next = streakMilestones.find(milestone => milestone > current) ?? null;
  return { next, value: Math.min(current, next ?? 30), max: next ?? 30, remaining: next === null ? 0 : next - current, earned: earnedMilestone(current) };
}

export function calendarRewards(completionDates: string[], now = new Date()) {
  const days = interviewDays(completionDates, now);
  const streak = interviewStreaks(days, now);
  const completedToday = days.some(day => day.date === chicagoDate(now));
  const status = completedToday ? "active-today" : streak.current > 0 ? "continue-today" : "inactive";
  const progress = streakProgress(streak.current);
  let message: string;
  if (!days.length) message = "Your first completed interview starts your streak. Ready when you are!";
  else if (status === "continue-today") message = `Your ${streak.current}-day streak is still going. Complete an interview today to keep it!`;
  else if (status === "active-today") message = progress.next === null ? "30 days and still growing. Look at you go!" : `You showed up today! ${progress.remaining} more ${progress.remaining === 1 ? "day" : "days"} to your ${progress.next}-day milestone.`;
  else message = `You've practiced on ${streak.activeDays} different ${streak.activeDays === 1 ? "day" : "days"}. A fresh streak is one interview away.`;
  return { ...streak, status, progress, message };
}

export function interviewsOnDay(interviews: CalendarInterview[], day: string, now = new Date()): CalendarInterview[] {
  const seen = new Set<string>();
  return interviews.filter(interview => {
    const ended = new Date(interview.endedAt);
    if (!interview.id || seen.has(interview.id) || !Number.isFinite(ended.getTime()) || ended > now || chicagoDate(ended) !== day) return false;
    seen.add(interview.id);
    return true;
  }).sort((a,b) => Date.parse(b.endedAt) - Date.parse(a.endedAt) || a.id.localeCompare(b.id));
}
