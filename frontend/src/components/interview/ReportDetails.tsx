export type Reference = { transcript_id: string | null; observation: string; effect: "raised" | "lowered" | "neutral" };
export type RichReport = {
  details: {
    verdict: string;
    sectors: Record<string, { summary: string; evidence: Reference[] }>;
    umpire: { step: string; status: string; summary: string; did_well: string; improve: string; evidence: Reference[] }[];
    moments: { moment_id: string; context: string; suggested_fix: string }[];
    fix_first: { habit: string; drill: string }[];
    dont_worry: string[];
    specific_strengths: Reference[];
  };
  session_evidence: {
    transcript: { id: string; speaker: string; text: string; seconds: number | null }[];
    measured_moments: { id: string; kind: string; seconds: number | null; duration_seconds: number | null; count: number | null; transcript_id: string | null }[];
    filler_total: number | null; filler_rate_per_interview_minute: number | null;
  };
};
const time = (seconds: number | null) => seconds === null ? "Time unavailable" : `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const box = "rounded-3xl border border-[#e4e2db] bg-[#fffdf8] p-6 sm:p-8 space-y-4";
export default function ReportDetails({ report }: { report: RichReport }) {
  const { details, session_evidence: evidence } = report;
  const reference = (ref: Reference, index: number) => <li key={index} className="my-2"><span className="font-medium">{ref.effect === "raised" ? "Helped" : ref.effect === "lowered" ? "Held back" : "Observed"}: </span>{ref.observation} {ref.transcript_id && <a className="text-blue-700 underline" href={`#transcript-${ref.transcript_id}`}>View transcript</a>}</li>;
  return <>

    <section className={box}><h2 className="text-xl font-semibold">Your UMPIRE breakdown</h2><div className="grid gap-4 sm:grid-cols-2">{details.umpire.map(step => <details key={step.step} className="rounded-xl bg-[#f3f1eb] p-4"><summary className="cursor-pointer"><strong>{step.step}</strong> · {step.status}<p className="mt-2 text-sm">{step.summary}</p></summary><p className="mt-3"><strong>Did well: </strong>{step.did_well || "Not enough evidence recorded."}</p><p className="mt-3"><strong>Improve: </strong>{step.improve || "No specific improvement supported."}</p><ul>{step.evidence.map(reference)}</ul></details>)}</div></section>
    <section className={box}><h2 className="text-xl font-semibold">Key moments</h2><p>Filler matches: {evidence.filler_total ?? "Unavailable"} · {evidence.filler_rate_per_interview_minute ?? "Unavailable"} per interview minute</p><p className="text-sm">Counts can undercount speech. Timestamps locate transcript turns, not individual words.</p>{details.moments.map(moment => {
      const measured = evidence.measured_moments.find(item => item.id === moment.moment_id);
      if (!measured || measured.kind !== "filler") return null;
      return <details key={moment.moment_id} className="border-t pt-3"><summary className="cursor-pointer">{time(measured.seconds)} · {measured.count} filler matches — {moment.context}</summary><p className="my-3"><strong>Try: </strong>{moment.suggested_fix}</p>{measured.transcript_id && <a className="text-blue-700 underline" href={`#transcript-${measured.transcript_id}`}>Jump to nearby transcript</a>}</details>;
    })}{!details.moments.length && <p>No significant recorded moments selected.</p>}</section>
    <section className={box}><h2 className="text-xl font-semibold">Fix first</h2><ol className="list-decimal pl-5 space-y-4">{details.fix_first.map((fix, index) => <li key={index}><strong>{fix.habit}</strong><p>Drill: {fix.drill}</p></li>)}</ol><h3 className="font-semibold">Don’t worry about</h3><ul className="list-disc pl-5">{details.dont_worry.map((item, index) => <li key={index}>{item}</li>)}</ul></section>
    <section className={box}><h2 className="text-xl font-semibold">Strengths to keep</h2><ul>{details.specific_strengths.map(reference)}</ul>{!details.specific_strengths.length && <p>Not enough evidence to identify specific strengths.</p>}</section>
    <section className={box}><h2 className="text-xl font-semibold">Session transcript</h2><ol className="mt-4 space-y-4">{evidence.transcript.map(turn => <li key={turn.id} id={`transcript-${turn.id}`} tabIndex={-1} className="scroll-mt-6 rounded-xl p-3 target:bg-yellow-100"><p className="text-xs font-semibold">{time(turn.seconds)} · {turn.speaker}</p><p className="whitespace-pre-wrap">{turn.text}</p></li>)}</ol></section>
  </>;
}
