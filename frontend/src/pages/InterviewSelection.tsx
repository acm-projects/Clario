import TextType from "../components/effects/TextType";
import DecryptedText from "../components/effects/DecryptedText";
import WaterWaves from "../components/effects/WaterWaves";
import "./interview-selection.css";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import { loadRecommendedProblem, type DashboardProblem } from "../lib/dashboard";
import type { ProblemSummary } from "../lib/problems";
import { fakeProblem } from "../types";
import type { ProfileContext } from "../lib/profile";

type SelectedProblem = Pick<ProblemSummary, "slug" | "title" | "difficulty">;
type InterviewMode = "practice" | "mock";

export default function InterviewSelection() {
  const { profile } = useOutletContext<ProfileContext>();
  const location = useLocation();
  const navigate = useNavigate();
  const candidate = (location.state as { selectedProblem?: SelectedProblem } | null)?.selectedProblem;
  const selectedProblem = candidate && typeof candidate.slug === "string" && candidate.slug.trim() && typeof candidate.title === "string" && ["Easy", "Medium", "Hard"].includes(candidate.difficulty) ? candidate : null;
  const pageRef = useRef<HTMLElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const practiceRef = useRef<HTMLElement>(null);
  const mockRef = useRef<HTMLElement>(null);
  const [beam, setBeam] = useState("");
  const [sunshine, setSunshine] = useState(0);
  const [mode, setMode] = useState<InterviewMode>("practice");
  const [recommendation, setRecommendation] = useState<DashboardProblem | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendationError, setRecommendationError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [starting, setStarting] = useState<InterviewMode | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const startingRef = useRef(false);
  const practiceProblem = selectedProblem || recommendation;

  useEffect(() => {
    let active = true;
    async function load() {
    setLoading(true);
    setRecommendationError(false);
    setRecommendation(null);
    await loadRecommendedProblem(profile.starting_difficulty).then(data => {
      if (active) setRecommendation(data);
    }).catch(() => {
      if (active) setRecommendationError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    }
    void load();
    return () => { active = false; };
  }, [profile.starting_difficulty, retry]);

  useEffect(() => {
    const page = pageRef.current;
    const sun = sunRef.current;
    const card = mode === "practice" ? practiceRef.current : mockRef.current;
    if (!page || !sun || !card) return;
    function measure() {
      if (!page || !sun || !card) return;
      const bounds = page.getBoundingClientRect();
      const origin = sun.getBoundingClientRect();
      const target = card.getBoundingClientRect();
      const x = origin.left + origin.width / 2 - bounds.left;
      const y = origin.top + origin.height / 2 - bounds.top;
      const left = target.left - bounds.left;
      const right = target.right - bounds.left;
      const top = target.top - bounds.top;
      setBeam([x - 12, y, x + 12, y + 12, right, top + 40, left, top + 40].join(" "));
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(page);
    observer.observe(card);
    observer.observe(sun);
    return () => observer.disconnect();
  }, [mode]);

  function select(next: InterviewMode) {
    setMode(next);
    setSunshine(value => value + 1);
    setStartError(null);
  }

  function startInterview(next: InterviewMode) {
    if (startingRef.current) return;
    select(next);
    startingRef.current = true;
    setStarting(next);
    try {
      // Temporary direct route uses the room's existing bundled sample.
      navigate("/interview/" + encodeURIComponent(fakeProblem.slug) + "?mode=" + next);
    } catch (error) {
      setStartError(error instanceof Error ? error.message : "We couldn't start your interview. Please try again.");
    } finally {
      startingRef.current = false;
      setStarting(null);
    }
  }

  return <main ref={pageRef} className="interview-selection-page app-sidebar-layout flex min-h-svh flex-col bg-[#F7F1E4] px-4 pt-2 font-sans text-[#191d20] sm:px-6 lg:pl-[calc(var(--sidebar-width)+48px)] lg:pr-8 lg:pt-6 [--sidebar-width:224px] has-[.sidebar-collapsed]:[--sidebar-width:80px] [&_:is(a,button):focus-visible]:outline-2 [&_:is(a,button):focus-visible]:outline-offset-4 [&_:is(a,button):focus-visible]:outline-[#2378db]">
    <NavbarDashboard />
    {sunshine > 0 && beam && <svg className="interview-sunbeam" aria-hidden="true" focusable="false"><polygon key={sunshine} points={beam} /></svg>}
    <div ref={sunRef} className="interview-sun" aria-hidden="true">
      <div key={sunshine} className="interview-sun-art" data-shining={sunshine > 0}>
        <svg viewBox="0 0 200 200" fill="none" focusable="false">
          <g className="interview-sun-rays" stroke="#E8B34E" strokeWidth="3" strokeLinecap="round">
            {Array.from({ length: 12 }, (_, index) => <path key={index} d="M100 24V36" transform={"rotate(" + index * 30 + " 100 100)"} />)}
          </g>
          <circle className="interview-sun-halo" cx="100" cy="100" r="57" fill="#F7D783" fillOpacity=".22" />
          <circle cx="100" cy="100" r="43" fill="#F5CB68" />
          <path d="M76 88C79 77 87 70 98 68" stroke="#FFE9AD" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
    <section className="interview-path-shell mx-auto w-full max-w-[1120px] flex-1 py-10 lg:py-14" aria-labelledby="mode-heading">
      <header className="interview-path-heading mb-10"><h1 id="mode-heading" className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl"><TextType as="span" text="Choose your path" typingSpeed={65} initialDelay={150} loop={false} showCursor cursorBlinkDuration={0.6} /></h1><p className="mt-4 text-base leading-7 text-[#657077]">Practice with guidance or try a realistic mock interview.</p></header>
      <div className="interview-path-options" role="group" aria-label="Interview paths">
        <article ref={practiceRef} className="interview-path-card" data-selected={mode === "practice"} aria-labelledby="practice-heading" onClick={() => select("practice")}>
          <button type="button" className="interview-path-selector" aria-pressed={mode === "practice"} onClick={event => { event.stopPropagation(); select("practice"); }}><span className="interview-path-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 6a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0ZM5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8" /></svg></span><span className="interview-path-check" aria-hidden="true">{mode === "practice" ? "✓" : ""}</span><h2 id="practice-heading"><DecryptedText text="Practice Interview" animateOn="inViewHover" speed={35} sequential revealDirection="start" characters="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" encryptedClassName="interview-encrypted-letter" /></h2></button>
          <p className="interview-path-description">Practice with your AI coach in a flexible, more forgiving setting.</p>
          <ul className="interview-path-benefits"><li>Guidance when you need it</li><li>Work at your own pace</li></ul>
          <div className="interview-practice-problem"><p className="text-[10px] font-semibold uppercase tracking-widest text-[#2565b4]">{selectedProblem ? "Your chosen problem" : "Next recommended problem"}</p>{practiceProblem ? <><h3 className="mt-3 text-lg font-semibold">{practiceProblem.title}</h3><span className="mt-2 inline-block rounded-full bg-white/60 px-3 py-1 text-xs text-[#2565b4]">{practiceProblem.difficulty}</span></> : loading ? <p role="status" className="mt-3 text-sm text-[#456075]">Finding your next problem...</p> : recommendationError ? <div className="mt-3 text-sm text-[#456075]"><p role="alert">Couldn't load your recommendation.</p><button type="button" className="mt-2 font-semibold underline" onClick={() => setRetry(value => value + 1)}>Retry</button></div> : <p className="mt-3 text-sm text-[#456075]">Pick a problem to get started.</p>}<Link to="/problems?choose=practice" className="mt-4 inline-flex min-h-10 items-center gap-3 text-sm font-semibold text-[#2378db]">Choose from the problem library <span aria-hidden="true">&#8599;</span></Link></div>
          <button type="button" disabled={starting !== null} onClick={() => void startInterview("practice")} className="interview-path-start">{starting === "practice" ? "Starting..." : "Start interview"}<span aria-hidden="true">&#8594;</span></button>
        </article>
        <article ref={mockRef} className="interview-path-card" data-selected={mode === "mock"} aria-labelledby="mock-heading" onClick={() => select("mock")}>
          <button type="button" className="interview-path-selector" aria-pressed={mode === "mock"} onClick={event => { event.stopPropagation(); select("mock"); }}><span className="interview-path-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="7" width="18" height="14" rx="3" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a22 22 0 0 0 18 0M12 11v4" /></svg></span><span className="interview-path-check" aria-hidden="true">{mode === "mock" ? "✓" : ""}</span><h2 id="mock-heading"><DecryptedText text="Mock Interview" animateOn="inViewHover" speed={35} delay={150} sequential revealDirection="start" characters="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" encryptedClassName="interview-encrypted-letter" /></h2></button>
          <p className="interview-path-description">Step into a real interview setting and show what you can do.</p>
          <ul className="interview-path-benefits"><li>Approximately 30 minutes</li><li>No hints or coaching</li><li>A surprise problem</li></ul>
          <button type="button" disabled={starting !== null} onClick={() => void startInterview("mock")} className="interview-path-start">{starting === "mock" ? "Starting..." : "Start interview"}<span aria-hidden="true">&#8594;</span></button>
        </article>
      </div>
      {startError && <p role="alert" className="mt-6 rounded-2xl border border-[#bcd5f4] bg-white/70 p-4 text-sm text-[#456075]">{startError}</p>}
    </section>
    <WaterWaves className="interview-footer-waves" />
  </main>;
}
