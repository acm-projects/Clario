import PageHeading from "../components/ui/PageHeading";
import TypingDuck from "../components/dashboard/TypingDuck";

import TextType from "../components/effects/TextType";
import InterviewCalendar from "../components/dashboard/InterviewCalendar";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { interviewDays, interviewStreaks } from "../lib/interviewCalendar";
import type { ProfileContext } from "../lib/profile";
import { getGreetingCopy, loadRecommendedProblem, loadSessionSummary, loadSkillScores, type SkillScore, type DashboardProblem, type SessionSummary } from "../lib/dashboard";

// Dashboard styling uses Tailwind; custom animation keyframes live in index.css.
const dashboardStyles = {
  "practice-dashboard": `bg-[#f7f4e9] text-[#182137] group/dashboard`,
  "dashboard-welcome": `flex flex-wrap items-center justify-between gap-4 pt-3 pb-0`,
  "dashboard-welcome-copy": `min-w-0 flex-1 [&>p:last-child]:mt-2 [&>p:last-child]:text-[13px] [&>p:last-child]:text-[#687087]`,
  "dashboard-water": `relative pb-10`,
  "dashboard-grid": `grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] [grid-template-areas:"launch_recommendation"_"skills_calendar"] items-stretch gap-6 max-[767px]:grid-cols-[minmax(0,1fr)] max-[767px]:[grid-template-areas:"launch"_"recommendation"_"skills"_"calendar"] max-[767px]:gap-4`,
  "dashboard-glass": `relative min-w-0 rounded-[28px] border border-[#e4e2db] bg-[#fffdf8] p-7 text-[#182137] [scroll-margin-block:24px_240px] shadow-[0_16px_40px_-24px_#18213725] transition-[border-color,box-shadow] duration-200 max-[479px]:p-5 group-data-[tour-active=true]/dashboard:opacity-50 group-data-[tour-active=true]/dashboard:data-[tour-highlight=true]:opacity-100 group-data-[tour-active=true]/dashboard:data-[tour-highlight=true]:border-[#4566ed] group-data-[tour-active=true]/dashboard:data-[tour-highlight=true]:shadow-[0_0_0_3px_#4566ed40] motion-reduce:transition-none`,
  "dashboard-launch": `[grid-area:launch] isolate grid min-h-[410px] grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center gap-0 overflow-hidden border-transparent! bg-[#4566ed]! p-8! text-white max-[639px]:grid-cols-1 max-[639px]:p-6!`,
  "dashboard-launch-copy": `relative z-10 min-w-0 [&>p:last-of-type]:mt-5 [&>p:last-of-type]:text-[13px] [&>p:last-of-type]:leading-[1.8] [&>p:last-of-type]:text-[#dce3ff]`,
  "dashboard-start": `mt-5 inline-flex min-h-14 items-center justify-center gap-3 rounded-[18px] bg-[#ffdf4f] px-5 py-3 text-[14px] font-semibold text-[#182137] transition-colors hover:bg-[#f4cf37] motion-reduce:transition-none`,
  "dashboard-recommendation": `[grid-area:recommendation] flex min-h-[410px] flex-col border-transparent! bg-[#ffdf4f]! p-8! max-[479px]:p-6!`,
  "dashboard-recommendation-empty": `[&>p]:mt-3 [&>p]:text-base [&>p]:font-medium [&>span]:mt-1.5 [&>span]:block [&>span]:text-xs [&>span]:leading-[1.6] [&>span]:text-[#58627b]`,
  "dashboard-progress-group": `contents`,
  "dashboard-skills": `[grid-area:skills] [&_h2]:text-[17px] [&_h2]:font-semibold [&_h2]:tracking-[-.025em] [&_figure]:mt-2 [&_svg]:max-w-[340px] [&_svg_text]:fill-[#58627b] [&_figcaption]:mt-3 [&_figcaption]:rounded-lg [&_figcaption]:border [&_figcaption]:border-white/38 [&_figcaption]:bg-white/38 [&_figcaption]:px-3 [&_figcaption]:py-2.5 [&_figcaption]:shadow-[inset_0_1px_0_rgb(255_255_255/.65)] [&_figcaption_p]:text-[10px] [&_figcaption_p]:leading-[1.6] [&_figcaption_p+p]:mt-1`,
  "dashboard-section-heading": `flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 [&>span]:text-[10px] [&>span]:text-[#58627b] max-[479px]:items-baseline`,
  "dashboard-skill-values": `mt-1 grid gap-0 border-t border-white/45 [&>div]:flex [&>div]:justify-between [&>div]:gap-3.5 [&>div]:border-b [&>div]:border-white/45 [&>div]:py-[7px] [&>div]:text-[10px] [&_dt]:text-[#58627b] [&_dd]:text-[10px] [&_dd]:font-medium [&_dd]:text-[#182137] [&_dd]:tabular-nums`,
  "dashboard-tour": `fixed right-6 bottom-6 z-60 w-[min(360px,calc(100vw-32px))] rounded-3xl border border-[#ccd5fa] bg-[#f0f2ff] p-5 text-[#182137] shadow-[0_12px_50px_#153a7844] [&_h2]:mt-2 [&_h2]:text-xl [&_h2]:font-semibold [&>p]:mt-2.5 [&>p]:text-[13px] [&>p]:leading-[1.7] [&>p]:text-[#456075] max-[767px]:right-4 max-[767px]:bottom-4 max-[767px]:rounded-2xl`,
  "dashboard-tour-top": `flex items-center justify-between gap-3 [&_p]:text-[9px] [&_p]:font-semibold [&_p]:tracking-[.08em] [&_p]:text-[#2946c5] [&_button]:size-8 [&_button]:rounded-full [&_button]:text-[22px]`,
  "dashboard-tour-actions": `mt-[18px] flex items-center justify-between gap-3 [&>div]:flex [&>div]:items-center [&>div]:justify-between [&>div]:gap-3 [&_button]:min-h-10 [&_button]:rounded-xl [&_button]:px-3 [&_button]:py-2 [&_button]:text-xs`,
  "dashboard-tour-next": `bg-[#3054ed] text-white`,
  "dashboard-calendar": `[grid-area:calendar] p-[18px] [&_.dashboard-card]:bg-transparent [&_.dashboard-card]:p-0 [&_.dashboard-card]:shadow-none [&_.dashboard-card_h2]:text-[17px] [&_.dashboard-card_h2]:font-semibold [&_.dashboard-card_h2]:tracking-[-.025em] [&_.dashboard-card>p:first-of-type]:mt-[5px] [&_.dashboard-card>p:first-of-type]:text-[11px] [&_.dashboard-card>.grid-cols-2]:mt-2.5 [&_.dashboard-card>.grid-cols-2]:gap-2 [&_.dashboard-card>.grid-cols-2>div]:rounded-[10px] [&_.dashboard-card>.grid-cols-2>div]:border [&_.dashboard-card>.grid-cols-2>div]:border-white/38 [&_.dashboard-card>.grid-cols-2>div]:bg-white/38 [&_.dashboard-card>.grid-cols-2>div]:px-3 [&_.dashboard-card>.grid-cols-2>div]:py-2 [&_.dashboard-card>.grid-cols-2>div]:shadow-[inset_0_1px_0_rgb(255_255_255/.65)] [&_.dashboard-card>.grid-cols-2_p:first-child]:text-[23px] [&_.dashboard-card>.grid-cols-2_p:first-child]:leading-[1.2] [&_.dashboard-card>.mb-4]:mt-3 [&_.dashboard-card>.mb-4]:mb-1.5 [&_.dashboard-card>.grid-cols-7]:gap-[3px] [&_.dashboard-card_.aspect-square]:aspect-auto [&_.dashboard-card_.aspect-square]:min-h-8 [&_.dashboard-card_.aspect-square]:rounded-lg [&_.dashboard-card_.aspect-square]:text-xs [&_.dashboard-card>p:last-child]:mt-1.5 [&_.dashboard-card>p:last-child]:rounded-lg [&_.dashboard-card>p:last-child]:border [&_.dashboard-card>p:last-child]:border-white/38 [&_.dashboard-card>p:last-child]:bg-white/38 [&_.dashboard-card>p:last-child]:px-2.5 [&_.dashboard-card>p:last-child]:py-2 [&_.dashboard-card>p:last-child]:text-[11px] [&_.dashboard-card>p:last-child]:shadow-[inset_0_1px_0_rgb(255_255_255/.65)] [&_.dashboard-card>.mt-4:last-of-type]:mt-2`,
} as const;

