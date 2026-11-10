import { useReducedMotion } from "motion/react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { ProgressHistoryItem } from "../../types/progress";
import { overallScorePoints } from "../../utils/scoreTrend";

export default function ScoreTrendChart({ history }: { history: ProgressHistoryItem[] }) {
  const reducedMotion = useReducedMotion();
  const data = overallScorePoints(history);
  return <section className="progress-card overall-score-card relative overflow-hidden rounded-3xl border border-[var(--border,#e7e5df)] bg-[var(--surface-raised,#fffdf8)] p-6 sm:p-8" aria-label="Overall score progress">
    <h2 className="text-xl font-semibold">Your trend</h2>
    {data.length ? <>
      <div className="mt-7 h-80 min-w-0 overflow-hidden" aria-hidden="true"><ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 18, right: 24, bottom: 12, left: 0 }}>
          <CartesianGrid stroke="var(--border, #d9dde0)" strokeWidth={1} vertical horizontal />
          <XAxis dataKey="id" tickFormatter={id => data.find(point => point.id === id)?.label ?? ""} tick={{ fontSize: 11, fill: "var(--text-muted, #687087)" }} angle={-40} textAnchor="end" height={54} minTickGap={20} tickLine={false} axisLine={{ stroke: "var(--text, #667078)", strokeWidth: 2 }} />
          <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} width={38} tick={{ fontSize: 11, fill: "var(--text-muted, #687087)" }} tickLine={false} axisLine={{ stroke: "var(--text, #667078)", strokeWidth: 2 }} />
          <Tooltip content={({ active, payload }) => {
            const point = payload?.[0]?.payload;
            if (!active || !point) return null;
            return <div className="min-w-52 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 text-[var(--text)] shadow-lg"><p className="text-sm font-semibold">{point.title}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{point.label}</p><dl className="mt-3 space-y-2 text-xs">{[["Overall", point.value], ["Technical", point.technical], ["Reasoning", point.reasoning], ["Communication", point.communication]].map(([label, score]) => <div key={label} className="flex justify-between gap-6"><dt>{label}</dt><dd className="font-semibold tabular-nums">{typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 100 ? `${score}/100` : "Not scored"}</dd></div>)}</dl></div>;
          }} />
          <Line type="linear" dataKey="value" name="Overall score" stroke="var(--landing-blue)" strokeWidth={3.5} dot={{ r: 4.5, stroke: "var(--landing-blue)", strokeWidth: 3, fill: "var(--surface-raised, #fffdf8)" }} activeDot={{ r: 6 }} isAnimationActive={!reducedMotion} animationDuration={1200} animationEasing="ease-in-out" />
        </LineChart>
      </ResponsiveContainer></div>
      <div className="sr-only"><table><caption>Overall scores by interview, oldest first</caption><thead><tr><th>Date</th><th>Interview</th><th>Overall score out of 100</th><th>Technical</th><th>Reasoning</th><th>Communication</th></tr></thead><tbody>{data.map(point => <tr key={point.id}><td>{point.label}</td><td>{point.title}</td><td>{point.value}</td><td>{point.technical ?? "Not scored"}</td><td>{point.reasoning ?? "Not scored"}</td><td>{point.communication ?? "Not scored"}</td></tr>)}</tbody></table></div>
    </> : <p className="py-12 text-sm text-[var(--text-muted,#687087)]">No overall scores recorded yet. Your scored interviews will appear here.</p>}
  </section>;
}
