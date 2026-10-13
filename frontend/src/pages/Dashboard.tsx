import MagicBento from "../components/dashboard/MagicBento";
import TextType from "../components/effects/TextType";
import WaterWaves from "../components/effects/WaterWaves";
import InterviewCalendar from "../components/dashboard/InterviewCalendar";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import { useEffect, useState, type CSSProperties } from "react";
import { Link, useOutletContext } from "react-router-dom";
import type { ProfileContext } from "../lib/profile";
import { getGreetingCopy, loadRecommendedProblem, loadSessionSummary, loadSkillScores, type SkillScore, type DashboardProblem, type SessionSummary } from "../lib/dashboard";

type LoadState<T> = { loading: boolean; data: T | null; error: string | null };
const initialLoad = { loading: true, data: null, error: null };

export default function Dashboard() {
  const { profile } = useOutletContext<ProfileContext>();
  const [problem, setProblem] = useState<LoadState<DashboardProblem>>(initialLoad);
  const [sessions, setSessions] = useState<LoadState<SessionSummary>>(initialLoad);
  const [skills, setSkills] = useState<LoadState<SkillScore[]>>(initialLoad);
  const [problemRetry, setProblemRetry] = useState(0);
  const [sessionRetry, setSessionRetry] = useState(0);
  const name = profile.display_name?.trim();
  const welcomeText = name ? `Welcome back, ${name}.` : "Welcome back.";

  useEffect(() => {
    let active = true;
    async function load() {
      setProblem(initialLoad);
      try {
        const data = await loadRecommendedProblem(profile.starting_difficulty);
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
        const data = await loadSessionSummary();
        if (active) setSessions({ loading: false, data, error: null });
        try {
          const scores = await loadSkillScores();
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
  }, [sessionRetry]);


  const language = profile.preferred_language;
  const level = profile.starting_difficulty;
  const supportedLanguage = language === "Python" || language === "Java";
  const shell = "relative z-1 mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:pl-[calc(var(--sidebar-width)+48px)] lg:pr-8";
  const muted = "mt-3 text-xs leading-7 text-[#657077]";
  return <main className="app-sidebar-layout relative isolate min-h-svh overflow-clip bg-[#f7f1d8] pt-2 font-sans text-[#191d20] lg:pt-6 [--sidebar-width:224px] has-[.sidebar-collapsed]:[--sidebar-width:80px] [&_button]:cursor-pointer [&_:is(button,a):focus-visible]:outline-2 [&_:is(button,a):focus-visible]:outline-offset-4 [&_:is(button,a):focus-visible]:outline-[#2378db] [&_>.app-sidebar]:mx-4 sm:[&_>.app-sidebar]:mx-6 lg:[&_>.app-sidebar]:mx-0">
    <NavbarDashboard />
    <div className={shell}><header className="relative py-8 sm:py-10"><p className="text-[10px] font-semibold tracking-[0.13em] text-[#647582]">YOUR PRACTICE ROOM</p><h1 className="mt-2 text-[clamp(28px,3vw,44px)] font-semibold leading-[1.15] tracking-[-0.045em]"><TextType key={welcomeText} as="span" text={welcomeText} typingSpeed={75} initialDelay={200} loop={false} showCursor cursorCharacter="|" cursorBlinkDuration={0.6} startOnVisible /></h1><p className="mt-2.5 max-w-[540px] text-sm leading-7 text-[#55595c]">{getGreetingCopy(profile)}</p></header></div>
    <section aria-label="Your practice dashboard" className="relative isolate mt-[104px] bg-[linear-gradient(180deg,#4e90ee,#4486e4_65%,#397ad5)] py-6 pb-10 md:mt-[120px]">
      <WaterWaves className="pointer-events-none absolute inset-x-0 -top-[126px] -z-1 h-[128px] overflow-hidden md:-top-[146px] md:h-[148px]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-1 overflow-hidden">{Array.from({ length: 8 }, (_, index) => <i key={index} className="absolute -bottom-[35px] left-[var(--bubble-left)] size-[var(--bubble-size)] rounded-full border border-[#e7f6ff66] [animation:studio-bubble-rise_22s_linear_var(--bubble-delay)_infinite] motion-reduce:animate-none" style={{ "--bubble-left": (8 + index * 12) + "%", "--bubble-delay": index * -3.8 + "s", "--bubble-size": (8 + index % 3 * 9) + "px" } as CSSProperties} />)}</div>
      <img src={import.meta.env.BASE_URL + "smartduck.png"} alt="Smart Clario duck" width="500" height="500" className="absolute right-[6%] bottom-[calc(100%+52px)] z-2 w-[160px] origin-[50%_85%] [animation:water-duck-float_6s_ease-in-out_infinite] md:right-[14%] md:bottom-[calc(100%+64px)] md:w-[clamp(160px,17vw,230px)] motion-reduce:animate-none" />
      <div className={shell}>
        <MagicBento className="[grid-auto-rows:minmax(0,auto)]! [--mb-surface:#f8fbff]! [--mb-shadow:0_10px_28px_-22px_#12354c80]! [--mb-edge:#e1eaf3]! [--mb-highlight:#ffffffa0]! [--mb-glow-alpha:.45]! [--mb-spot-alpha:.035]! [&_.magic-bento__content]:p-6 [&_.magic-bento__content]:gap-0 [&_.magic-bento__card]:select-text [&_.magic-bento__cell:first-child]:[--mb-surface:#eaf2ff] grid-cols-1! md:grid-cols-2! xl:grid-cols-3! [&_.magic-bento__cell]:[grid-column:span_1]! [&_.magic-bento__cell]:[grid-row:auto]!" columns={3} rowHeight={200} gap={20} radius={18} theme="light" glowColor="#3b8fe8" spotlightRadius={280} enableBorderGlow enableSpotlight clickEffect enableTilt={false} enableMagnetism={false} enableStars={false} textAutoHide={false} items={[
          { id: "launch", content: <section className="flex h-full flex-col items-start"><p className="text-[10px] font-semibold tracking-[0.13em] text-[#2565b4]">READY WHEN YOU ARE</p><h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-[#12354c]">Start an interview</h2><p className="mt-3 text-sm leading-7 text-[#657077]">Make room for a little practice. Build your confidence, one conversation at a time.</p><button type="button" className="mt-6 inline-flex min-h-12 items-center justify-between gap-6 rounded-lg bg-[#2378db] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1969c5]">Start an interview <span aria-hidden="true">&#8599;</span></button></section> },
          { id: "recommendation", content: <section className="flex h-full flex-col text-[#12354c]"><p className="text-[10px] font-semibold tracking-[0.13em] text-[#647582]">YOUR NEXT CHALLENGE</p><h2 className="mt-2.5 text-lg font-semibold">Next Recommended Problem</h2>{problem.loading ? <p role="status" className={muted}>Finding your next problem...</p> : problem.error ? <InlineError message={problem.error} onRetry={() => setProblemRetry(value => value + 1)} /> : problem.data ? <><div className="mt-4 flex flex-wrap gap-2 text-[10px] text-[#2565b4]"><span className="rounded-md bg-[#e7f0fc] px-2 py-1">{problem.data.difficulty}</span>{problem.data.topic && <span className="rounded-md bg-[#e7f0fc] px-2 py-1">{problem.data.topic}</span>}</div><h3 className="mt-3 text-lg font-semibold">{problem.data.title}</h3><p className={muted}>A focused challenge for your {level?.toLowerCase() || problem.data.difficulty.toLowerCase()} starting level{language ? " in " + language : ""}.</p></> : <><span aria-hidden="true" className="mt-3 text-[22px] text-[#2378db]">&lt;/&gt;</span><h3 className="mt-3 text-lg font-semibold">Your next challenge starts here.</h3><p className={muted}>Choose a problem from the library and practice at your own pace.</p><Link to="/problems" className="mt-3 inline-flex min-h-9 items-center gap-3 text-xs font-semibold text-[#2378db]">Explore the library &#8594;</Link></>}{(!supportedLanguage || !level) && <Link to="/settings" className="mt-2.5 text-[11px] text-[#657077] underline underline-offset-3">Set your practice preferences</Link>}</section> },
          { id: "skills", content: <section><h2 className="text-base font-semibold text-[#12354c]">Skill Set</h2>{skills.loading ? <p role="status" className={muted}>Loading your feedback...</p> : skills.error ? <InlineError message={skills.error} onRetry={() => setSessionRetry(value => value + 1)} /> : <SkillRadar scores={skills.data ?? []} />}</section> },
          { id: "calendar", content: <section className="[&_.dashboard-card]:border-0 [&_.dashboard-card]:bg-transparent [&_.dashboard-card]:p-0 [&_.dashboard-card]:shadow-none [&_.dashboard-card_h2]:text-base"><InterviewCalendar completionDates={sessions.data?.completionDates ?? []} loading={sessions.loading} />{sessions.error && <InlineError message="Interview activity is unavailable." onRetry={() => setSessionRetry(value => value + 1)} />}</section> },
          { id: "history", content: <section><h2 className="text-base font-semibold text-[#12354c]">Recent Sessions</h2>{sessions.loading ? <p role="status" className={muted}>Loading recent practice...</p> : sessions.error ? <InlineError message={sessions.error} onRetry={() => setSessionRetry(value => value + 1)} /> : !sessions.data?.recent.length ? <div className="pt-5"><h3 className="text-[13px] font-medium text-[#38566a]">Your first session starts here.</h3><p className={muted}>Your sessions will appear here, ready to revisit and learn from.</p></div> : <ul className="mt-4 max-h-[290px] divide-y divide-[#191d2010] overflow-y-auto">{sessions.data.recent.map(session => <li key={session.id} className="py-3"><time className="text-[10px] text-[#657077]" dateTime={session.endedAt || session.startedAt || undefined}>{session.endedAt || session.startedAt ? new Date(session.endedAt || session.startedAt!).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" }) : "Date unavailable"}</time><h3 className="my-1 text-xs font-semibold text-[#38566a]">{session.problemTitle}</h3><p className="text-[10px] text-[#657077]">{[session.difficulty, session.status].filter(Boolean).join(" / ")}</p></li>)}</ul>}</section> },
          { id: "profile", content: <section><div className="flex items-center justify-between"><h2 className="text-base font-semibold text-[#12354c]">Practice Profile</h2><Link to="/settings" aria-label="Edit practice profile" className="text-[10px] text-[#657077]">Edit &#8599;</Link></div><dl className="mt-3 text-xs"><div className="flex justify-between gap-3 border-b border-[#191d2010] py-2.5"><dt className="text-[#657077]">Language</dt><dd className="font-medium">{language || "Not set"}</dd></div><div className="flex justify-between gap-3 py-2.5"><dt className="text-[#657077]">Difficulty</dt><dd className="font-medium">{level || "Not set"}</dd></div></dl></section> }
        ]} />
      </div>
    </section>
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
      {complete && <polygon points={polygon(current.map((score) => score! / 100))} fill="#8bbef2" fillOpacity="0.32" stroke="none" />}
      <text x="170" y="21" textAnchor="middle" fontSize="12" fill="#55595c">Coding</text>
      <text x="82" y="213" textAnchor="middle" fontSize="11" fill="#55595c">Communication</text>
      <text x="257" y="210" textAnchor="middle" fontSize="11" fill="#55595c">Problem Solving<tspan x="257" dy="14">/ Reasoning</tspan></text>
    </svg>
    <figcaption className="rounded-xl bg-[#f7f3e8] px-4 py-3 text-left">
      <p className="text-sm font-medium text-[#454b50]">{hasData ? "Your interview profile" : "Your skill profile will take shape here."}</p>
      <p className="mt-2 text-xs leading-6 text-[#777a7c]">{hasData ? complete ? "Built from your latest interview feedback, one conversation at a time." : "Some skills are still awaiting feedback. Missing scores stay unplotted." : "Complete your first interview to unlock your baseline."}</p>
      {previous?.every((score) => score !== null) && <p className="mt-2 text-[10px] text-[#777a7c]">Blue: current Â· Dotted: previous</p>}
    </figcaption>
  </figure>;
}

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="mt-6"><p role="alert" className="text-sm leading-6 text-[#55595c]">{message}</p><button type="button" onClick={onRetry} className="mt-3 text-xs font-semibold underline underline-offset-4">Retry</button></div>;
}
















