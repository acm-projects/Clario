import NavbarDashboard from "../components/NavbarDashboard";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import type { ProfileContext } from "../lib/profile";
import { loadProblems, type ProblemSummary } from "../lib/problems";
import { selectMockProblem } from "../lib/interviewSelection";

export default function InterviewSelection() {
  const { profile } = useOutletContext<ProfileContext>();
  const navigate = useNavigate();
  const { state } = useLocation();
  const selectedSlug = typeof state?.selectedProblemSlug === "string" ? state.selectedProblemSlug : null;
  const [language, setLanguage] = useState(() => state?.language === "Java" || state?.language === "Python" ? state.language as string : profile.preferred_language === "Java" ? "Java" : "Python");
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const launchRef = useRef(false);
  const [starting, setStarting] = useState<"practice" | "mock" | null>(null);
  const recommended = problems.find((problem) => problem.difficulty.toLowerCase() === profile.starting_difficulty?.toLowerCase()) ?? null;
  const chosen = selectedSlug ? problems.find((problem) => problem.slug === selectedSlug) ?? null : recommended;
  const mockAvailable = problems.some((problem) => problem.difficulty.toLowerCase() === profile.starting_difficulty?.toLowerCase());

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setLoadError(null);
      try {
        const data = await loadProblems(controller.signal);
        if (!controller.signal.aborted) setProblems(data);
      } catch {
        if (!controller.signal.aborted) setLoadError("We couldn't load the problem library. Try again in a moment.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [retry]);

  function startInterview(mode: "practice" | "mock") {
    if (launchRef.current || loading || loadError) return;
    launchRef.current = true;
    setStarting(mode); setLaunchError(null);
    try {
      const problem = mode === "mock" ? selectMockProblem(problems, profile.starting_difficulty) : chosen;
      if (!problem) {
        setLaunchError(mode === "mock" ? "No mock interview problem is available at your saved level yet." : "Choose an available problem from the library to begin.");
        return;
      }
      // Pass mode for the future room implementation without changing room behavior.
      navigate(`/interview/${encodeURIComponent(problem.slug)}`, { state: { language, mode } });
    } finally {
      launchRef.current = false;
      setStarting(null);
    }
  }

  return <main className="app-sidebar-layout interview-path-page min-h-svh px-4 pb-10 pt-2 font-sans text-[#191d20] sm:px-6">
    <NavbarDashboard />
    <section className="path-shell" aria-labelledby="path-title">
      <header className="workspace-page-heading"><p className="workspace-eyebrow">ONE CONVERSATION CLOSER</p><h1 id="path-title">Choose your path.</h1><p>A little room to learn. Or a chance to prove you're ready.</p></header>
      <div className="path-language"><span>Your coding language</span><fieldset disabled={starting !== null}><legend className="sr-only">Coding language</legend>{["Python", "Java"].map((value) => <label key={value} className={language === value ? "path-language-selected" : ""}><input type="radio" name="language" value={value} checked={language === value} onChange={() => setLanguage(value)} />{value}</label>)}</fieldset></div>
      {loadError && <div className="path-error" role="alert"><p>{loadError}</p><button type="button" onClick={() => setRetry((value) => value + 1)}>Try again</button></div>}
      {launchError && <p className="path-error" role="alert">{launchError}</p>}
      <div className="interview-path-grid">
        <article className="interview-path-card practice-path" aria-labelledby="practice-title">
          <div className="path-card-top"><span className="workspace-eyebrow">01 / FIND YOUR FLOW</span><span className="path-mode-label">At your pace</span></div>
          <div className="path-illustration practice-illustration" aria-hidden="true"><span>&lt;/&gt;</span><div className="path-waveform">{[12, 25, 18, 38, 28, 46, 22, 34, 16].map((height, index) => <i key={index} style={{ height, animationDelay: `${index * -140}ms` }} />)}</div></div>
          <h2 id="practice-title">Practice interview</h2><p className="path-description">Work through a problem, talk through your thinking, and make space to learn.</p>
          <div className="path-problem"><p className="workspace-eyebrow">{selectedSlug ? "YOUR CHOSEN PROBLEM" : "NEXT RECOMMENDED PROBLEM"}</p>{loading ? <p role="status">Finding your next challenge...</p> : loadError ? <p>Your problem will appear when the library is available.</p> : chosen ? <><h3>{chosen.title}</h3><div className="path-problem-tags"><span>{chosen.difficulty}</span>{chosen.topics.slice(0, 2).map((topic) => <span key={topic}>{topic}</span>)}</div></> : <p>{selectedSlug ? "This problem is no longer available. Choose another from the library." : "Choose a problem from the library to get started."}</p>}</div>
          <Link className="path-library-link" to={`/problems?choose=practice&language=${encodeURIComponent(language)}`}>Choose a different problem <span aria-hidden="true">&#8599;</span></Link>
          <button className="path-start" type="button" disabled={loading || !!loadError || !chosen || starting !== null} onClick={() => startInterview("practice")}>{starting === "practice" ? "Preparing..." : "Start practice"}<span aria-hidden="true">&#8599;</span></button>
        </article>
        <article className="interview-path-card mock-path" aria-labelledby="mock-title">
          <div className="path-card-top"><span className="workspace-eyebrow">02 / MEET THE MOMENT</span><span className="path-mode-label">The real test</span></div>
          <div className="path-illustration mock-illustration" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="12" y="21" width="24" height="20" rx="5" /><path d="M17 21v-7a7 7 0 0 1 14 0v7M24 29v5" strokeLinecap="round" /></svg><span className="mock-orbit" /></div>
          <h2 id="mock-title">Mock interview</h2><p className="path-description">Step into an interview with a surprise problem at your current level. Trust your preparation.</p>
          <div className="path-problem"><p className="workspace-eyebrow">YOUR CURRENT LEVEL</p><h3>{profile.starting_difficulty || "Not set"}</h3><p>A problem is randomly assigned when you begin.</p></div>
          <ul className="mock-rules"><li>No hints</li><li>No coaching</li><li>No problem selection</li></ul>
          {!loading && !loadError && !mockAvailable && <p className="path-unavailable">{profile.starting_difficulty ? "No problems are available at this level yet." : "Complete your assessment in Settings to set your level."}</p>}
          <button className="path-start" type="button" disabled={loading || !!loadError || !mockAvailable || starting !== null} onClick={() => startInterview("mock")}>{starting === "mock" ? "Preparing..." : "Start mock interview"}<span aria-hidden="true">&#8599;</span></button>
        </article>
      </div>
      <p className="path-footnote">Your starting level comes from your assessment. <Link to="/settings">Update it in Settings &#8599;</Link></p>
    </section>
  </main>;
}