import { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { ProgressHistoryItem } from "../../types/progress";
import { chronological, formatShortDate, sessionTitle } from "../../utils/progressFormat";

const SERIES = [
  { key: "overall_score", label: "Overall", color: "#3054ed" },
  { key: "problem_solving_score", label: "Problem Solving", color: "#7952b3" },
  { key: "technical_score", label: "Technical", color: "#16836d" },
  { key: "communication_score", label: "Communication", color: "#b6750a" },
] as const;
type Key = typeof SERIES[number]["key"];
export default function ScoreTrendChart({ history }: { history: ProgressHistoryItem[] }) {
  const [visible, setVisible] = useState<Record<Key, boolean>>({ overall_score: true, problem_solving_score: false, technical_score: false, communication_score: false });
  function toggle(key: Key) {
    setVisible(previous => { const next = { ...previous, [key]: !previous[key] }; return Object.values(next).some(Boolean) ? next : previous; });
  }
  const data = chronological(history).map(item => ({ ...item, title: sessionTitle(item), label: formatShortDate(item.date) }));
  return <section className="progress-card" aria-label="Score trend">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h2>Score trend</h2><p className="progress-muted mt-1">See how your skills develop over time.</p></div><span className="progress-eyebrow">Out of 100</span></div>
    <div className="my-5 flex flex-wrap gap-2" role="group" aria-label="Score categories">{SERIES.map(s => <button key={s.key} type="button" aria-pressed={visible[s.key]} onClick={() => toggle(s.key)} className="rounded-full border border-[#e4e2db] px-3 py-2 text-xs aria-pressed:bg-[#e9edff] aria-pressed:border-[#b9c9ff]"><span aria-hidden="true" style={{ background: s.color }} className="mr-2 inline-block h-2 w-2 rounded-full" />{s.label}</button>)}</div>
    {data.length ? <div className="h-72 min-w-0" role="img" aria-label={`Scores across ${data.length} interviews. Use category buttons to compare scores.`}><ResponsiveContainer width="100%" height="100%"><LineChart accessibilityLayer data={data} margin={{ top: 10, right: 14, bottom: 8, left: -20 }}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e7e5df" /><XAxis dataKey="session_id" tickFormatter={id => data.find(item => item.session_id === id)?.label ?? id} tick={{ fontSize: 11 }} minTickGap={25} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip labelFormatter={(_label, payload) => { const point = payload?.[0]?.payload; return point ? `${point.title} · ${point.label}` : ""; }} />{SERIES.filter(s => visible[s.key]).map(s => <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} isAnimationActive={false} />)}</LineChart></ResponsiveContainer></div> : <p className="progress-muted py-12">No scored interviews to chart yet.</p>}
  </section>;
}