type LoadState<T> = { loading: boolean; data: T | null; error: string | null };
const initialLoad = { loading: true, data: null, error: null };
const tourSteps = [
  { target: "launch", title: "Start an interview", copy: "Choose a guided practice session or a mock interview when you're ready to put your skills to the test." },
  { target: "recommendation", title: "Your next problem", copy: "Find a challenge matched to your starting difficulty, or explore the problem library." },
  { target: "calendar", title: "Build your streak", copy: "Completed interviews light up the calendar. Check your current and longest streaks, and browse past months." },
  { target: "skills", title: "See your skills grow", copy: "Your coding, communication, and reasoning scores will appear here as interview feedback becomes available." },
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
  const visitKey = "clario:dashboard-visited:v1:" + user.id;
  const [returningUser] = useState(() => {
    try { return localStorage.getItem(visitKey) === "yes" || localStorage.getItem(tourKey) === "done"; }
    catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem(visitKey, "yes"); } catch { /* Greeting still works without storage. */ }
  }, [visitKey]);
  const greeting = returningUser ? "Welcome back" : "Welcome";
  const welcomeText = name ? greeting + ", " + name + "." : greeting + ".";
  const streak = interviewStreaks(interviewDays(sessions.data?.completionDates ?? [])).current;

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
  const muted = "mt-3 text-xs leading-7 text-[#687087]";
  return <main data-tour-invited={tourInvited && !tourActive} data-tour-active={tourActive} className={["practice-dashboard app-sidebar-layout [&.app-sidebar-layout:has(.sidebar-collapsed)]:[--sidebar-width:var(--sidebar-compact)] relative isolate min-h-svh overflow-clip pt-2 font-sans lg:pt-6 [--sidebar-width:224px] has-[.sidebar-collapsed]:[--sidebar-width:80px] [&_button]:cursor-pointer [&_:is(button,a):focus-visible]:outline-2 [&_:is(button,a):focus-visible]:outline-offset-4 [&_:is(button,a):focus-visible]:outline-[#3054ed] [&_>.app-sidebar]:mx-4 sm:[&_>.app-sidebar]:mx-6 lg:[&_>.app-sidebar]:mx-0", dashboardStyles["practice-dashboard"]].join(" ")}>
    <NavbarDashboard onStartTour={openTour} tourActive={tourActive} />
    <div className={shell}><header className={["dashboard-welcome", dashboardStyles["dashboard-welcome"]].join(" ")}>
      <PageHeading eyebrow="YOUR PRACTICE ROOM" title={<TextType key={welcomeText} as="span" text={welcomeText} typingSpeed={75} initialDelay={200} loop={false} showCursor cursorCharacter="|" cursorBlinkDuration={0.6} startOnVisible />} subtitle={getGreetingCopy(profile)} />
      <div className="flex items-center gap-3"><span className="rounded-full bg-[#fff0a3] px-4 py-2 text-xs text-[#182137]">{sessions.loading ? "Loading streak..." : streak + " day" + (streak === 1 ? "" : "s") + " streak"}</span><span className="grid size-12 place-items-center rounded-2xl bg-[#3054ed] font-semibold italic text-white" aria-label={name || "Your profile"}>{name ? name.split(/\s+/).slice(0,2).map(part => part[0]).join("").toUpperCase() : "C"}</span></div>
    </header></div>
    <section aria-label="Your practice dashboard" className={["dashboard-water relative isolate pb-8", dashboardStyles["dashboard-water"]].join(" ")}>
      <div className={shell}>
        <div className={["dashboard-grid", dashboardStyles["dashboard-grid"]].join(" ")}>
          <section id="dashboard-launch" data-tour-highlight={tourStep !== null && tourSteps[tourStep].target === "launch"} className={["dashboard-glass dashboard-launch", dashboardStyles["dashboard-glass"], dashboardStyles["dashboard-launch"]].join(" ")}>

            <div className={["dashboard-launch-copy", dashboardStyles["dashboard-launch-copy"]].join(" ")}><span className="inline-flex items-center gap-2 rounded-full bg-[#e9edff]/90 px-3 py-2 font-mono text-[10px] font-semibold text-[#4566ed]"><span className="size-2 rounded-full bg-[#2cbe94] shadow-[0_0_0_4px_#2cbe9422]" aria-hidden="true" />AI interviewer online</span><h2 className="mt-8 text-[clamp(30px,3.3vw,48px)] font-semibold leading-[1.05] tracking-[-.05em] text-white">Ready to think<br />out loud?</h2><p>Practice your approach, explain your reasoning, and build interview confidence.</p><Link to="/interview" className={dashboardStyles["dashboard-start"]}><svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3"/></svg>Start an interview</Link></div>
            <button ref={duckRef} type="button" onClick={event => openTour(event.currentTarget)} aria-label="Take a dashboard tour with your typing duck coach" aria-haspopup="dialog" aria-expanded={tourActive} aria-controls="dashboard-tour" className="relative z-0 mx-auto aspect-[5/6] w-full max-w-[280px] self-center justify-self-center border-0 bg-transparent p-0 shadow-none max-[639px]:mt-5 max-[639px]:w-[65%] focus-visible:outline-white!"><TypingDuck /></button>
          </section>
          <section id="dashboard-calendar" data-tour-highlight={tourStep !== null && tourSteps[tourStep].target === "calendar"} className={["dashboard-glass dashboard-calendar", dashboardStyles["dashboard-glass"], dashboardStyles["dashboard-calendar"]].join(" ")}><InterviewCalendar completionDates={sessions.data?.completionDates ?? []} loading={sessions.loading} />{sessions.error && <InlineError message="Interview activity is unavailable." onRetry={() => setSessionRetry(value => value + 1)} />}</section>
          <section id="dashboard-recommendation" data-tour-highlight={tourStep !== null && tourSteps[tourStep].target === "recommendation"} aria-labelledby="recommendation-heading" className={["dashboard-glass dashboard-recommendation",dashboardStyles["dashboard-glass"],dashboardStyles["dashboard-recommendation"]].join(" ")}>
            <div className="flex items-center justify-between gap-4"><h2 id="recommendation-heading" className="font-mono text-[10px] font-medium tracking-[.14em]">NEXT UP FOR YOU</h2><svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m14 3 1.5 4.5L20 9l-4.5 1.5L14 15l-1.5-4.5L8 9l4.5-1.5ZM5 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z"/></svg></div>
            {problem.loading ? <p role="status" className="mt-12 text-sm">Finding your next problem...</p> : problem.error ? <InlineError message={problem.error} onRetry={() => setProblemRetry(value=>value+1)} /> : problem.data ? <>
              <div className="mt-10 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase"><span>{problem.data.difficulty}</span>{problem.data.topic && <><span aria-hidden="true">&#8226;</span><span>{problem.data.topic}</span></>}</div>
              <h3 className="mt-4 text-[clamp(26px,2.6vw,36px)] font-normal leading-[1.13] tracking-[-.045em]">{problem.data.title}</h3>
              <p className="mt-4 text-[13px] leading-[1.8]">A {problem.data.difficulty.toLowerCase()} challenge{problem.data.topic ? " to strengthen your " + problem.data.topic.toLowerCase() + " skills." : " matched to your practice level."}</p>
              <div className="mt-6 mb-7 flex items-center gap-2 text-[11px]"><svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>At your pace<span className="ml-3">Guided practice</span></div>
              <Link to="/interview?mode=recommended" state={{selectedProblem:{slug:problem.data.slug,title:problem.data.title,difficulty:problem.data.difficulty}}} className="mt-auto flex min-h-12 items-center justify-center gap-4 rounded-[14px] border border-[#182137]/25 bg-white/15 px-4 py-3 text-[13px] font-semibold transition-colors hover:bg-white/30">Practice this problem <span aria-hidden="true">&#8594;</span></Link>
            </> : <div className="flex flex-1 flex-col justify-center"><h3 className="mt-8 text-3xl leading-tight tracking-tight">Your next challenge<br />starts here.</h3><p className="mt-4 text-sm leading-7">Choose a problem from the library to start practicing.</p><Link to="/problems" className="mt-8 flex min-h-12 items-center justify-center gap-4 rounded-[14px] border border-[#182137]/25 bg-white/15 px-4 py-3 text-[13px] font-semibold hover:bg-white/30">Explore the library <span aria-hidden="true">&#8594;</span></Link></div>}
          </section>
          <div className={["dashboard-progress-group", dashboardStyles["dashboard-progress-group"]].join(" ")}>
          <section id="dashboard-skills" data-tour-highlight={tourStep !== null && tourSteps[tourStep].target === "skills"} className={["dashboard-glass dashboard-skills", dashboardStyles["dashboard-glass"], dashboardStyles["dashboard-skills"]].join(" ")}><div className={["dashboard-section-heading", dashboardStyles["dashboard-section-heading"]].join(" ")}><h2 className="text-xl font-semibold tracking-tight text-[#182137]">Your skill signal</h2><span>Interview progress</span></div>{skills.loading ? <p role="status" className={muted}>Loading your feedback...</p> : skills.error ? <InlineError message={skills.error} onRetry={() => setSessionRetry(value => value + 1)} /> : <SkillRadar scores={skills.data ?? []} />}</section>

          </div>
        </div>
      </div>
    </section>
    {tourStep !== null && <div ref={tourRef} id="dashboard-tour" role="dialog" aria-labelledby="dashboard-tour-title" aria-describedby="dashboard-tour-copy" tabIndex={-1} className={["dashboard-tour", dashboardStyles["dashboard-tour"]].join(" ")} onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); closeTour(); }
    }}>
      <div className={["dashboard-tour-top", dashboardStyles["dashboard-tour-top"]].join(" ")}><p>YOUR DUCK'S QUICK TOUR &middot; {tourStep + 1} / {tourSteps.length}</p><button type="button" onClick={closeTour} aria-label="Close dashboard tour">&#215;</button></div>
      <h2 id="dashboard-tour-title">{tourSteps[tourStep].title}</h2><p id="dashboard-tour-copy" aria-live="polite">{tourSteps[tourStep].copy}</p>
      <div className={["dashboard-tour-actions", dashboardStyles["dashboard-tour-actions"]].join(" ")}><button type="button" onClick={closeTour}>Skip tour</button><div>{tourStep > 0 && <button type="button" onClick={() => setTourStep(tourStep - 1)}>Back</button>}<button type="button" className={["dashboard-tour-next", dashboardStyles["dashboard-tour-next"]].join(" ")} onClick={() => tourStep === tourSteps.length - 1 ? closeTour() : setTourStep(tourStep + 1)}>{tourStep === tourSteps.length - 1 ? "Got it" : "Next"} <span aria-hidden="true">&#8594;</span></button></div></div>
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
      {[0.25, 0.5, 0.75, 1].map((scale) => <polygon key={scale} points={gridPolygon(scale)} fill="none" stroke="#182137" strokeWidth="1.2" strokeDasharray="2 5" opacity="0.75" />)}
      {axes.map((axis) => <line key={axis.key} x1={center.x} y1={center.y} x2={axis.x} y2={axis.y} stroke="#182137" strokeWidth="1.2" strokeDasharray="2 4" />)}
      {previous?.every((score) => score !== null) && <polygon points={polygon(previous.map((score) => score! / 100))} fill="none" stroke="#9faebd" strokeWidth="1.5" strokeDasharray="4 4" />}
      {complete && <polygon points={polygon(current.map((score) => score! / 100))} fill="#8bbef2" fillOpacity="0.32" stroke="none" />}
      <text x="170" y="21" textAnchor="middle" fontSize="10" fill="#687087">Coding</text>
      <text x="88" y="260" textAnchor="middle" fontSize="9" fill="#687087">Communication</text>
      <text x="252" y="256" textAnchor="middle" fontSize="9" fill="#687087">Problem Solving<tspan x="252" dy="12">/ Reasoning</tspan></text>
    </svg>
    <dl className={["dashboard-skill-values", dashboardStyles["dashboard-skill-values"]].join(" ")}>{axes.map((axis, index) => <div key={axis.key}><dt>{axis.key === "Reasoning" ? "Reasoning" : axis.label}</dt><dd>{current[index] === null ? "Awaiting feedback" : current[index] + " / 100"}</dd></div>)}</dl>
    <figcaption className="rounded-xl bg-[#f7f3e8] px-4 py-3 text-left">
      <p className="text-sm font-medium text-[#58627b]">{hasData ? "Your interview profile" : "Your skill profile will take shape here."}</p>
      <p className="mt-2 text-xs leading-6 text-[#777a7c]">{hasData ? complete ? "Built from your latest interview feedback, one conversation at a time." : "Some skills are still awaiting feedback. Missing scores stay unplotted." : "Complete your first interview to unlock your baseline."}</p>
      {previous?.every((score) => score !== null) && <p className="mt-2 text-[10px] text-[#777a7c]">Blue: current Ã‚Â· Dotted: previous</p>}
    </figcaption>
  </figure>;
}

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="mt-6"><p role="alert" className="text-sm leading-6 text-[#687087]">{message}</p><button type="button" onClick={onRetry} className="mt-3 text-xs font-semibold underline underline-offset-4">Retry</button></div>;
}
