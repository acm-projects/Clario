import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import PageClouds from "../components/effects/PageClouds";
import PageHeading from "../components/ui/PageHeading";
import ProblemLoading from "../components/ui/ProblemLoading";
import { getMyAssessment, getRecommendations } from "../lib/assessmentApi";
import { isMissingAssessment, type Recommendations } from "../lib/assessmentContract";
import { createModeSession } from "../lib/api";
import { interviewRoomUrl } from "../lib/interviewModes";
import type { ProfileContext } from "../lib/profile";
import type { Language } from "../types";

// Match the existing Problem Library badge palette.
const difficultyColors = { Easy: "bg-[#e3f0e6] text-[#24623f]", Medium: "bg-[#fff1cb] text-[#78540c]", Hard: "bg-[#fbe9eb] text-[#a72d39]" };

export default function Recommended() {
  const { user } = useOutletContext<ProfileContext>();
  const navigate = useNavigate();
  const [retry, setRetry] = useState(0);
  const key = `${user.id}:${retry}`;
  const [loaded, setLoaded] = useState<{ key: string; data?: Recommendations; language?: Language; error?: string } | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const startingRef = useRef(false);
  const [startError, setStartError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await getRecommendations(controller.signal);
        let language: Language | undefined;
        if (data.has_assessment) {
          try { language = (await getMyAssessment(controller.signal)).answers.language; }
          catch (error) { if (isMissingAssessment(error)) { data.has_assessment = false; } else throw error; }
        }
        if (!controller.signal.aborted) setLoaded({ key, data, language });
      } catch (error) {
        if (!controller.signal.aborted) setLoaded({ key, error: error instanceof Error ? error.message : "Could not load your recommendations." });
      }
    }
    void load();
    return () => controller.abort();
  }, [key]);

  async function start(slug: string) {
    if (startingRef.current || loaded?.key !== key || !loaded.language) return;
    startingRef.current = true; setStarting(slug); setStartError("");
    try {
      const session = await createModeSession({ mode: "recommended", problemSlug: slug, language: loaded.language });
      navigate(interviewRoomUrl(slug, session.id, "recommended"));
    } catch (error) { setStartError(error instanceof Error ? error.message : "Could not start your interview. Please try again."); }
    finally { startingRef.current = false; setStarting(null); }
  }

  const loading = loaded?.key !== key;
  const data = loading ? undefined : loaded.data;
  return <main className="app-sidebar-layout relative isolate min-h-svh bg-[var(--page-background)] px-4 pb-12 pt-2 font-sans text-[#182137] sm:px-6 lg:pl-[calc(var(--sidebar-width)+48px)] lg:pr-8 lg:pt-6 [--sidebar-width:224px] has-[.sidebar-collapsed]:[--sidebar-width:80px]">
    <PageClouds /><NavbarDashboard />
    <section className="relative mx-auto max-w-[1440px] py-10">
      <PageHeading eyebrow="YOUR NEXT CHALLENGE" title="Recommended for you" subtitle="Practice problems picked from your assessment and completed interviews." />
      <Link to="/interview" className="mt-5 inline-block text-sm text-[#3054ed] underline">Back to interview selection</Link>
      <div className="mt-8" aria-busy={loading}>
        {loading ? <ProblemLoading /> : loaded.error ? <div role="alert" className="rounded-2xl bg-[#fffdf8] p-8"><p>{loaded.error}</p><button className="mt-4 text-[#3054ed] underline" onClick={() => setRetry(value => value + 1)}>Try again</button></div> : !data?.has_assessment ? <div className="rounded-2xl bg-[#fffdf8] p-8"><h2 className="text-xl font-semibold">Take the assessment for better picks.</h2><Link to="/assessment" className="mt-5 inline-block rounded-lg bg-[#3054ed] px-5 py-3 text-sm font-semibold text-white">Take the Assessment</Link></div> : data.problems.length === 0 ? <div role="status" className="rounded-2xl bg-[#fffdf8] p-8"><h2 className="text-xl font-semibold">You’re all caught up.</h2><p className="mt-3">No recommended problems are available right now. Explore the library for your next challenge.</p><Link to="/problems" className="mt-5 inline-block text-[#3054ed] underline">Browse problems</Link></div> : <>
          {startError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{startError}</p>}
          <ul className="grid list-none gap-4 p-0">{data.problems.map(problem => <li key={problem.slug} className="rounded-2xl border border-[#e7e5e0] bg-[#fffdf8] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-medium"><button className="text-left hover:text-[#3054ed] disabled:opacity-60" disabled={starting !== null} onClick={() => void start(problem.slug)}>{problem.title}</button></h2><span className={`library-difficulty-${problem.difficulty.toLowerCase()} rounded-full px-3 py-1.5 text-[14px] ${difficultyColors[problem.difficulty]}`}>{problem.difficulty}</span></div>
            <div className="mt-4 flex flex-wrap gap-2">{problem.topics.map(topic => <span key={topic} className="library-topic-tag rounded-md bg-cream-gradient px-2 py-1 text-[14px] text-[#68778e]">{topic}</span>)}</div>
            <p className="mt-4 text-sm leading-6 text-[#687087]">{problem.reason}</p>
            <button className="mt-5 min-h-10 rounded-lg bg-[#3054ed] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={starting !== null} onClick={() => void start(problem.slug)}>{starting === problem.slug ? "Starting..." : "Start interview"}</button>
          </li>)}</ul>
        </>}
      </div>
    </section>
  </main>;
}
