import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { ProfileContext } from "../lib/profile";
import { getGreetingCopy, getWeeklyGoal, loadRecommendedProblem, loadSessionSummary, loadSkillScores, type SkillScore, type DashboardProblem, type SessionSummary } from "../lib/dashboard";

type LoadState<T> = { loading: boolean; data: T | null; error: string | null };
const initialLoad = { loading: true, data: null, error: null };
const card = "dashboard-card min-w-0 rounded-2xl bg-[#fffdf8] p-5 shadow-[0_8px_28px_-18px_rgba(75,63,34,0.2)] sm:p-6";
const eyebrow = "font-detail text-[10px] tracking-widest text-[#55595c]";
const button = "inline-flex min-h-12 items-center justify-center gap-6 rounded-lg bg-[#3b8fe8] px-6 py-3 text-sm font-semibold text-[#121826] transition hover:bg-[#6eaff8] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

export default function Dashboard() {
  const { user, profile } = useOutletContext<ProfileContext>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<LoadState<DashboardProblem>>(initialLoad);
  const [sessions, setSessions] = useState<LoadState<SessionSummary>>(initialLoad);
  const [skills, setSkills] = useState<LoadState<SkillScore[]>>(initialLoad);
  const [problemRetry, setProblemRetry] = useState(0);
  const [sessionRetry, setSessionRetry] = useState(0);
  const name = profile.display_name?.trim();
  const goal = getWeeklyGoal(profile);
  const completed = sessions.data?.completedThisWeek;
  const percentage = goal && completed !== undefined ? Math.min(completed / goal * 100, 100) : 0;
  const language = profile.preferred_language;
  const level = profile.starting_difficulty;
  const supportedLanguage = language === "Python" || language === "Java";

  useEffect(() => {
    let active = true;
    async function load() {
      setProblem(initialLoad);
      try {
        const data = await loadRecommendedProblem(supabase, profile.starting_difficulty);
        if (active) setProblem({ loading: false, data, error: null });
      } catch (err) {
        if (import.meta.env.DEV) console.error("Recommended problem loading failed", err);
        if (active) setProblem({ loading: false, data: null, error: "We couldn't load your next problem." });
      }
    }
    void load();
    return () => { active = false; };
  }, [profile.starting_difficulty, problemRetry]);

  useEffect(() => {
    let active = true;
    async function load() {
      setSessions(initialLoad);
      setSkills(initialLoad);
      try {
        const data = await loadSessionSummary(supabase, user.id);
        if (active) setSessions({ loading: false, data, error: null });
        try {
          const scores = await loadSkillScores(supabase, data.completedSessionIds);
          if (active) setSkills({ loading: false, data: scores, error: null });
        } catch (err) {
          if (import.meta.env.DEV) console.error("Skill feedback loading failed", err);
          if (active) setSkills({ loading: false, data: null, error: "We couldn't load your skill feedback." });
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error("Interview history loading failed", err);
        if (active) {
          setSessions({ loading: false, data: null, error: "We couldn't load your interview history." });
          setSkills({ loading: false, data: null, error: "We couldn't load your skill feedback." });
        }
      }
    }
    void load();
    return () => { active = false; };
  }, [user.id, sessionRetry]);

  function startPractice() {
    if (!problem.data || !supportedLanguage) return;
    navigate(`/interview/${encodeURIComponent(problem.data.id)}`, { state: { language } });
  }

  return <main className="clario-dashboard relative isolate min-h-svh overflow-hidden bg-[#f6efd9] px-4 pb-6 pt-2 font-sans text-[#191d20] sm:px-6 lg:px-[5%] [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4">
    <header className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#191d20]/5 bg-[#fffdf8] px-6 py-4 shadow-[0_4px_20px_-12px_rgba(25,29,32,0.12)]">
      <Link to="/" className="font-sans text-2xl font-semibold tracking-[-0.07em]" aria-label="Clario home">CLARIO<span className="text-[#3b8fe8]">.</span></Link>
      <nav aria-label="Main navigation" className="order-3 flex w-full flex-wrap justify-center gap-1 text-xs sm:order-none sm:w-auto sm:gap-2"><Link to="/dashboard" aria-current="page" className="rounded-full bg-[#e7f0fc] px-4 py-2.5 font-semibold text-[#2f7fe2]"><NavIcon kind="home" />Dashboard</Link><Link to="/interview" className="rounded-full px-4 py-2.5 text-[#55595c] hover:bg-[#F6EDD1]/50"><NavIcon kind="mic" />Interview</Link><a href="#next-practice" className="rounded-full px-4 py-2.5 text-[#55595c] hover:bg-[#F6EDD1]/50"><NavIcon kind="library" />Practice Library</a><a href="#skill-set" className="rounded-full px-4 py-2.5 text-[#55595c] hover:bg-[#F6EDD1]/50"><NavIcon kind="feedback" />Feedback</a></nav>
      <Link to="/settings" aria-label="Settings and practice profile" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#3b8fe8]/15 bg-[#e7f0fc] text-xs font-semibold text-[#2565b4]">{name ? name.charAt(0).toUpperCase() : <span aria-hidden="true">&#9881;</span>}</Link>
    </header>
    <div className="mx-auto max-w-[1440px]">
      {/* Compact greeting and contained weekly swim progress, using live session totals. */}
      <section className="grid items-center gap-5 py-7 lg:grid-cols-[1.4fr_1fr] lg:py-8">
        <div className="flex items-center gap-4"><div><p className={`mb-2 ${eyebrow}`}>YOUR PRACTICE ROOM</p><h1 className="text-[clamp(26px,2.8vw,40px)] font-semibold leading-[1.15] tracking-[-0.045em]">{name ? `Welcome back, ${name}.` : "Welcome back."}</h1><p className="mt-2 max-w-[520px] text-sm leading-6 text-[#55595c]">{getGreetingCopy(profile)}</p></div></div>
        <section className="weekly-swim rounded-2xl bg-[#fffdf8] px-6 py-4" aria-labelledby="weekly-heading" aria-busy={sessions.loading}>
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="weekly-heading" className="text-xs font-semibold">Weekly goal</h2>{!sessions.loading && !sessions.error && goal && <span className="text-xs font-medium text-[#2f7fe2]">{completed ?? 0} / {goal === 5 ? "5+" : goal} interviews</span>}</div>
          {sessions.loading ? <p role="status" className="mt-3 text-xs text-[#55595c]">Loading progress...</p> : sessions.error ? <InlineError message="Progress unavailable." onRetry={() => setSessionRetry((value) => value + 1)} /> : goal ? <><SwimmingGoal percent={percentage} completed={completed ?? 0} goal={goal} /><div className="mt-3 flex flex-wrap justify-between gap-2 text-[10px]"><span className="font-medium text-[#2f7fe2]">{percentage >= 100 ? "Goal reached. Nice swimming!" : "Keep swimming"}</span><span className="text-[#777a7c]">Resets every Monday</span></div></> : <Link to="/settings" className="mt-3 inline-block text-xs underline">Set your weekly goal</Link>}
        </section>
      </section>
      <div className="dashboard-bento grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-[1.2fr_1.73fr_0.99fr]">
        {/* The interview profile uses only actual feedback; the empty chart is a ghost grid. */}
        <section id="skill-set" className={`${card} flex scroll-mt-6 flex-col md:order-2 xl:order-none`} aria-labelledby="skill-heading">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="skill-heading" className="text-lg font-semibold tracking-tight">Skill Set</h2><span className="text-[9px] tracking-wider text-[#777a7c]">LAST 5 COMPLETED</span></div>
          <p className="mt-2 text-xs leading-5 text-[#777a7c]">Your interview skills across key areas.</p>
          {skills.loading ? <p role="status" className="py-10 text-sm text-[#55595c]">Loading your feedback...</p> : skills.error ? <InlineError message={skills.error} onRetry={() => setSessionRetry((value) => value + 1)} /> : <>
            <SkillRadar scores={skills.data ?? []} />
          </>}
        </section>
        <div className="min-w-0 flex flex-col gap-4 md:order-1 md:col-span-2 xl:order-none xl:col-span-1">
          {/* Primary CTA is visually distinct; recommendation keeps its existing problem flow. */}
          <section id="start-interview" className={`${card} interview-feature relative isolate scroll-mt-6`} aria-labelledby="start-heading">
            <svg viewBox="0 0 600 220" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 -z-10 h-full w-full rounded-2xl" aria-hidden="true"><path d="M0 135C140 160 210 225 365 178S480 74 600 70V220H0Z" fill="#dceaff" fillOpacity=".55" /><path d="M0 190C160 156 225 210 390 192S535 150 600 173V220H0Z" fill="#e9f2ff" /></svg>
            <div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#dfebff] text-[#2279ed]" aria-hidden="true"><MicrophoneIcon /></div><div><h2 id="start-heading" className="text-xl font-semibold tracking-tight">Start a New Interview</h2><p className="mt-2 max-w-md text-xs leading-6 text-[#55595c]">Practice your communication, reasoning, and code in a conversation with Clario.</p></div></div>
            <div className="mt-9 flex flex-wrap items-center justify-between gap-4"><div className="flex gap-2 text-[10px] font-medium text-[#2565b4]"><span className="rounded-full bg-white/75 px-3 py-1.5">~30 min</span><span className="rounded-full bg-white/75 px-3 py-1.5">AI interview</span></div><button type="button" onClick={() => navigate("/interview")} className={`${button} primary-interview-button min-w-[160px] shadow-[0_4px_12px_-4px_#3b8fe866]`}>Get Started <span aria-hidden="true">&#8599;</span></button></div>
          </section>
          <section id="next-practice" className={`${card} recommendation-surface flex scroll-mt-6 flex-col`} aria-labelledby="next-heading">
            <h2 id="next-heading" className="text-lg font-semibold tracking-tight">Next Recommended Problem</h2>
            {problem.loading ? <p role="status" className="mt-6 text-sm text-[#55595c]">Finding your next problem...</p> : problem.error ? <InlineError message={problem.error} onRetry={() => setProblemRetry((value) => value + 1)} /> : problem.data ? <>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px]"><span className="rounded-full bg-[#e6f0e8] px-3 py-1 font-medium text-[#3a6d48]">{problem.data.difficulty}</span>{problem.data.topic && <span className="rounded-full bg-[#e7f0fc] px-3 py-1 text-[#2565b4]">{problem.data.topic}</span>}<span className="ml-auto text-[#777a7c]">~30 min practice</span></div>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">{problem.data.title}</h3>
              <div className="mt-4 border-l-2 border-[#e6c764]/50 pl-4 py-1"><p className="text-[10px] font-semibold text-[#55595c]">Why this was recommended</p><p className="mt-1 text-xs leading-6 text-[#777a7c]">Matches your {level?.toLowerCase() || problem.data.difficulty.toLowerCase()} starting level{language ? ` for ${language} practice` : ""}{problem.data.topic ? `, with a focus on ${problem.data.topic.toLowerCase()}` : ""}.</p></div>
              <button type="button" onClick={startPractice} disabled={!supportedLanguage} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-4 rounded-lg border border-[#3b8fe8]/25 bg-[#e7f0fc] px-5 py-3 text-sm font-semibold text-[#2565b4] transition hover:bg-[#d5e6fc] disabled:opacity-50 motion-reduce:transition-none">Start Solving <span aria-hidden="true">&#8594;</span></button>
            </> : <div className="recommendation-empty mt-4 rounded-2xl bg-[#f7f3e8] p-5"><span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7f0fc] text-[#2f7fe2]" aria-hidden="true">&#10022;</span><h3 className="text-base font-semibold">Unlock your first recommendation</h3><p className="mt-2 text-xs leading-6 text-[#777a7c]">Complete your first interview so Clario can personalize your practice plan.</p></div>}
            {(!supportedLanguage || !level) && <Link to="/settings" className="mt-3 text-xs text-[#2f7fe2] underline underline-offset-4">Edit practice profile</Link>}
          </section>
        </div>
        {/* History and saved practice preferences share one quieter surface. */}
        <div className="min-w-0 flex flex-col gap-4 md:order-3 xl:order-none">
          <section className={`${card} history-surface flex flex-col`} aria-labelledby="recent-heading"><h2 id="recent-heading" className="text-lg font-semibold tracking-tight">Recent Sessions</h2>
            {sessions.loading ? <p role="status" className="mt-6 text-sm text-[#55595c]">Loading recent practice...</p> : sessions.error ? <InlineError message={sessions.error} onRetry={() => setSessionRetry((value) => value + 1)} /> : !sessions.data?.recent.length ? <div className="flex flex-col items-center py-6 text-center"><span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f0fc] text-[#6eaff8]" aria-hidden="true"><MicrophoneIcon /></span><h3 className="text-sm font-semibold">No interviews yet.</h3><p className="mt-2 text-xs leading-6 text-[#777a7c]">Your first conversation starts here.</p><Link to="/interview" className="mt-4 inline-flex items-center justify-center gap-4 rounded-xl bg-[#e7f0fc] px-5 py-3 text-xs font-medium text-[#2279ed]">Start an interview <span aria-hidden="true">&#8594;</span></Link></div> : <ul className="mt-5 space-y-3">{sessions.data.recent.map((session) => <li key={session.id} className="border-b border-[#191d20]/5 py-3 last:border-b-0"><div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[9px] text-[#777a7c]"><span>Practice interview</span><time dateTime={session.endedAt || session.startedAt || undefined}>{session.endedAt || session.startedAt ? new Date(session.endedAt || session.startedAt!).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" }) : "Date unavailable"}</time></div><h3 className="text-xs font-semibold leading-5">{session.problemTitle}</h3><p className="mt-2 text-[10px] leading-5 text-[#777a7c]">{[session.difficulty, session.status].filter(Boolean).join(" / ")}</p></li>)}</ul>}
          </section>
          <section className={`${card}`} aria-labelledby="profile-heading"><div className="flex items-center justify-between gap-3"><h2 id="profile-heading" className="text-sm font-semibold">Practice Profile</h2><Link to="/settings" aria-label="Edit practice profile" className="text-xs text-[#2279ed] hover:underline">Edit &#8594;</Link></div><dl className="mt-4 overflow-hidden rounded-xl border border-[#191d20]/5 text-xs"><div className="flex items-center gap-3 border-b border-[#191d20]/5 px-3 py-3"><span className="rounded-lg bg-[#e7f0fc] px-2 py-1 text-[#2279ed]" aria-hidden="true">&lt;/&gt;</span><dt className="flex-1 text-[#777a7c]">Language</dt><dd className="font-medium">{language || "Not set"}</dd></div><div className="flex items-center gap-3 px-3 py-3"><span className="rounded-lg bg-[#e7f0fc] px-2 py-1 text-[#2279ed]" aria-hidden="true">&#9776;</span><dt className="flex-1 text-[#777a7c]">Difficulty</dt><dd className="font-medium">{level || "Not set"}</dd></div></dl></section>
        </div>
      </div>
    </div>
  </main>;
}

// A previous profile can be supplied later without inventing historical scores.
function SkillRadar({ scores, previousScores }: { scores: SkillScore[]; previousScores?: SkillScore[] }) {
  const axes = [
    { key: "Coding", label: "Coding", x: 170, y: 46 },
    { key: "Communication", label: "Communication", x: 88, y: 188 },
    { key: "Reasoning", label: "Problem Solving / Reasoning", x: 252, y: 188 },
  ];
  const center = { x: 170, y: 141 };
  const values = (data: SkillScore[]) => axes.map((axis) => {
    const score = data.find((item) => item.label === axis.key)?.score;
    return typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 100 ? score : null;
  });
  const current = values(scores);
  const previous = previousScores ? values(previousScores) : null;
  const hasData = current.some((score) => score !== null);
  const complete = current.every((score) => score !== null);
  const point = (index: number, scale: number) => ({ x: center.x + (axes[index].x - center.x) * scale, y: center.y + (axes[index].y - center.y) * scale });
  const polygon = (scales: number[]) => scales.map((scale, index) => { const p = point(index, scale); return `${p.x},${p.y}`; }).join(" ");
  const gridPolygon = (scale: number) => Array.from({ length: 6 }, (_, index) => { const angle = (-90 + index * 60) * Math.PI / 180; return `${center.x + Math.cos(angle) * 95 * scale},${center.y + Math.sin(angle) * 95 * scale}`; }).join(" ");
  const description = hasData ? axes.map((axis, index) => `${axis.label}: ${current[index] === null ? "not enough data" : `${current[index]} out of 100`}`).join(". ") : "Your skill profile has no interview scores yet.";

  return <figure className="m-0 mt-3">
    <svg viewBox="0 0 340 250" className="mx-auto block h-auto w-full max-w-[380px] font-detail" role="img" aria-label={description}>
      {/* Grid rings are scale guides, never placeholder performance values. */}
      {[0.25, 0.5, 0.75, 1].map((scale) => <polygon key={scale} points={gridPolygon(scale)} fill="none" stroke={hasData ? "#c8d9ed" : "#c9c7bf"} strokeWidth="1" strokeDasharray={hasData ? undefined : "2 5"} opacity={hasData ? 0.7 : 0.6} />)}
      {axes.map((axis) => <line key={axis.key} x1={center.x} y1={center.y} x2={axis.x} y2={axis.y} stroke="#d9dedf" strokeDasharray="2 4" />)}
      {previous?.every((score) => score !== null) && <polygon points={polygon(previous.map((score) => score! / 100))} fill="none" stroke="#9faebd" strokeWidth="1.5" strokeDasharray="4 4" />}
      {complete && <polygon points={polygon(current.map((score) => score! / 100))} fill="#3b8fe8" fillOpacity="0.15" stroke="#3b8fe8" strokeWidth="2" strokeLinejoin="round" />}
      {current.map((score, index) => { if (score === null) return null; const p = point(index, score / 100); return <circle key={axes[index].key} cx={p.x} cy={p.y} r="3.5" fill="#3b8fe8" stroke="#fffdf8" strokeWidth="1.5" />; })}
      <text x="170" y="21" textAnchor="middle" fontSize="12" fill="#55595c">Coding{current[0] !== null && <tspan x="170" dy="16" fontSize="11" fill="#2f7fe2">{current[0]}</tspan>}</text>
      <text x="82" y="213" textAnchor="middle" fontSize="11" fill="#55595c">Communication{current[1] !== null && <tspan x="82" dy="16" fill="#2f7fe2">{current[1]}</tspan>}</text>
      <text x="257" y="210" textAnchor="middle" fontSize="11" fill="#55595c">Problem Solving<tspan x="257" dy="14">/ Reasoning{current[2] !== null && <tspan fill="#2f7fe2"> · {current[2]}</tspan>}</tspan></text>
    </svg>
    <figcaption className="rounded-xl bg-[#f7f3e8] px-4 py-3 text-left">
      <p className="text-sm font-medium text-[#454b50]">{hasData ? "Your interview profile" : "Your skill profile will take shape here."}</p>
      <p className="mt-2 text-xs leading-6 text-[#777a7c]">{hasData ? complete ? "Built from your latest interview feedback, one conversation at a time." : "Some skills are still awaiting feedback. Missing scores stay unplotted." : "Complete your first interview to unlock your baseline."}</p>
      {previous?.every((score) => score !== null) && <p className="mt-2 text-[10px] text-[#777a7c]">Blue: current · Dotted: previous</p>}
    </figcaption>
  </figure>;
}
function NavIcon({ kind }: { kind: "home" | "mic" | "library" | "feedback" }) {
  const paths = { home: "M3 10 12 3l9 7M6 9v12h5v-7h3v7h4V9", mic: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0ZM6 10v2a6 6 0 0 0 12 0v-2M12 18v4m-3 0h6", library: "m12 3 10 5-10 5L2 8Zm-9 9 9 5 9-5m-18 5 9 5 9-5", feedback: "M4 14h3v7H4Zm7-6h3v13h-3Zm7-5h3v18h-3Z" };
  return <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>;
}
function MicrophoneIcon() {
  return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 10v2a6 6 0 0 0 12 0v-2M12 18v3M9 21h6" /></svg>;
}
function SwimmingGoal({ percent, completed, goal }: { percent: number; completed: number; goal: number }) {
  return <div className="relative mt-7 px-5">
    <div className="relative h-3 rounded-full bg-[#3b8fe8]/15" role="progressbar" aria-label="Weekly interview goal" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(completed, goal)} aria-valuetext={`${completed} of ${goal} interviews completed`}>
      <div className="goal-water h-full rounded-full bg-[#3b8fe8]" style={{ width: `${percent}%` }} />
      <div className="goal-duck-position absolute -top-7 -ml-6 h-10 w-12" style={{ left: `${percent}%` }} aria-hidden="true">
        <svg viewBox="0 0 64 48" className="goal-duck h-full w-full" fill="none"><path d="M9 29c0-4-3-8-5-10 8 1 12 6 16 6h11c-3-4-3-10 0-14 3-5 10-7 15-4s7 9 4 14l10 3-11 4c-2 11-11 15-23 13C15 40 9 36 9 29Z" fill="#f5d449" stroke="#d9af32" strokeWidth="1.3" strokeLinejoin="round" /><path d="m50 21 10 3-11 4" fill="#f9a926" /><circle cx="44" cy="15" r="2" fill="#191d20" /><path d="M19 29c3 5 10 6 15 2" stroke="#d9af32" strokeWidth="2" strokeLinecap="round" /><ellipse cx="40" cy="20" rx="3" ry="1.8" fill="#efa777" /><path d="M6 44h14m7 0h9m7 0h12" stroke="#6eaff8" strokeWidth="2" strokeLinecap="round" /></svg>
      </div>
      <span className="absolute -right-3 -top-5 text-lg" aria-hidden="true">{percent >= 100 ? "✨" : "⚑"}</span>
    </div>
  </div>;
}
function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="mt-6"><p role="alert" className="text-sm leading-6 text-[#55595c]">{message}</p><button type="button" onClick={onRetry} className="mt-3 text-xs font-semibold underline underline-offset-4">Retry</button></div>;
}



