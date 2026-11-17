import { useState } from "react";
import { chicagoDate, interviewDays } from "../../lib/interviewCalendar";

import { calendarRewards, interviewsOnDay, type CalendarInterview } from "../../lib/calendarRewards";
import InterviewDayDetails from "./InterviewDayDetails";
import StreakCelebration from "./StreakCelebration";
import DuckyFootsteps, { DuckyFeetIcon } from "./DuckyFootsteps";
import { duckFootstepTrail } from "../../lib/duckFootsteps";

export default function InterviewCalendar({ completionDates, interviews = [], userId, loading = false, unavailable = false, now = new Date() }: { completionDates: string[]; interviews?: CalendarInterview[]; userId: string; loading?: boolean; unavailable?: boolean; now?: Date }) {
  const today = chicagoDate(now);
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [selected, setSelected] = useState<string | null>(null);
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const monthLabel = first.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const leading = (first.getUTCDay() + 6) % 7;
  const activity = interviewDays(completionDates, now);
  const counts = new Map(activity.map((day) => [day.date, day.count]));
  const footstepTrail = duckFootstepTrail(activity, month);
  const streak = calendarRewards(completionDates, now);
  const ready = !loading && !unavailable;
  const selectedInterviews = selected ? interviewsOnDay(interviews, selected, now) : [];
  const selectedCount = selected ? counts.get(selected) ?? 0 : 0;
  const monthCount = activity.filter((day) => day.date.startsWith(month)).length;

  function moveMonth(offset: number) {
    const next = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
    setMonth(next.toISOString().slice(0, 7));
    setSelected(null);
  }

  return <section className="dashboard-card min-w-0 rounded-2xl bg-[#fffdf8] p-5 shadow-[0_8px_28px_-18px_rgba(75,63,34,0.2)] sm:p-6" aria-labelledby="calendar-heading" aria-busy={loading}>
    <div className="flex items-center justify-between gap-3">
      <h2 id="calendar-heading" className="text-lg font-semibold tracking-tight">Interview Calendar</h2>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e7f0fc] text-[#2378db]" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-12 4h2m3 0h2" /></svg>
      </span>
    </div>
    <p className="mt-2 text-xs leading-5 text-[#777a7c]">Completed interviews (Chicago time)</p>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-[#e7f0fc] px-4 py-3"><p className="flex flex-wrap items-center gap-1 text-2xl font-semibold text-[#2378db]"><svg aria-hidden="true" viewBox="0 0 24 24" className="mr-1 h-5 w-5 shrink-0" fill="#ffdf4f" stroke="#182137" strokeWidth="1.5"><path d="M12 3c1 5-4 5-2 9 1-2 3-2 4-5 3 3 5 6 4 9a6 6 0 0 1-12 0c-1-4 3-7 6-13Z" /></svg>{loading || unavailable ? "--" : streak.current}<span className="ml-1 text-xs font-normal">days</span></p><p className="mt-1 text-[14px] text-[#55595c]">Current streak</p>{ready && <p className="mt-1 text-xs text-[var(--text-muted)]">{streak.status === "active-today" ? "Continued today" : streak.status === "continue-today" ? "Continue today" : "Start a fresh streak"}</p>}</div>
      <div className="rounded-xl bg-cream-gradient px-4 py-3"><p className="flex flex-wrap items-center gap-1 text-2xl font-semibold"><svg aria-hidden="true" viewBox="0 0 24 24" className="mr-1 h-5 w-5 shrink-0" fill="#ffdf4f" stroke="#182137" strokeWidth="1.5"><path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm4 10v5m-4 3h8v-3H8v3ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4" /></svg>{loading || unavailable ? "--" : streak.longest}<span className="ml-1 text-xs font-normal">days</span></p><p className="mt-1 text-[14px] text-[#55595c]">Longest streak</p></div>
    </div>
    <StreakCelebration key={userId} userId={userId} longest={streak.longest} ready={ready} />
    {ready && <div className="mt-4 rounded-xl border border-[var(--border)] px-3 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-1 text-xs"><p className="font-semibold">{streak.progress.next ? `Next milestone: ${streak.progress.next} days` : "30-day milestone reached!"}</p><span className="text-[var(--text-muted)]">{streak.progress.next ? `${streak.current} / ${streak.progress.next} days` : `${streak.current} days and counting`}</span></div>
      <div role="progressbar" aria-label="Progress toward the next streak milestone" aria-valuemin={0} aria-valuemax={streak.progress.max} aria-valuenow={streak.progress.value} aria-valuetext={streak.progress.next ? `${streak.current} of ${streak.progress.next} days; ${streak.progress.remaining} more to go` : "All streak milestones through 30 days reached"} className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-blue)]"><div className="h-full rounded-full bg-[#3054ed] motion-safe:transition-[width] motion-safe:duration-300" style={{width: `${streak.progress.value / streak.progress.max * 100}%`}} /></div>
      <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{streak.progress.next ? `${streak.progress.remaining} more ${streak.progress.remaining === 1 ? "day" : "days"} to your next milestone.` : "A month of showing up. Keep your rhythm!"}{streak.progress.earned > 0 && streak.progress.next !== null ? ` ${streak.progress.earned}-day milestone earned.` : ""}</p>
    </div>}
    <div className="mb-4 mt-6 flex items-center justify-between gap-2">
      <h3 className="text-sm font-semibold" aria-live="polite">{monthLabel}</h3>
      <div className="flex gap-1"><button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-lg text-[#55595c] hover:bg-[#e7f0fc]">&#8249;</button><button type="button" onClick={() => moveMonth(1)} aria-label="Next month" className="flex h-9 w-9 items-center justify-center rounded-lg text-[#55595c] hover:bg-[#e7f0fc]">&#8250;</button></div>
    </div>
    <div className="grid grid-cols-7 gap-1 text-center text-[14px] text-[#777a7c]" aria-hidden="true">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => <span key={index} className="pb-2">{day}</span>)}</div>
    <div className="grid grid-cols-7 gap-1" role="group" aria-label={`${monthLabel} interview activity`}>
      {Array.from({ length: leading }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
      {Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const date = `${month}-${String(day).padStart(2, "0")}`;
        const count = counts.get(date) ?? 0;
        const isToday = date === today;
        const step = footstepTrail.get(date);
        return <button key={date} type="button" disabled={!ready} onClick={() => setSelected(date)} aria-controls="calendar-day-details" aria-expanded={selected === date} aria-pressed={selected === date} aria-current={isToday ? "date" : undefined}
          aria-label={`${monthLabel} ${day}: ${unavailable ? "activity unavailable" : loading ? "loading activity" : `${count} completed ${count === 1 ? "interview" : "interviews"}`}${isToday ? ", today" : ""}`}
          className={`relative flex aspect-square min-h-8 items-center justify-center rounded-lg text-xs transition motion-reduce:transition-none ${count ? "calendar-completed-day bg-transparent font-semibold text-[var(--text)] hover:bg-[#fff1cb]/40" : date > today ? "text-[#b8b9b5] hover:bg-cream-gradient" : "text-[#55595c] hover:bg-[#e7f0fc]"} ${isToday ? "ring-1 ring-[#2378db] ring-offset-1 ring-offset-[#fffdf8]" : ""} ${selected === date ? "outline-2 outline-offset-2 outline-[var(--text)]" : ""}`}>
          <span className="calendar-day-number relative">{day}</span>
          {ready && count > 0 && step && <DuckyFootsteps key={`${userId}:${date}`} userId={userId} date={date} delay={step.delay} tilt={step.tilt} />}
        </button>;
      })}
    </div>
    <div className="mt-4 flex items-center justify-between gap-2 text-[14px] text-[#777a7c]"><span className="flex items-center gap-2"><DuckyFeetIcon legend />Interview day</span><button type="button" disabled={!ready} onClick={() => { setMonth(today.slice(0, 7)); setSelected(today); }} className="min-h-8 text-[#2378db] hover:underline">Today</button></div>
    <p className="mt-3 rounded-xl bg-cream-gradient px-3 py-3 text-xs leading-5 text-[#55595c]" role="status">
      {unavailable ? "Interview activity is unavailable. Retry below to load your calendar." : loading ? "Loading interview activity..." : selected ? `${new Date(`${selected}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}: ${selectedCount} completed ${selectedCount === 1 ? "interview" : "interviews"}.` : monthCount ? `${monthCount} interview ${monthCount === 1 ? "day" : "days"} this month. Keep it going!` : "No interviews this month yet. Your completed interviews will light up here."}
    </p>
    {selected && ready && <InterviewDayDetails day={selected} interviews={selectedInterviews} />}
    <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-[var(--surface-blue)] p-3"><img src={import.meta.env.BASE_URL + "duckhead.png"} alt="" aria-hidden="true" className="h-9 w-9 shrink-0 object-contain" /><p className="text-xs leading-5 text-[var(--text-muted)]"><span className="mb-0.5 block font-semibold text-[var(--text)]">Ducky says</span>{unavailable ? "I'll cheer you on once your interview activity is available." : loading ? "Checking your practice days..." : streak.message}</p></div>
  </section>;
}
