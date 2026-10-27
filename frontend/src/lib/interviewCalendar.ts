export interface InterviewDay { date: string; count: number }

export function chicagoDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (name: string) => parts.find((item) => item.type === name)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function shiftDay(date: string, offset: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

export function interviewDays(completionDates: string[], now = new Date()): InterviewDay[] {
  const counts = new Map<string, number>();
  for (const timestamp of completionDates) {
    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime()) || date > now) continue;
    const key = chicagoDate(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
}

export function interviewStreaks(days: InterviewDay[], now = new Date()) {
  const today = chicagoDate(now);
  const dates = [...new Set(days.filter((day) => day.count > 0 && day.date <= today).map((day) => day.date))].sort();
  const active = new Set(dates);
  let current = 0;
  let cursor = active.has(today) ? today : shiftDay(today, -1);
  while (active.has(cursor)) { current++; cursor = shiftDay(cursor, -1); }
  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of dates) {
    run = previous && shiftDay(previous, 1) === date ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }
  return { current, longest, activeDays: dates.length };
}
