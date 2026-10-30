import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import PageHeading from "../components/ui/PageHeading";
import { VideoCallPanel } from "../components/interview/VideoCallPanel";
import { request } from "../lib/api";

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
  const [ended, setEnded] = useState(false);
  useEffect(() => {
    if (deadline === null || ended) return;
    const update = () => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) setEnded(true);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [deadline, ended]);
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
          {ended ? <div role="status" className="p-8"><h2 className="text-2xl font-medium">Interview ended</h2><p className="mt-4 text-sm">Your notes and transcript remain below for this visit.</p><button onClick={() => navigate("/system-design")} className="mt-5 rounded-xl bg-[#3054ed] px-5 py-3 text-white">Choose a company</button></div> : <VideoCallPanel round="System Design" interviewer="Ducky" problemSlug="" systemDesignSlug={scenario.slug} speaking={false} onVoiceStarted={() => setDeadline(previous => previous ?? Date.now() + 45 * 60 * 1000)} onTranscript={(source, message) => setTranscript(previous => [...previous, { source, message }])} onEndInterview={() => setEnded(true)} />}
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
          <div role="log" aria-label="Live transcript" aria-live="polite" className="mt-4 max-h-72 overflow-y-auto text-sm leading-7">{transcript.length ? transcript.map((entry, index) => <p key={index}><strong>{entry.source === "user" ? "You" : "Ducky"}:</strong> {entry.message}</p>) : <p className="text-[#687087]">Your conversation will appear here when you start.</p>}</div>
        </section>
      </div>}
    </div>
  </main>;
}

export default function SystemDesign() {
  const { slug } = useParams<{ slug: string }>();
  if (slug) return <DesignCall key={slug} slug={slug} />;
  return <main className="app-sidebar-layout min-h-svh bg-cream-gradient px-4 pb-12 pt-2 font-sans text-[#182137] sm:px-6 lg:pl-[calc(var(--sidebar-width)+48px)] lg:pr-8 lg:pt-6 [--sidebar-width:224px] has-[.sidebar-collapsed]:[--sidebar-width:80px]">
    <NavbarDashboard />
    <div className="mx-auto max-w-[1184px] pt-9">
      <PageHeading eyebrow="SYSTEM DESIGN / NO CODE" title="Choose a company" subtitle="Talk through how you'd architect a system. No code, just your reasoning." />
      <Link to="/interview" className="mb-6 inline-flex min-h-11 items-center text-sm text-[#3054ed] hover:underline">All interview modes</Link>
      <section className="rounded-[30px] border border-[#c5c8ce] bg-[#fffdf8] p-7 sm:p-9">
        <h2 className="text-2xl font-medium">Choose a company</h2>
        <p className="mt-4 text-sm leading-7 text-[#687087]">Choose Bumble to open your video interview and company scenario.</p>
        <Link to="/interview/system-design/bumble-nearby-matches" className="mt-6 inline-flex min-h-11 items-center gap-3 rounded-xl border border-[#b9c9ff] bg-[#e9edff] px-5 py-3 text-sm font-medium text-[#3054ed] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3054ed]"><span aria-hidden="true" className="text-lg font-bold">B</span>Bumble<span aria-hidden="true">&#8594;</span></Link>
      </section>
    </div>
  </main>;
}
