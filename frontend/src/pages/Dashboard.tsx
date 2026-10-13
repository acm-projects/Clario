import "./Dashboard.css";
import WaterWaves from "../components/WaterWaves";
import LightRays from "../components/LightRays";
import MagicBento from "../components/MagicBento";
import InterviewCalendar from "../components/InterviewCalendar";
import NavbarDashboard from "../components/NavbarDashboard";
import TextType from "../components/TextType";
import { useEffect, useState, type CSSProperties } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { sampleFeedback } from "../data/sampleData";
import type { ProfileContext } from "../lib/profile";
import { getGreetingCopy, loadRecommendedProblem, loadSessionSummary, loadSkillScores, type SkillScore, type DashboardProblem, type SessionSummary } from "../lib/dashboard";

type LoadState<T> = { loading: boolean; data: T | null; error: string | null };
const initialLoad = { loading: true, data: null, error: null };

export default function Dashboard() {
  const { profile } = useOutletContext<ProfileContext>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<LoadState<DashboardProblem>>(initialLoad);
  const [sessions, setSessions] = useState<LoadState<SessionSummary>>(initialLoad);
  const [skills, setSkills] = useState<LoadState<SkillScore[]>>(initialLoad);
  const [problemRetry, setProblemRetry] = useState(0);
  const [sessionRetry, setSessionRetry] = useState(0);
  const [showSampleSkills, setShowSampleSkills] = useState(true);
  const sampleInterview = sampleFeedback.filter((interview) => interview.status === "Available" && Object.values(interview.scores).some((score) => score !== null)).sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0];
  const sampleScores: SkillScore[] = [
    { label: "Coding", score: sampleInterview?.scores.technical_score ?? null },
    { label: "Communication", score: sampleInterview?.scores.communication_score ?? null },
    { label: "Reasoning", score: sampleInterview?.scores.reasoning_score ?? null },
  ];
  const name = profile.display_name?.trim();
  const welcomeText = name ? `Welcome back, ${name}.` : "Welcome back.";
  const language = profile.preferred_language;
  const level = profile.starting_difficulty;
  const supportedLanguage = language === "Python" || language === "Java";

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

  function startPractice() {
    if (!problem.data || !supportedLanguage) return;
    navigate(`/interview/${encodeURIComponent(problem.data.slug)}`, { state: { language, mode: "practice" } });
  }

  return <main className="app-sidebar-layout clario-dashboard water-dashboard min-h-svh px-4 pt-2 font-sans text-[#191d20] sm:px-6">
    <NavbarDashboard />
    <div className="studio-shell">
      <header className="studio-welcome">
        <div><p className="studio-eyebrow">YOUR PRACTICE ROOM</p><h1><TextType key={welcomeText} as="span" text={welcomeText} typingSpeed={75} initialDelay={200} loop={false} showCursor cursorCharacter="|" cursorBlinkDuration={0.6} startOnVisible /></h1><p className="studio-greeting">{getGreetingCopy(profile)}</p></div>
      </header>
    </div>
      <section className="water-practice" aria-label="Your practice dashboard">
        <WaterWaves className="water-transition" />
        <div className="water-light-rays" aria-hidden="true"><LightRays raysOrigin="top-center" raysColor="#c7eaff" raysSpeed={0.35} lightSpread={1.2} rayLength={1.8} followMouse mouseInfluence={0.035} noiseAmount={0} distortion={0.025} /></div>

        <div className="water-bubbles" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index} style={{ "--bubble-left": `${8 + index * 12}%`, "--bubble-delay": `${index * -3.8}s`, "--bubble-size": `${8 + (index % 3) * 9}px` } as CSSProperties} />)}</div>
        <img className="water-duck" src={import.meta.env.BASE_URL + "smartduck.png"} alt="Smart Clario duck" width="500" height="500" />
        <div className="studio-shell water-content">
        <MagicBento className="water-magic-bento" columns={3} rowHeight={200} gap={20} radius={18} theme="light" glowColor="#3b8fe8" spotlightRadius={280} enableBorderGlow enableSpotlight clickEffect enableTilt={false} enableMagnetism={false} enableStars={false} textAutoHide={false} items={[{ id: "launch", colSpan: 2, content: (<section id="start-interview" className="studio-launch" aria-labelledby="start-heading">
          <div className="studio-launch-copy"><p className="studio-eyebrow">READY WHEN YOU ARE</p><h2 id="start-heading">Start a New Interview</h2><p>Practice your reasoning, communication, and code with Clario.</p><button type="button" onClick={() => navigate("/interview")} className="studio-primary">Start interview <span aria-hidden="true">&#8599;</span></button><div className="studio-session-meta"><span>~30 minutes</span><span>Voice + code</span><span>Personal feedback</span></div></div>
          <div className="studio-audio" aria-hidden="true"><div className="studio-microphone"><MicrophoneIcon /></div><div className="studio-waveform">{Array.from({ length: 35 }, (_, i) => <i key={i} style={{ "--bar-height": (14 + Math.round(Math.sin(i * .75) ** 2 * 55) + Math.round(Math.sin(i * .24) ** 2 * 30)) + "px", "--bar-delay": (-i * .11) + "s" } as CSSProperties} />)}</div><span className="studio-audio-label"><i />Think out loud. Find your flow.</span></div>
        </section>) },
{ id: "recommendation", content: (<section id="next-practice" className="studio-recommendation" aria-labelledby="next-heading">
          <p className="studio-eyebrow">YOUR NEXT CHALLENGE</p><h2 id="next-heading">Next Recommended Problem</h2>
          {problem.loading ? <p role="status" className="studio-muted">Finding your next problem...</p> : problem.error ? <InlineError message={problem.error} onRetry={() => setProblemRetry((value) => value + 1)} /> : problem.data ? <>
            <div className="studio-problem-tags"><span>{problem.data.difficulty}</span>{problem.data.topic && <span>{problem.data.topic}</span>}</div><h3>{problem.data.title}</h3><p className="studio-muted">A focused challenge for your {level?.toLowerCase() || problem.data.difficulty.toLowerCase()} starting level{language ? " in " + language : ""}.</p><button type="button" onClick={startPractice} disabled={!supportedLanguage} className="studio-text-action">Start solving <span aria-hidden="true">&#8594;</span></button>
          </> : <div className="studio-recommendation-empty"><span className="studio-code-symbol" aria-hidden="true">&lt;/&gt;</span><h3>Your next challenge starts here.</h3><p className="studio-muted">Choose a problem from the library and practice at your own pace.</p><Link to="/problems" className="studio-text-action">Explore the library <span aria-hidden="true">&#8594;</span></Link></div>}
          {(!supportedLanguage || !level) && <Link to="/settings" className="studio-profile-link">Set your practice preferences</Link>}
        </section>) },
{ id: "skills", content: (<section id="skill-set" className="studio-skills" aria-labelledby="skill-heading"><div className="studio-panel-heading"><h3 id="skill-heading">Skill Set</h3><button type="button" aria-pressed={showSampleSkills} onClick={() => setShowSampleSkills((value) => !value)} className="min-h-9 text-xs text-[#2378db] underline underline-offset-4">{showSampleSkills ? "Show my data" : "Show sample data"}</button></div>
            {showSampleSkills ? <><p className="mt-2 text-xs text-[#657077]">Sample feedback · {sampleInterview?.topic}</p><SkillRadar scores={sampleScores} sample /></> : skills.loading ? <p role="status" className="studio-muted">Loading your feedback...</p> : skills.error ? <InlineError message={skills.error} onRetry={() => setSessionRetry((value) => value + 1)} /> : <SkillRadar scores={skills.data ?? []} />}
          </section>) },
{ id: "calendar", content: (<div className="studio-calendar"><InterviewCalendar completionDates={sessions.data?.completionDates ?? []} loading={sessions.loading} />{sessions.error && <InlineError message="Interview activity is unavailable." onRetry={() => setSessionRetry((value) => value + 1)} />}</div>) },
{ id: "history", content: (<section aria-labelledby="recent-heading"><div className="studio-panel-heading"><h3 id="recent-heading">Recent Sessions</h3></div>
            {sessions.loading ? <p role="status" className="studio-muted">Loading recent practice...</p> : sessions.error ? <InlineError message={sessions.error} onRetry={() => setSessionRetry((value) => value + 1)} /> : !sessions.data?.recent.length ? <div className="studio-history-empty"><span className="studio-timeline-dot" aria-hidden="true" /><h4>Your first session starts here.</h4><p className="studio-muted">Your sessions will appear here, ready to revisit and learn from.</p><Link to="/interview" className="studio-text-action">Start a session <span aria-hidden="true">&#8594;</span></Link></div> : <ul className="studio-timeline">{sessions.data.recent.map((session) => <li key={session.id}><time dateTime={session.endedAt || session.startedAt || undefined}>{session.endedAt || session.startedAt ? new Date(session.endedAt || session.startedAt!).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" }) : "Date unavailable"}</time><h4>{session.problemTitle}</h4><p>{[session.difficulty, session.status].filter(Boolean).join(" / ")}</p></li>)}</ul>}
          </section>) },
{ id: "profile", content: (<section className="studio-profile" aria-labelledby="profile-heading"><div className="studio-panel-heading"><h3 id="profile-heading">Practice Profile</h3><Link to="/settings" aria-label="Edit practice profile">Edit &#8599;</Link></div><dl><div><dt>Language</dt><dd>{language || "Not set"}</dd></div><div><dt>Difficulty</dt><dd>{level || "Not set"}</dd></div></dl></section>) },
]} />
        </div>
      </section>
  </main>;
}

// A previous profile can be supplied later without inventing historical scores.
function SkillRadar({ scores, previousScores, sample = false }: { scores: SkillScore[]; previousScores?: SkillScore[]; sample?: boolean }) {
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
      <p className="text-sm font-medium text-[#454b50]">{sample ? "Sample interview profile" : hasData ? "Your interview profile" : "Your skill profile will take shape here."}</p>
      <p className="mt-2 text-xs leading-6 text-[#777a7c]">{sample ? "Scores from the latest scored interview in the sample feedback report." : hasData ? complete ? "Built from your latest interview feedback, one conversation at a time." : "Some skills are still awaiting feedback. Missing scores stay unplotted." : "Complete your first interview to unlock your baseline."}</p>
      {previous?.every((score) => score !== null) && <p className="mt-2 text-[10px] text-[#777a7c]">Blue: current Â· Dotted: previous</p>}
    </figcaption>
  </figure>;
}

function MicrophoneIcon() {
  return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 10v2a6 6 0 0 0 12 0v-2M12 18v3M9 21h6" /></svg>;
}
function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="mt-6"><p role="alert" className="text-sm leading-6 text-[#55595c]">{message}</p><button type="button" onClick={onRetry} className="mt-3 text-xs font-semibold underline underline-offset-4">Retry</button></div>;
}
















