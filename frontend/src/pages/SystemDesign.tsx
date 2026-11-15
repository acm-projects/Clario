import { listSystemDesignQuestions, type SystemDesignQuestion } from "../lib/api";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import PageHeading from "../components/ui/PageHeading";
import { VideoCallPanel } from "../components/interview/VideoCallPanel";
import { request } from "../lib/api";
import type { VoiceControls } from "../lib/interviewVoice";
import { DESIGN_COMPANIES, type DesignCompany } from "../lib/systemDesignCompanies";
import CompanyLogo from "../components/ui/CompanyLogo";

type DesignScenario = { slug: string; company: string; title: string; difficulty: string; prompt: string };

function DesignCall({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<DesignScenario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [notes, setNotes] = useState("");
  const [transcript, setTranscript] = useState<{ source: string; message: string }[]>([]);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(45 * 60);
  const [ending, setEnding] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const controls = useRef<VoiceControls>(null);
  const busy = useRef(false);
  const expirationTriggered = useRef(false);
  const endHandler = useRef<() => void>(() => {});
  async function finishInterview() {
    if (busy.current) return;
    busy.current = true; setEnding(true); setFinishError(null);
    try {
      const evidence = await controls.current?.finish() ?? { transcript: [], communication: null };
      const saved = await request<{ session_id: string }>(`/voice/system-design/${encodeURIComponent(slug)}/finish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(evidence) }, true);
      navigate(`/report/${encodeURIComponent(saved.session_id)}`);
    } catch (error) { setFinishError(error instanceof Error ? error.message : "Could not save this interview."); }
    finally { busy.current = false; setEnding(false); }
  }
  useEffect(() => { endHandler.current = () => { void finishInterview(); }; });
  useEffect(() => {
    if (deadline === null) return;
    const update = () => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0 && !expirationTriggered.current) { expirationTriggered.current = true; endHandler.current(); }
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);
  useEffect(() => {
    const controller = new AbortController();
    request<DesignScenario>(`/voice/system-design/scenarios/${encodeURIComponent(slug)}`, { signal: controller.signal }, true)
      .then(value => { if (!controller.signal.aborted) setScenario(value); })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not load this scenario."); });
    return () => controller.abort();
  }, [slug, retry]);
  return <main className="min-h-svh bg-cream-gradient p-4 font-sans text-[#182137] sm:p-6 [&_button]:cursor-pointer [&_:is(a,button):focus-visible]:outline-2 [&_:is(a,button):focus-visible]:outline-offset-4 [&_:is(a,button):focus-visible]:outline-[#3054ed]">
    <div className="mx-auto max-w-[1440px]">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#c5c8ce] pb-5">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-[#3054ed]">System Design / No code</p><h1 className="mt-2 text-2xl font-semibold">{scenario ? `${scenario.company} interview` : "Company interview"}</h1></div>
        <Link to="/system-design" className="rounded-xl border border-[#c5c8ce] px-4 py-3 text-sm font-medium">Choose a company</Link>
        <span aria-label="Time remaining" className="font-mono text-lg tabular-nums">{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</span>
      </header>
      {error ? <section role="alert" className="rounded-2xl border border-[#c5c8ce] bg-[#fffdf8] p-7"><p>{error}</p><button onClick={() => { setError(null); setRetry(value => value + 1); }} className="mt-4 rounded-xl bg-[#3054ed] px-5 py-3 text-sm font-semibold text-white">Try again</button></section> : !scenario ? <p role="status">Loading company scenario...</p> : <div className="grid items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <section aria-label="Interview call" className="order-3 flex min-w-0 flex-col rounded-[26px] border border-[#c5c8ce] bg-[#fffdf8] p-4 [--line:#c5c8ce] [&_.theme-panel]:bg-[#fffdf8] [&_.theme-main-text]:text-[#182137] [&_.theme-muted-text]:text-[#687087] [&_.theme-body-text]:text-[#182137] [&_.theme-surface]:bg-[#e9edff] [&_.theme-video-self]:bg-[#f5f0e3] [&_.theme-video-interviewer]:bg-[#3054ed] [&_.sandbox-video]:min-h-[600px] [&_.sandbox-video>div:nth-child(2)]:flex-col! sm:[&_.sandbox-video>div:nth-child(2)]:flex-row! xl:[&_.sandbox-video>div:nth-child(2)]:flex-col! [&_.theme-video-self]:min-h-[260px]! [&_.theme-video-interviewer]:min-h-[280px]! [&_.theme-video-interviewer]:flex-1! [&_.theme-video-interviewer>div:first-child>span:first-child]:bg-[#fffdf8] [&_.theme-video-interviewer>div:first-child>span:first-child]:text-[#182137]">
          {finishError && <p role="alert" className="p-3 text-sm text-red-700">{finishError}</p>}
          <VideoCallPanel controlsRef={controls} ending={ending} round="System Design" interviewer="Cue" problemSlug="" systemDesignSlug={scenario.slug} speaking={false} onVoiceStarted={() => setDeadline(previous => previous ?? Date.now() + 45 * 60 * 1000)} onTranscript={(source, message) => setTranscript(previous => [...previous, { source, message }])} onEndInterview={() => void finishInterview()} />
        </section>
        <aside aria-labelledby="company-scenario-heading" className="order-1 rounded-[26px] border border-[#c5c8ce] bg-[#fffdf8] p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#3054ed]">{scenario.company} scenario</p>
          <h2 id="company-scenario-heading" className="mt-4 text-2xl font-medium leading-tight tracking-tight">{scenario.title}</h2>
          <span className="mt-4 inline-flex rounded-full bg-[#fff1cb] px-3 py-1 text-xs capitalize text-[#78540c]">{scenario.difficulty}</span>
          <p className="mt-5 text-sm leading-7 text-[#687087]">{scenario.prompt}</p>
          <h3 className="mt-7 text-sm font-semibold">How this round works</h3>
          <p className="mt-3 text-sm leading-7 text-[#687087]">Talk through your design out loud. Start by asking clarifying questions. There is no code in this round.</p>
          <p className="mt-7 border-t border-[#e4e2db] pt-5 text-xs leading-6 text-[#687087]">Start the interview when you’re ready. Explain your assumptions and trade-offs out loud.</p>
        </aside>
        <section className="order-2 min-w-0 rounded-[26px] border border-[#c5c8ce] bg-[#fffdf8] p-6">
          <p className="mb-5 text-xs leading-6 text-[#687087]">Requirements → High-level design → Deep dive → Scaling &amp; tradeoffs → Wrap-up</p>
          <label className="grid gap-3 text-sm font-semibold">Design notes<textarea value={notes} onChange={event => setNotes(event.target.value)} rows={12} placeholder="Requirements, components, APIs, trade-offs..." className="w-full resize-y rounded-xl border border-[#c5c8ce] p-4 text-sm font-normal leading-7" /></label>
          <p className="mt-3 text-xs text-[#687087]">Notes and transcript stay during this visit and reset when you leave.</p>
          <h2 className="mt-7 text-lg font-medium">Live transcript</h2>
          <div role="log" aria-label="Live transcript" aria-live="polite" className="mt-4 max-h-72 overflow-y-auto text-sm leading-7">{transcript.length ? transcript.map((entry, index) => <p key={index}><strong>{entry.source === "user" ? "You" : "Cue"}:</strong> {entry.message}</p>) : <p className="text-[#687087]">Your conversation will appear here when you start.</p>}</div>
        </section>
      </div>}
    </div>
  </main>;
}

const LEVELS: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
const COVERAGE = ["Requirements", "Architecture", "Scale", "Trade-offs"];

/** Three-bar difficulty meter in brand blue. */
function DifficultyMeter({ difficulty }: { difficulty: string }) {
  const level = LEVELS[difficulty.toLowerCase()] ?? 2;
  return <span className="inline-flex items-center gap-2 text-xs capitalize text-[#687087]">
    <span aria-hidden="true" className="flex items-end gap-0.5">{[1, 2, 3].map(bar => <span key={bar} className={`w-1 rounded-full ${bar <= level ? "bg-[#3054ed]" : "bg-[#d9dcea]"}`} style={{ height: 4 + bar * 3 }} />)}</span>
    {difficulty}
  </span>;
}

function PromptRow({ index, title, difficulty, to }: { index: number; title: string; difficulty: string; to?: string }) {
  const body = <>
    <span className="font-mono text-2xl font-medium text-[#c3c8d8] transition group-hover:text-[#3054ed]">{String(index + 1).padStart(2, "0")}</span>
    <span className="min-w-0">
      <span className="block text-lg font-medium leading-snug text-[#182137]">{title}</span>
      <span className="mt-1.5 block"><DifficultyMeter difficulty={difficulty} /></span>
    </span>
    <span className="inline-flex items-center gap-2 rounded-full border border-[#182137] px-4 py-2 text-sm font-medium transition group-hover:bg-[#182137] group-hover:text-white">Design<span aria-hidden="true">&#8594;</span></span>
  </>;
  const row = "group grid grid-cols-[48px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-6 py-5 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:px-8 [&>span:last-child]:col-start-2 sm:[&>span:last-child]:col-start-auto [&>span:last-child]:justify-self-start sm:[&>span:last-child]:justify-self-end";
  return to
    ? <Link to={to} className={`${row} transition hover:bg-[#f6f4ee] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#3054ed]`}>{body}</Link>
    : <div className={`${row} cursor-default`}>{body}</div>;
}

function DesignBrief({ company }: { company: DesignCompany }) {
  const display = company.displayQuestions;
  const [questions, setQuestions] = useState<SystemDesignQuestion[]>([]);
  const [loading, setLoading] = useState(!display);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (display) return;
    // Remounted per company (keyed); retry resets loading/error before re-running this.
    const controller = new AbortController();
    listSystemDesignQuestions(company.name, controller.signal).then(value => {
      if (!controller.signal.aborted) setQuestions(value.questions);
    }).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not load questions.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [company.name, display, retry]);

  return <section aria-labelledby="design-brief-heading" className="overflow-hidden rounded-[32px] border border-[#e4e2db] bg-[#fffdf8] shadow-[0_30px_60px_-50px_#182137]">
    <div className="relative border-b border-[#e4e2db] px-6 py-8 sm:px-8" style={{ backgroundImage: "radial-gradient(#3054ed2e 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
      <div className="flex flex-wrap items-center gap-5">
        <CompanyLogo company={company} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-semibold tracking-[.18em] text-[#3054ed]">DESIGN BRIEF</p>
          <h2 id="design-brief-heading" className="mt-1 text-3xl font-semibold tracking-[-.03em]">{company.name}</h2>
          <p className="mt-1 text-sm text-[#687087]">{company.tagline}</p>
        </div>
        <div className="flex flex-wrap gap-2">{COVERAGE.map(item => <span key={item} className="rounded-full border border-[#182137]/15 bg-white/80 px-3 py-1 text-xs text-[#4b505c]">{item}</span>)}</div>
      </div>
    </div>
    <div aria-busy={loading}>
      {display ? <ol className="divide-y divide-[#ece9e1]">{display.map((question, index) => <li key={question.title}><PromptRow index={index} title={question.title} difficulty={question.difficulty} /></li>)}</ol>
        : loading ? <ol aria-label="Loading prompts" className="divide-y divide-[#ece9e1]">{[0, 1].map(key => <li key={key} className="px-8 py-6"><div className="h-6 w-2/3 animate-pulse rounded bg-[#f0eee8]" /></li>)}</ol>
        : error ? <div role="alert" className="m-6 rounded-2xl bg-[#fff0d7] p-5 text-sm text-[#76501e]"><p>{error}</p><button type="button" className="mt-3 rounded-xl border border-[#ead4ad] bg-white px-4 py-2 font-medium" onClick={() => { setLoading(true); setError(null); setRetry(value => value + 1); }}>Try again</button></div>
        : questions.length ? <ol className="divide-y divide-[#ece9e1]">{questions.map((question, index) => <li key={question.slug}><PromptRow index={index} title={question.title} difficulty={question.difficulty} to={"/interview/system-design/" + encodeURIComponent(question.slug)} /></li>)}</ol>
        : company.name === "Bumble" ? <ol className="divide-y divide-[#ece9e1]"><li><PromptRow index={0} title="Nearby matches for a dating app" difficulty="medium" to="/interview/system-design/bumble-nearby-matches" /></li></ol>
        : <p className="px-8 py-6 text-sm text-[#687087]">No prompts are available for {company.name} yet.</p>}
    </div>
  </section>;
}

function DesignQuestionPicker() {
  const [selected, setSelected] = useState(DESIGN_COMPANIES[0].name);
  const company = DESIGN_COMPANIES.find(item => item.name === selected) ?? DESIGN_COMPANIES[0];
  return <>
    <section aria-labelledby="companies-heading">
      <h2 id="companies-heading" className="font-mono text-xs font-semibold tracking-[.18em] text-[#687087]">PICK A COMPANY</h2>
      <div role="group" aria-label="Choose a company" className="mt-3 flex flex-wrap gap-2.5">
        {DESIGN_COMPANIES.map(item => {
          const active = item.name === company.name;
          return <button key={item.name} type="button" aria-pressed={active} onClick={() => setSelected(item.name)}
            className={`inline-flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3054ed] ${active ? "border-[#182137] bg-[#182137] text-white" : "border-[#e4e2db] bg-white/70 text-[#182137] hover:border-[#182137]"}`}>
            <CompanyLogo company={item} size="xs" />{item.name}
          </button>;
        })}
      </div>
    </section>
    <div className="mt-8"><DesignBrief key={company.name} company={company} /></div>
  </>;
}

export default function SystemDesign() {
  const { slug } = useParams<{ slug: string }>();
  if (slug) return <DesignCall key={slug} slug={slug} />;
  return <main className="app-sidebar-layout min-h-svh bg-cream-gradient px-4 pb-12 pt-2 font-sans text-[#182137] sm:px-6 lg:pl-[calc(var(--sidebar-width)+48px)] lg:pr-8 lg:pt-6 [--sidebar-width:224px] has-[.sidebar-collapsed]:[--sidebar-width:80px]">
    <NavbarDashboard />
    <div className="mx-auto max-w-[1184px] pt-9">
      <Link to="/interview" className="mb-2 inline-flex min-h-11 items-center gap-2 text-sm text-[#3054ed] hover:underline"><span aria-hidden="true">&#8592;</span>All interview modes</Link>
      <PageHeading eyebrow="SYSTEM DESIGN / NO CODE" title="Design it like you work there" subtitle="Choose a company, pick a real-world scenario, and talk through requirements, architecture, scale and trade-offs. No code, just your reasoning." />
      <div className="mt-6"><DesignQuestionPicker /></div>
    </div>
  </main>;
}
