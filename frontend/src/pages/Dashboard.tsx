
import TextType from "../components/effects/TextType";
import WaterWaves from "../components/effects/WaterWaves";
import InterviewCalendar from "../components/dashboard/InterviewCalendar";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import type { ProfileContext } from "../lib/profile";
import { getGreetingCopy, loadRecommendedProblem, loadSessionSummary, loadSkillScores, type SkillScore, type DashboardProblem, type SessionSummary } from "../lib/dashboard";

// Dashboard styling uses Tailwind; custom animation keyframes live in index.css.
const dashboardStyles = {
  "practice-dashboard": `bg-[#f7f4e9] text-[#182137] group/dashboard`,
  "dashboard-horizon": `hidden [&_svg]:block [&_svg]:size-full`,
  "dashboard-welcome": `flex items-center justify-between gap-6 pt-4 pb-[22px] [&_h1]:mt-2 [&_h1]:font-semibold [&_h1]:tracking-[-.045em] [&_h1]:leading-[1.2] max-[767px]:gap-3 max-[767px]:pb-5 max-[479px]:[&_h1]:text-[25px]`,
  "dashboard-welcome-copy": `min-w-0 flex-1 pl-7 max-[767px]:pl-3 [&>p:last-child]:mt-2 [&>p:last-child]:text-[13px] [&>p:last-child]:leading-[1.65] [&>p:last-child]:text-[#687087] max-[479px]:[&>p:last-child]:text-xs`,
  "dashboard-mascot": `relative top-[46px] isolate grid h-[104px] w-44 shrink-0 self-end place-items-center max-[767px]:top-10 max-[767px]:h-[90px] max-[767px]:w-28 group-data-[tour-invited=true]/dashboard:before:content-[''] group-data-[tour-invited=true]/dashboard:before:absolute group-data-[tour-invited=true]/dashboard:before:inset-1 group-data-[tour-invited=true]/dashboard:before:-z-2 group-data-[tour-invited=true]/dashboard:before:[background:radial-gradient(ellipse,#dcecff80,transparent_70%)]`,
  "dashboard-duck-guide": `relative z-1 -mt-2.5 w-28 rounded-xl border-0 bg-transparent p-0 animate-[dashboard-duck-swim_12s_ease-in-out_infinite] hover:[animation-play-state:paused] focus-visible:[animation-play-state:paused] [&_img]:block [&_img]:h-auto [&_img]:w-full [&_img]:scale-[1.12] [&_img]:origin-[50%_85%] [&_img]:animate-[dashboard-duck-bob_4s_ease-in-out_infinite] group-data-[tour-invited=true]/dashboard:[&_img]:[filter:drop-shadow(0_0_9px_#ecd58480)] hover:[&_img]:[filter:drop-shadow(0_3px_6px_#2378db33)] max-[767px]:w-[86px] max-[767px]:animate-[dashboard-duck-swim-mobile_12s_ease-in-out_infinite] motion-reduce:animate-none motion-reduce:[&_img]:animate-none`,
  "dashboard-water": `relative isolate mt-14 min-h-[calc(100svh-170px)] pt-4 pb-8 [background:linear-gradient(180deg,var(--water),var(--water-deep))] max-[767px]:mt-12 max-[767px]:pt-3`,
  "dashboard-ocean-waves": `pointer-events-none absolute inset-x-0 -top-[78px] -z-1 h-20 overflow-hidden`,
  "dashboard-grid": `grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] [grid-template-areas:"launch_recommendation"_"skills_calendar"] items-stretch gap-[18px] max-[767px]:grid-cols-[minmax(0,1fr)] max-[767px]:[grid-template-areas:"launch"_"recommendation"_"calendar"_"skills"] max-[767px]:gap-3.5`,
  "dashboard-glass": `relative min-w-0 rounded-3xl border border-[#e4e2db] bg-[#fffdf8] p-[22px] text-[#182137] backdrop-blur-[8px] [scroll-margin-block:24px_240px] shadow-[0_4px_16px_-10px_rgb(13_48_99/.2)] transition-[border-color,box-shadow,transform] duration-250 hover:border-[rgb(196_213_230/.9)] focus-within:border-[rgb(196_213_230/.9)] hover:shadow-[0_6px_20px_-12px_rgb(13_48_99/.25)] focus-within:shadow-[0_6px_20px_-12px_rgb(13_48_99/.25)] max-[1199px]:p-[18px] max-[767px]:rounded-[20px] [&_h2]:text-[#182137] [&_h3]:text-[#182137] [&_p]:text-[#58627b] [&_a:not(.dashboard-start)]:text-[#2946c5] group-data-[tour-active=true]/dashboard:opacity-50 group-data-[tour-active=true]/dashboard:data-[tour-highlight=true]:opacity-100 group-data-[tour-active=true]/dashboard:data-[tour-highlight=true]:border-[#3054ed] group-data-[tour-active=true]/dashboard:data-[tour-highlight=true]:shadow-[0_0_0_3px_#2378db40] [@media(hover:hover)_and_(prefers-reduced-motion:no-preference)]:hover:-translate-y-[3px] motion-reduce:transition-none`,
  "dashboard-launch": `[background:linear-gradient(135deg,#3054ed,#2b43bd)]! [&_h2]:text-white! [&_p]:text-[#e0e6ff]! [&_.dashboard-voice]:text-[#ffdf4f]! group/launch [grid-area:launch] flex min-h-[188px] items-center gap-5 max-[1199px]:gap-3 max-[767px]:min-h-[180px] max-[767px]:gap-5 max-[479px]:gap-2.5 [&_h2]:mt-2 [&_h2]:text-[clamp(24px,2.2vw,30px)] [&_h2]:tracking-[-.04em]`,
  "dashboard-launch-copy": `min-w-0 flex-1 [&>p:first-child]:text-[#2946c5] [&>p:last-of-type]:mt-2 [&>p:last-of-type]:text-[13px] [&>p:last-of-type]:leading-[1.6] [&>p:last-of-type]:text-[#58627b]`,
  "dashboard-start": `group/start mt-[18px] inline-flex min-h-11 items-center justify-between gap-7 rounded-[10px] bg-[#ffdf4f] px-[18px] py-[11px] text-[13px] font-semibold text-[#182137] shadow-[0_3px_8px_#2378db18] transition-[background,transform] duration-250 hover:-translate-y-0.5 hover:bg-[#f4cf37] [&_span]:transition-transform [&_span]:duration-250 hover:[&_span]:translate-x-0.5 hover:[&_span]:-translate-y-0.5 max-[479px]:gap-[18px] max-[479px]:px-3.5 motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:[&_span]:transition-none motion-reduce:hover:[&_span]:transform-none`,
  "dashboard-voice": `flex w-[120px] shrink-0 flex-col items-center gap-2 text-[#3054ed] min-[768px]:max-[1199px]:w-[84px] max-[479px]:w-[76px]`,
  "dashboard-voice-orb": `grid size-12 place-items-center rounded-full border border-white/75 [background:linear-gradient(135deg,rgb(255_255_255/.65),rgb(255_255_255/.2))] shadow-[inset_0_1px_3px_rgb(255_255_255/.9),0_0_0_7px_rgb(255_255_255/.15)] [&_svg]:size-6`,
  "dashboard-waveform": `flex h-[50px] w-full items-center justify-center gap-0.5 max-[479px]:gap-px [&_span]:w-0.5 [&_span]:h-[calc(var(--bar-height)*.55)] [&_span]:rounded [&_span]:[background:linear-gradient(#94bff0,#347cc9)] [&_span]:animate-[dashboard-voice-pulse_1.5s_ease-in-out_var(--bar-delay)_infinite_alternate] group-hover/launch:[&_span]:[animation-duration:.9s] motion-reduce:[&_span]:animate-none`,
  "dashboard-recommendation": `bg-[#ffdf4f]! border-[#f2d33e]! [&_p]:text-[#3a3d40]! [&_h2]:text-[#3a3d40]! [&_a]:text-[#182137]! [grid-area:recommendation] flex flex-col justify-center [&_h2]:mt-[7px] [&_h2]:text-sm [&_h2]:font-medium [&_h2]:text-[#58627b] [&_h3]:mt-3 [&_h3]:text-xl [&_h3]:leading-[1.3] [&_h3]:tracking-[-.03em] [&_h3+div]:mt-2 [&_h3+div]:text-[10px] [&_h3+div]:text-[#2946c5] [&_h3+div>span]:rounded-md [&_h3+div>span]:border [&_h3+div>span]:border-white/38 [&_h3+div>span]:bg-white/38 [&_h3+div>span]:px-2 [&_h3+div>span]:py-1 [&_h3+div>span]:shadow-[inset_0_1px_0_rgb(255_255_255/.65)] [&_a]:mt-3 [&_a]:inline-flex [&_a]:min-h-8 [&_a]:items-center [&_a]:gap-2.5 [&_a]:text-xs [&_a]:font-semibold [&_a:hover]:underline [&_a:hover]:underline-offset-4`,
  "dashboard-recommendation-empty": `[&>p]:mt-3 [&>p]:text-base [&>p]:font-medium [&>span]:mt-1.5 [&>span]:block [&>span]:text-xs [&>span]:leading-[1.6] [&>span]:text-[#58627b]`,
  "dashboard-progress-group": `[grid-area:skills] grid min-w-0 grid-cols-2 [grid-template-areas:"skills_sessions"] items-stretch gap-4 [&>.dashboard-glass]:h-full [&>.dashboard-glass]:p-[18px] max-[479px]:grid-cols-[minmax(0,1fr)] max-[479px]:[grid-template-areas:"skills"_"sessions"] max-[479px]:auto-rows-fr`,
  "dashboard-skills": `[grid-area:skills] [&_h2]:text-[17px] [&_h2]:font-semibold [&_h2]:tracking-[-.025em] [&_figure]:mt-2 [&_svg]:max-w-[340px] [&_svg_text]:fill-[#58627b] [&_figcaption]:mt-3 [&_figcaption]:rounded-lg [&_figcaption]:border [&_figcaption]:border-white/38 [&_figcaption]:bg-white/38 [&_figcaption]:px-3 [&_figcaption]:py-2.5 [&_figcaption]:shadow-[inset_0_1px_0_rgb(255_255_255/.65)] [&_figcaption_p]:text-[10px] [&_figcaption_p]:leading-[1.6] [&_figcaption_p+p]:mt-1`,
  "dashboard-section-heading": `flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 [&>span]:text-[10px] [&>span]:text-[#58627b] max-[479px]:items-baseline`,
  "dashboard-skill-values": `mt-1 grid gap-0 border-t border-white/45 [&>div]:flex [&>div]:justify-between [&>div]:gap-3.5 [&>div]:border-b [&>div]:border-white/45 [&>div]:py-[7px] [&>div]:text-[10px] [&_dt]:text-[#58627b] [&_dd]:text-[10px] [&_dd]:font-medium [&_dd]:text-[#182137] [&_dd]:tabular-nums`,
  "dashboard-recent-sessions": `[grid-area:sessions] flex min-w-0 flex-col [&>h2]:text-[17px] [&>h2]:font-semibold [&>h2]:tracking-[-.025em]`,
  "dashboard-session-list": `mt-3.5 [&_li]:border-b [&_li]:border-white/50 [&_li]:py-3.5 [&_li:last-child]:border-0 [&_time]:text-[10px] [&_time]:text-[#58627b] [&_h3]:mt-1.5 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:[overflow-wrap:anywhere] [&_p]:mt-[5px] [&_p]:text-[10px]`,
  "dashboard-sessions-empty": `flex flex-1 flex-col justify-center py-5 [&>p]:text-[13px] [&>p]:font-medium [&>p]:leading-[1.6] [&>p]:text-[#182137] [&>span]:mt-2 [&>span]:text-[11px] [&>span]:leading-[1.7] [&>span]:text-[#58627b] [&_a]:mt-3 [&_a]:inline-flex [&_a]:min-h-9 [&_a]:items-center [&_a]:self-start [&_a]:gap-2 [&_a]:text-[11px] [&_a]:font-medium [&_a:hover]:underline [&_a:hover]:underline-offset-[3px]`,
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
  const muted = "mt-3 text-xs leading-7 text-[#687087]";
  return <main data-tour-invited={tourInvited && !tourActive} data-tour-active={tourActive} className={["practice-dashboard app-sidebar-layout relative isolate min-h-svh overflow-clip pt-2 font-sans lg:pt-6 [--sidebar-width:224px] has-[.sidebar-collapsed]:[--sidebar-width:80px] [&_button]:cursor-pointer [&_:is(button,a):focus-visible]:outline-2 [&_:is(button,a):focus-visible]:outline-offset-4 [&_:is(button,a):focus-visible]:outline-[#3054ed] [&_>.app-sidebar]:mx-4 sm:[&_>.app-sidebar]:mx-6 lg:[&_>.app-sidebar]:mx-0", dashboardStyles["practice-dashboard"]].join(" ")}>
    <div className={["dashboard-horizon", dashboardStyles["dashboard-horizon"]].join(" ")} aria-hidden="true">
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
    <div className={shell}><header className={["dashboard-welcome", dashboardStyles["dashboard-welcome"]].join(" ")}>
      <div className={["dashboard-welcome-copy", dashboardStyles["dashboard-welcome-copy"]].join(" ")}><p className="text-[10px] font-semibold tracking-[0.13em] text-[#647582]">YOUR PRACTICE ROOM</p><h1 className="mt-3 text-[clamp(26px,2.6vw,36px)] font-semibold leading-[1.1] tracking-[-0.045em]"><TextType key={welcomeText} as="span" text={welcomeText} typingSpeed={75} initialDelay={200} loop={false} showCursor cursorCharacter="|" cursorBlinkDuration={0.6} startOnVisible /></h1><p className="mt-4 text-sm leading-7 text-[#687087]">{getGreetingCopy(profile)}</p></div>
      <div className={["dashboard-mascot", dashboardStyles["dashboard-mascot"]].join(" ")}><button ref={duckRef} type="button" className={["dashboard-duck-guide", dashboardStyles["dashboard-duck-guide"]].join(" ")} onClick={event => openTour(event.currentTarget)} aria-label="Take a dashboard tour with your duck coach" aria-haspopup="dialog" aria-expanded={tourActive} aria-controls="dashboard-tour"><img src={import.meta.env.BASE_URL + "smartduck.png"} alt="" width="500" height="500" /></button></div>
    </header></div>
    <section aria-label="Your practice dashboard" className={["dashboard-water relative isolate pb-8", dashboardStyles["dashboard-water"]].join(" ")}>
      <WaterWaves className={["dashboard-ocean-waves", dashboardStyles["dashboard-ocean-waves"]].join(" ")} />
      <div className={shell}>
        <div className={["dashboard-grid", dashboardStyles["dashboard-grid"]].join(" ")}>
          <section id="dashboard-launch" data-tour-highlight={tourStep !== null && tourSteps[tourStep].target === "launch"} className={["dashboard-glass dashboard-launch", dashboardStyles["dashboard-glass"], dashboardStyles["dashboard-launch"]].join(" ")}>
            <div className={["dashboard-launch-copy", dashboardStyles["dashboard-launch-copy"]].join(" ")}><p className="text-[10px] font-semibold tracking-[0.13em] text-[#2946c5]">READY WHEN YOU ARE</p><h2 className="mt-4 text-[clamp(25px,2.4vw,34px)] font-semibold leading-tight tracking-tight text-[#182137]">Start an interview</h2><p className="mt-4 text-sm leading-7 text-[#456075]">A little practice. A lot more confidence.</p><Link to="/interview" className={["dashboard-start inline-flex items-center justify-between font-semibold ", dashboardStyles["dashboard-start"]].join(" ")}>Start an interview <span aria-hidden="true">&#8599;</span></Link></div>
            <div className={["dashboard-voice", dashboardStyles["dashboard-voice"]].join(" ")} aria-hidden="true"><div className={["dashboard-voice-orb", dashboardStyles["dashboard-voice-orb"]].join(" ")}><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></svg></div><div className={["dashboard-waveform", dashboardStyles["dashboard-waveform"]].join(" ")}>{Array.from({ length: 31 }, (_, index) => <span key={index} style={{ "--bar-height": (12 + Math.sin(index * 1.7) ** 2 * 44 + Math.sin(index * .4) ** 2 * 24) + "px", "--bar-delay": index * -0.13 + "s" } as CSSProperties} />)}</div></div>
          </section>
          <section id="dashboard-calendar" data-tour-highlight={tourStep !== null && tourSteps[tourStep].target === "calendar"} className={["dashboard-glass dashboard-calendar", dashboardStyles["dashboard-glass"], dashboardStyles["dashboard-calendar"]].join(" ")}><InterviewCalendar completionDates={sessions.data?.completionDates ?? []} loading={sessions.loading} />{sessions.error && <InlineError message="Interview activity is unavailable." onRetry={() => setSessionRetry(value => value + 1)} />}</section>
          <section id="dashboard-recommendation" data-tour-highlight={tourStep !== null && tourSteps[tourStep].target === "recommendation"} className={["dashboard-glass dashboard-recommendation", dashboardStyles["dashboard-glass"], dashboardStyles["dashboard-recommendation"]].join(" ")}><p className="text-[10px] font-semibold tracking-[0.13em] text-[#647582]">UP NEXT</p><h2 className="mt-3 text-xl font-semibold tracking-tight">Next recommended problem</h2>{problem.loading ? <p role="status" className={muted}>Finding your next problem...</p> : problem.error ? <InlineError message={problem.error} onRetry={() => setProblemRetry(value => value + 1)} /> : problem.data ? <><h3 className="mt-6 text-2xl font-semibold tracking-tight">{problem.data.title}</h3><div className="mt-3 flex flex-wrap gap-2 text-xs text-[#2946c5]"><span className="rounded-full bg-white/50 px-3 py-1">{problem.data.difficulty}</span>{problem.data.topic && <span className="rounded-full bg-white/50 px-3 py-1">{problem.data.topic}</span>}</div><Link to="/problems" className="mt-6 inline-flex min-h-9 items-center gap-3 text-sm font-semibold text-[#3054ed]">View problems &#8594;</Link></> : <div className={["dashboard-recommendation-empty", dashboardStyles["dashboard-recommendation-empty"]].join(" ")}><p>No recommendation yet.</p><span>Choose a challenge from the library to get started.</span><Link to="/problems">Explore the library <span aria-hidden="true">&#8594;</span></Link></div>}</section>
          <div className={["dashboard-progress-group", dashboardStyles["dashboard-progress-group"]].join(" ")}>
          <section id="dashboard-skills" data-tour-highlight={tourStep !== null && tourSteps[tourStep].target === "skills"} className={["dashboard-glass dashboard-skills", dashboardStyles["dashboard-glass"], dashboardStyles["dashboard-skills"]].join(" ")}><div className={["dashboard-section-heading", dashboardStyles["dashboard-section-heading"]].join(" ")}><h2 className="text-xl font-semibold tracking-tight text-[#182137]">Skill Set</h2><span>Interview progress</span></div>{skills.loading ? <p role="status" className={muted}>Loading your feedback...</p> : skills.error ? <InlineError message={skills.error} onRetry={() => setSessionRetry(value => value + 1)} /> : <SkillRadar scores={skills.data ?? []} />}</section>
            <section id="dashboard-recent-sessions" data-tour-highlight={tourStep !== null && tourSteps[tourStep].target === "recent-sessions"} className={["dashboard-glass dashboard-recent-sessions", dashboardStyles["dashboard-glass"], dashboardStyles["dashboard-recent-sessions"]].join(" ")} aria-labelledby="recent-sessions-heading">
              <h2 id="recent-sessions-heading">Recent Sessions</h2>
              {sessions.loading ? <p role="status" className={muted}>Loading recent practice...</p> : sessions.error ? <InlineError message={sessions.error} onRetry={() => setSessionRetry(value => value + 1)} /> : sessions.data?.recent.length ? <ul className={["dashboard-session-list", dashboardStyles["dashboard-session-list"]].join(" ")}>{sessions.data.recent.map(session => {
                const timestamp = session.endedAt || session.startedAt;
                const date = timestamp ? new Date(timestamp) : null;
                const validDate = date && !Number.isNaN(date.getTime());
                return <li key={session.id}><time dateTime={validDate ? date.toISOString() : undefined}>{validDate ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" }) : "Date unavailable"}</time><h3>{session.problemTitle}</h3><p>{[session.difficulty, session.status].filter(Boolean).join(" / ")}</p></li>;
              })}</ul> : <div className={["dashboard-sessions-empty", dashboardStyles["dashboard-sessions-empty"]].join(" ")}><p>Your first session starts here.</p><span>Your recent interviews will appear here.</span><Link to="/interview">Start an interview <span aria-hidden="true">&#8599;</span></Link></div>}
            </section>
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
