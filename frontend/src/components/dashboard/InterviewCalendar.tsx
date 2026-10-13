import { useState } from "react";
import { chicagoDate, interviewDays, interviewStreaks } from "../../lib/interviewCalendar";

export default function InterviewCalendar({ completionDates, loading = false }: { completionDates: string[]; loading?: boolean }) {
  const today = chicagoDate();
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [selected, setSelected] = useState<string | null>(null);
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const monthLabel = first.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const leading = (first.getUTCDay() + 6) % 7;
  const activity = interviewDays(completionDates);
  const counts = new Map(activity.map((day) => [day.date, day.count]));
  const streak = interviewStreaks(activity);
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
    <p className="mt-2 text-xs leading-5 text-[#777a7c]">One conversation at a time. Build your rhythm.</p>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-[#e7f0fc] px-4 py-3"><p className="text-2xl font-semibold text-[#2378db]">{loading ? "?" : streak.current}<span className="ml-1 text-xs font-normal">days</span></p><p className="mt-1 text-[10px] text-[#55595c]">Current streak</p></div>
      <div className="rounded-xl bg-[#f7f3e8] px-4 py-3"><p className="text-2xl font-semibold">{loading ? "?" : streak.longest}<span className="ml-1 text-xs font-normal">days</span></p><p className="mt-1 text-[10px] text-[#55595c]">Longest streak</p></div>
    </div>
    <div className="mb-4 mt-6 flex items-center justify-between gap-2">
      <h3 className="text-sm font-semibold" aria-live="polite">{monthLabel}</h3>
      <div className="flex gap-1"><button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-lg text-[#55595c] hover:bg-[#e7f0fc]">&#8249;</button><button type="button" onClick={() => moveMonth(1)} aria-label="Next month" className="flex h-9 w-9 items-center justify-center rounded-lg text-[#55595c] hover:bg-[#e7f0fc]">&#8250;</button></div>
    </div>
    <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[#777a7c]" aria-hidden="true">{["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span key={index} className="pb-2">{day}</span>)}</div>
    <div className="grid grid-cols-7 gap-1" role="group" aria-label={`${monthLabel} interview activity`}>
      {Array.from({ length: leading }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
      {Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const date = `${month}-${String(day).padStart(2, "0")}`;
        const count = counts.get(date) ?? 0;
        const isToday = date === today;
        return <button key={date} type="button" onClick={() => setSelected(date)} aria-pressed={selected === date} aria-current={isToday ? "date" : undefined}
          aria-label={`${monthLabel} ${day}: ${loading ? "loading activity" : `${count} completed ${count === 1 ? "interview" : "interviews"}`}${isToday ? ", today" : ""}`}
          className={`relative flex aspect-square min-h-8 items-center justify-center rounded-lg text-xs transition motion-reduce:transition-none ${count ? "bg-[#2378db] font-semibold text-white" : date > today ? "text-[#b8b9b5] hover:bg-[#f7f3e8]" : "text-[#55595c] hover:bg-[#e7f0fc]"} ${isToday ? "ring-1 ring-[#2378db] ring-offset-1 ring-offset-[#fffdf8]" : ""} ${selected === date ? "outline-2 outline-offset-2 outline-[#191d20]" : ""}`}>
          {day}{count > 0 && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-white/80" aria-hidden="true" />}
        </button>;
      })}
    </div>
    <div className="mt-4 flex items-center justify-between gap-2 text-[10px] text-[#777a7c]"><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#2378db]" aria-hidden="true" />Interview day</span><button type="button" onClick={() => { setMonth(today.slice(0, 7)); setSelected(today); }} className="min-h-8 text-[#2378db] hover:underline">Today</button></div>
    <p className="mt-3 rounded-xl bg-[#f7f3e8] px-3 py-3 text-xs leading-5 text-[#55595c]" role="status">
      {loading ? "Loading interview activity..." : selected ? `${new Date(`${selected}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}: ${selectedCount} completed ${selectedCount === 1 ? "interview" : "interviews"}.` : monthCount ? `${monthCount} interview ${monthCount === 1 ? "day" : "days"} this month. Keep it going!` : "No interviews this month yet. Your completed interviews will light up here."}
    </p>
  </section>;
}
