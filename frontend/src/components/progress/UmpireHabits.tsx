import type { UmpireStep } from "../../types/progress";
import { UMPIRE_STEPS } from "../../utils/progressFormat";
export default function UmpireHabits({ missRate }: { missRate: Record<UmpireStep, number | null> }) {
  const observed = UMPIRE_STEPS.filter(s => missRate[s.key] !== null);
  const maximum = Math.max(0, ...observed.map(s => missRate[s.key] ?? 0));
  const worst = observed.find(s => missRate[s.key] === maximum);
  return <section className="progress-card"><h2>UMPIRE habits</h2><p className="progress-muted mt-1">Small habits make a stronger interview.</p><p className="my-5 rounded-xl bg-[#e9edff] p-4 text-sm leading-6">{!observed.length ? "No UMPIRE observations recorded yet." : maximum === 0 ? observed.length === UMPIRE_STEPS.length ? "You're hitting every UMPIRE step. Nice!" : "No skips in the steps recorded so far." : <>You skip <strong>{worst?.label}</strong> most often. {worst?.tip}</>}</p>
    <ul className="space-y-5">{UMPIRE_STEPS.map(s => { const rate = missRate[s.key]; const pct = rate === null ? null : Math.round(rate * 100); const isWorst = rate !== null && rate > 0 && rate === maximum; return <li key={s.key}><div className="mb-2 flex justify-between gap-2 text-sm"><span className={isWorst ? "font-semibold" : ""}>{s.label}</span><span className="progress-muted">{pct === null ? "Not recorded" : pct === 0 ? "Never skipped" : `Skipped in ${pct}%`}</span></div><div className="h-2 rounded-full bg-[#e9e7e0]"><div className={`h-2 rounded-full ${isWorst ? "bg-[#c87819]" : "bg-[#3054ed]"}`} style={{ width: `${pct ?? 0}%` }} /></div></li>; })}</ul>
  </section>;
}
