import "./dashboard.css";

import TextType from "../components/effects/TextType";
import WaterWaves from "../components/effects/WaterWaves";
import InterviewCalendar from "../components/dashboard/InterviewCalendar";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import type { ProfileContext } from "../lib/profile";
import { getGreetingCopy, loadRecommendedProblem, loadSessionSummary, loadSkillScores, type SkillScore, type DashboardProblem, type SessionSummary } from "../lib/dashboard";

type LoadState<T> = { loading: boolean; data: T | null; error: string | null };
const initialLoad = { loading: true, data: null, error: null };
const tourSteps = [
  { target: "launch", title: "Start an interview", copy: "Choose a guided practice session or a mock interview when you're ready to put your skills to the test." },
  { target: "recommendation", title: "Your next problem", copy: "Find a challenge matched to your starting difficulty, or explore the problem library." },
  { target: "calendar", title: "Build your streak", copy: "Completed interviews light up the calendar. Check your current and longest streaks, and browse past months." },
  { target: "skills", title: "See your skills grow", copy: "Your coding, communication, and reasoning scores will appear here as interview feedback becomes available." },
  { target: "recent-sessions", title: "Your recent sessions", copy: "See your latest interviews, their dates, and session status here. This space stays empty until session history is available." },
] as const;

export default function Dashboard() {
  const { profile, user } = useOutletContext<ProfileContext>();
  const location = useLocation();
  const navigate = useNavigate();
  const tourKey = "clario:dashboard-tour:v1:" + user.id;
  const [tourInvited, setTourInvited] = useState(() => {
    try { return localStorage.getItem(tourKey) !== "done"; } catch { return true; }
  });
  const [tourStep, setTourStep] = useState<number | null>(() => location.state?.startDashboardTour === true ? 0 : null);
  const duckRef = useRef<HTMLButtonElement>(null);
  const tourOpenerRef = useRef<HTMLButtonElement | null>(null);
  const tourRef = useRef<HTMLDivElement>(null);
  const tourActive = tourStep !== null;

  useEffect(() => {
    if (location.state?.startDashboardTour === true) {
      navigate(location.pathname + location.search + location.hash, {
        replace: true,
        state: { ...location.state, startDashboardTour: false },
      });
    }
  }, [location.pathname, location.search, location.hash, location.state, navigate]);

  function openTour(trigger: HTMLButtonElement) {
    tourOpenerRef.current = trigger;
    setTourStep(0);
  }

  function closeTour() {
    setTourStep(null);
    setTourInvited(false);
    try { localStorage.setItem(tourKey, "done"); } catch { /* The tour still works without storage. */ }
    const opener = tourOpenerRef.current;
    (opener?.isConnected ? opener : duckRef.current)?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (tourStep === null) return;
    const target = document.getElementById("dashboard-" + tourSteps[tourStep].target);
    target?.scrollIntoView({ behavior: "instant", block: "center" });
    tourRef.current?.focus({ preventScroll: true });
  }, [tourStep]);
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


  const shell = "relative z-1 mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:pl-[calc(var(--sidebar-width)+48px)] lg:pr-8";
  const muted = "mt-3 text-xs leading-7 text-[#657077]";
  return <main data-tour-invited={tourInvited && !tourActive} data-tour-active={tourActive} className="practice-dashboard app-sidebar-layout relative isolate min-h-svh overflow-clip bg-[#F7F1E4] pt-2 font-sans text-[#191d20] lg:pt-6 [--sidebar-width:224px] has-[.sidebar-collapsed]:[--sidebar-width:80px] [&_button]:cursor-pointer [&_:is(button,a):focus-visible]:outline-2 [&_:is(button,a):focus-visible]:outline-offset-4 [&_:is(button,a):focus-visible]:outline-[#2378db] [&_>.app-sidebar]:mx-4 sm:[&_>.app-sidebar]:mx-6 lg:[&_>.app-sidebar]:mx-0">
    <div className="dashboard-horizon" aria-hidden="true">
      <svg viewBox="0 0 1440 340" preserveAspectRatio="none" focusable="false">
        <defs>
          <linearGradient id="dashboard-horizon-far" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#EDF5FF" stopOpacity=".75" /><stop offset="1" stopColor="#EDF5FF" stopOpacity="0" /></linearGradient>
          <linearGradient id="dashboard-horizon-near" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#DCEBFC" stopOpacity=".65" /><stop offset="1" stopColor="#DCEBFC" stopOpacity="0" /></linearGradient>
        </defs>
        <path d="M0 88C190 32 350 152 590 96S960 32 1160 70S1340 114 1440 66V340H0Z" fill="url(#dashboard-horizon-far)" />
        <path d="M0 144C210 190 370 92 610 138S970 196 1180 120S1370 104 1440 136V340H0Z" fill="url(#dashboard-horizon-near)" />
      </svg>
    </div>
    <NavbarDashboard onStartTour={openTour} tourActive={tourActive} />
    <div className={shell}><header className="dashboard-welcome">
      <div className="dashboard-welcome-copy"><p className="text-[10px] font-semibold tracking-[0.13em] text-[#647582]">YOUR PRACTICE ROOM</p><h1 className="mt-3 text-[clamp(26px,2.6vw,36px)] font-semibold leading-[1.1] tracking-[-0.045em]"><TextType key={welcomeText} as="span" text={welcomeText} typingSpeed={75} initialDelay={200} loop={false} showCursor cursorCharacter="|" cursorBlinkDuration={0.6} startOnVisible /></h1><p className="mt-4 text-sm leading-7 text-[#55595c]">{getGreetingCopy(profile)}</p></div>
      <div className="dashboard-mascot"><button ref={duckRef} type="button" className="dashboard-duck-guide" onClick={event => openTour(event.currentTarget)} aria-label="Take a dashboard tour with your duck coach" aria-haspopup="dialog" aria-expanded={tourActive} aria-controls="dashboard-tour"><img src={import.meta.env.BASE_URL + "smartduck.png"} alt="" width="500" height="500" /></button></div>
    </header></div>
    <section aria-label="Your practice dashboard" className="dashboard-water relative isolate pb-8">
      <WaterWaves className="dashboard-ocean-waves" />
      <div className={shell}>
        <div className="dashboard-grid">
          <section id="dashboard-launch" data-tour-highlight={tourStep !== null && tourSteps[tourStep].target === "launch"} className="dashboard-glass dashboard-launch">
            <div className="dashboard-launch-copy"><p className="text-[10px] font-semibold tracking-[0.13em] text-[#2565b4]">READY WHEN YOU ARE</p><h2 className="mt-4 text-[clamp(25px,2.4vw,34px)] font-semibold leading-tight tracking-tight text-[#12354c]">Start an interview</h2><p className="mt-4 text-sm leading-7 text-[#456075]">A little practice. A lot more confidence.</p><Link to="/interview" className="dashboard-start mt-7 inline-flex min-h-12 items-center justify-between gap-8 rounded-2xl bg-[#2378db] px-6 py-4 text-sm font-semibold text-white">Start an interview <span aria-hidden="true">&#8599;</span></Link></div>
            <div className="dashboard-voice" aria-hidden="true"><div className="dashboard-voice-orb"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></svg></div><div className="dashboard-waveform">{Array.from({ length: 31 }, (_, index) => <span key={index} style={{ "--bar-height": (12 + Math.sin(index * 1.7) ** 2 * 44 + Math.sin(index * .4) ** 2 * 24) + "px", "--bar-delay": index * -0.13 + "s" } as CSSProperties} />)}</div></div>
          </section>
          <section id="dashboard-calendar" data-tour-highlight={tourStep !== null && tourSteps[tourStep].target === "calendar"} className="dashboard-glass dashboard-calendar"><InterviewCalendar completionDates={sessions.data?.completionDates ?? []} loading={sessions.loading} />{sessions.error && <InlineError message="Interview activity is unavailable." onRetry={() => setSessionRetry(value => value + 1)} />}</section>
          <section id="dashboard-recommendation" data-tour-highlight={tourStep !== null && tourSteps[tourStep].target === "recommendation"} className="dashboard-glass dashboard-recommendation text-[#12354c]"><p className="text-[10px] font-semibold tracking-[0.13em] text-[#647582]">UP NEXT</p><h2 className="mt-3 text-xl font-semibold tracking-tight">Next recommended problem</h2>{problem.loading ? <p role="status" className={muted}>Finding your next problem...</p> : problem.error ? <InlineError message={problem.error} onRetry={() => setProblemRetry(value => value + 1)} /> : problem.data ? <><h3 className="mt-6 text-2xl font-semibold tracking-tight">{problem.data.title}</h3><div className="mt-3 flex flex-wrap gap-2 text-xs text-[#2565b4]"><span className="rounded-full bg-white/50 px-3 py-1">{problem.data.difficulty}</span>{problem.data.topic && <span className="rounded-full bg-white/50 px-3 py-1">{problem.data.topic}</span>}</div><Link to="/problems" className="mt-6 inline-flex min-h-9 items-center gap-3 text-sm font-semibold text-[#2378db]">View problems &#8594;</Link></> : <div className="dashboard-recommendation-empty"><p>No recommendation yet.</p><span>Choose a challenge from the library to get started.</span><Link to="/problems">Explore the library <span aria-hidden="true">&#8594;</span></Link></div>}</section>
          <div className="dashboard-progress-group">
          <section id="dashboard-skills" data-tour-highlight={tourStep !== null && tourSteps[tourStep].target === "skills"} className="dashboard-glass dashboard-skills"><div className="dashboard-section-heading"><h2 className="text-xl font-semibold tracking-tight text-[#12354c]">Skill Set</h2><span>Interview progress</span></div>{skills.loading ? <p role="status" className={muted}>Loading your feedback...</p> : skills.error ? <InlineError message={skills.error} onRetry={() => setSessionRetry(value => value + 1)} /> : <SkillRadar scores={skills.data ?? []} />}</section>
            <section id="dashboard-recent-sessions" data-tour-highlight={tourStep !== null && tourSteps[tourStep].target === "recent-sessions"} className="dashboard-glass dashboard-recent-sessions" aria-labelledby="recent-sessions-heading">
              <h2 id="recent-sessions-heading">Recent Sessions</h2>
              {sessions.loading ? <p role="status" className={muted}>Loading recent practice...</p> : sessions.error ? <InlineError message={sessions.error} onRetry={() => setSessionRetry(value => value + 1)} /> : sessions.data?.recent.length ? <ul className="dashboard-session-list">{sessions.data.recent.map(session => {
                const timestamp = session.endedAt || session.startedAt;
                const date = timestamp ? new Date(timestamp) : null;
                const validDate = date && !Number.isNaN(date.getTime());
                return <li key={session.id}><time dateTime={validDate ? date.toISOString() : undefined}>{validDate ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" }) : "Date unavailable"}</time><h3>{session.problemTitle}</h3><p>{[session.difficulty, session.status].filter(Boolean).join(" / ")}</p></li>;
              })}</ul> : <div className="dashboard-sessions-empty"><p>Your first session starts here.</p><span>Your recent interviews will appear here.</span><Link to="/interview">Start an interview <span aria-hidden="true">&#8599;</span></Link></div>}
            </section>
          </div>
        </div>
      </div>
    </section>
    {tourStep !== null && <div ref={tourRef} id="dashboard-tour" role="dialog" aria-labelledby="dashboard-tour-title" aria-describedby="dashboard-tour-copy" tabIndex={-1} className="dashboard-tour" onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); closeTour(); }
    }}>
      <div className="dashboard-tour-top"><p>YOUR DUCK'S QUICK TOUR &middot; {tourStep + 1} / {tourSteps.length}</p><button type="button" onClick={closeTour} aria-label="Close dashboard tour">&#215;</button></div>
      <h2 id="dashboard-tour-title">{tourSteps[tourStep].title}</h2><p id="dashboard-tour-copy" aria-live="polite">{tourSteps[tourStep].copy}</p>
      <div className="dashboard-tour-actions"><button type="button" onClick={closeTour}>Skip tour</button><div>{tourStep > 0 && <button type="button" onClick={() => setTourStep(tourStep - 1)}>Back</button>}<button type="button" className="dashboard-tour-next" onClick={() => tourStep === tourSteps.length - 1 ? closeTour() : setTourStep(tourStep + 1)}>{tourStep === tourSteps.length - 1 ? "Got it" : "Next"} <span aria-hidden="true">&#8594;</span></button></div></div>
    </div>}
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
    <svg viewBox="0 0 340 280" className="mx-auto block h-auto w-full max-w-[380px] font-detail" role="img" aria-label={description}>
      {/* Grid rings are scale guides, never placeholder performance values. */}
      {[0.25, 0.5, 0.75, 1].map((scale) => <polygon key={scale} points={gridPolygon(scale)} fill="none" stroke="#191d20" strokeWidth="1.2" strokeDasharray="2 5" opacity="0.75" />)}
      {axes.map((axis) => <line key={axis.key} x1={center.x} y1={center.y} x2={axis.x} y2={axis.y} stroke="#191d20" strokeWidth="1.2" strokeDasharray="2 4" />)}
      {previous?.every((score) => score !== null) && <polygon points={polygon(previous.map((score) => score! / 100))} fill="none" stroke="#9faebd" strokeWidth="1.5" strokeDasharray="4 4" />}
      {complete && <polygon points={polygon(current.map((score) => score! / 100))} fill="#8bbef2" fillOpacity="0.32" stroke="none" />}
      <text x="170" y="21" textAnchor="middle" fontSize="10" fill="#55595c">Coding</text>
      <text x="88" y="260" textAnchor="middle" fontSize="9" fill="#55595c">Communication</text>
      <text x="252" y="256" textAnchor="middle" fontSize="9" fill="#55595c">Problem Solving<tspan x="252" dy="12">/ Reasoning</tspan></text>
    </svg>
    <dl className="dashboard-skill-values">{axes.map((axis, index) => <div key={axis.key}><dt>{axis.key === "Reasoning" ? "Reasoning" : axis.label}</dt><dd>{current[index] === null ? "Awaiting feedback" : current[index] + " / 100"}</dd></div>)}</dl>
    <figcaption className="rounded-xl bg-[#f7f3e8] px-4 py-3 text-left">
      <p className="text-sm font-medium text-[#454b50]">{hasData ? "Your interview profile" : "Your skill profile will take shape here."}</p>
      <p className="mt-2 text-xs leading-6 text-[#777a7c]">{hasData ? complete ? "Built from your latest interview feedback, one conversation at a time." : "Some skills are still awaiting feedback. Missing scores stay unplotted." : "Complete your first interview to unlock your baseline."}</p>
      {previous?.every((score) => score !== null) && <p className="mt-2 text-[10px] text-[#777a7c]">Blue: current Ã‚Â· Dotted: previous</p>}
    </figcaption>
  </figure>;
}

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="mt-6"><p role="alert" className="text-sm leading-6 text-[#55595c]">{message}</p><button type="button" onClick={onRetry} className="mt-3 text-xs font-semibold underline underline-offset-4">Retry</button></div>;
}
