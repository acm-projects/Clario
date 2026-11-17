import type { InterviewDay } from "./interviewCalendar.ts";

export function duckFootstepTrail(days: InterviewDay[], month: string) {
  const dates = [...new Set(days.filter(day => day.count > 0 && day.date.startsWith(month + "-")).map(day => day.date))].sort();
  const trail = new Map<string, {delay: number; tilt: number}>();
  let previous: string | null = null;
  let run = 0;
  for (const date of dates) {
    const consecutive = previous !== null && Date.parse(`${date}T12:00:00Z`) - Date.parse(`${previous}T12:00:00Z`) === 86_400_000;
    run = consecutive ? run + 1 : 0;
    trail.set(date, {delay: Math.min(run, 6) * 75, tilt: run % 2 === 0 ? -4 : 4});
    previous = date;
  }
  return trail;
}
