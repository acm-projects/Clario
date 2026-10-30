import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import type { ProgressTopics } from "../../types/progress";
export default function TopicBreakdown({ topics }: { topics: ProgressTopics }) {
  const sorted = [...topics.topics].sort((a, b) => a.average_overall - b.average_overall);
  const weak = new Set(topics.weak_topics);
  return <section className="progress-card min-w-0"><h2>Topic breakdown</h2><p className="progress-muted mt-1">Find patterns in what needs more practice.</p>{weak.size > 0 && <p className="my-4 rounded-xl bg-[#fff3df] p-3 text-sm text-[#80500c]"><strong>Focus on:</strong> {topics.weak_topics.join(", ")}</p>}
    {sorted.length ? <div className="mt-5 min-w-0" style={{ height: Math.max(220, sorted.length * 38) }} role="img" aria-label="Average score by topic, lowest first"><ResponsiveContainer width="100%" height="100%"><BarChart accessibilityLayer data={sorted} layout="vertical" margin={{ left: 0, right: 12 }}><XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="topic" width={115} tick={{ fontSize: 11 }} /><Tooltip formatter={(value, _name, item) => [`${value} avg over ${item.payload.attempts} interview${item.payload.attempts === 1 ? "" : "s"}`, "Score"]} /><Bar dataKey="average_overall" radius={[0, 5, 5, 0]} isAnimationActive={false}>{sorted.map(t => <Cell key={t.topic} fill={weak.has(t.topic) && t.attempts > 1 ? "#c87819" : "#3054ed"} />)}</Bar></BarChart></ResponsiveContainer></div> : <p className="progress-muted py-10">No topic scores available yet.</p>}
  </section>;
}
