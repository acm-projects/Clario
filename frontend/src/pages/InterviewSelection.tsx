import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import { loadProblems, type ProblemSummary } from "../lib/problems";
import type { ProfileContext } from "../lib/profile";
import { interviewModes, isInterviewMode, type InterviewMode } from "../lib/interviewModes";

type SelectedProblem = Pick<ProblemSummary, "slug" | "title"> & { difficulty?: ProblemSummary["difficulty"] };

type SelectionState = { mode?: InterviewMode; selectedProblem?: SelectedProblem; modeProblems?: Partial<Record<InterviewMode, SelectedProblem>> };
function validProblem(value: unknown): value is SelectedProblem {
  if (!value || typeof value !== "object") return false;
  const problem = value as SelectedProblem;
  return typeof problem.slug === "string" && !!problem.slug.trim() && typeof problem.title === "string" && (problem.difficulty === undefined || ["Easy", "Medium", "Hard"].includes(problem.difficulty));
}

export default function InterviewSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { profile } = useOutletContext<ProfileContext>();
  const state = location.state as SelectionState | null;
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    loadProblems(controller.signal).then(data => { if (!controller.signal.aborted) setProblems(data); })
      .catch(() => { if (!controller.signal.aborted) setError("We couldn't load automatic problem selections. You can retry or use a selected problem."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);
  const selections: Partial<Record<InterviewMode, SelectedProblem>> = {};
  for (const mode of interviewModes) {
    const candidate = state?.modeProblems?.[mode.id];
    if (validProblem(candidate)) selections[mode.id] = candidate;
    // External selection pages can pass a slug for each mode in the URL.
    const slug = params.get(mode.id);
    if (slug) selections[mode.id] = problems.find(problem => problem.slug === slug) ?? { slug, title: slug.replaceAll("-", " ") };
  }
  const selectedMode = isInterviewMode(state?.mode) ? state.mode : isInterviewMode(params.get("mode")) ? params.get("mode") as InterviewMode : "custom";
  const incomingSlug = params.get("problem");
  if (incomingSlug) selections[selectedMode] = problems.find(problem => problem.slug === incomingSlug) ?? { slug: incomingSlug, title: incomingSlug.replaceAll("-", " ") };
  if (validProblem(state?.selectedProblem)) selections[selectedMode] = state.selectedProblem;
  const used = new Set(Object.values(selections).map(problem => problem.slug));
  if (!selections.recommended) {
    const recommended = problems.find(problem => !used.has(problem.slug) && problem.difficulty.toLowerCase() === profile.starting_difficulty?.toLowerCase());
    if (recommended) { selections.recommended = recommended; used.add(recommended.slug); }
  }
  // Stable for this loaded list; starting the interview never re-rolls the choice.
  if (!selections["surprise-me"]) {
    const candidates = problems.filter(problem => !used.has(problem.slug));
    if (candidates.length) selections["surprise-me"] = candidates[surpriseIndex(location.key, candidates.length)];
  }
  return <main className="app-sidebar-layout min-h-svh bg-[#f7f1d8] px-4 pt-2 font-sans text-[#191d20] sm:px-6 lg:pl-[calc(var(--sidebar-width)+48px)] lg:pr-8 lg:pt-6 [--sidebar-width:224px] has-[.sidebar-collapsed]:[--sidebar-width:80px] [&_:is(a,button):focus-visible]:outline-2 [&_:is(a,button):focus-visible]:outline-offset-4 [&_:is(a,button):focus-visible]:outline-[#2378db]">
    <NavbarDashboard />
    <section className="mx-auto max-w-[1040px] py-10 lg:py-14" aria-labelledby="mode-heading">
      <header className="mb-8"><p className="text-[10px] font-semibold tracking-[0.13em] text-[#2565b4]">YOUR NEXT CONVERSATION</p><h1 id="mode-heading" className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Choose your interview.</h1><p className="mt-4 text-sm leading-7 text-[#657077]">Four ways to choose a challenge. One interview workspace.</p></header>
      {error && <div role="alert" className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">{error}<button onClick={() => setRetry(value => value + 1)} className="ml-3 cursor-pointer underline">Retry</button></div>}
      <div className="grid gap-6 md:grid-cols-2">{interviewModes.map(mode => {
        const problem = selections[mode.id];
        return <article key={mode.id} className="flex flex-col rounded-2xl border border-[#dce5ed] bg-[#fffdf8] p-6 shadow-[0_10px_32px_-24px_#12354c40] sm:p-8" aria-labelledby={`${mode.id}-heading`}>
          <h2 id={`${mode.id}-heading`} className="text-xl font-semibold tracking-tight">{mode.title}</h2><p className="mt-4 text-sm leading-7 text-[#657077]">{mode.description}</p>
          <div className="my-6 flex-1 rounded-xl border border-[#dce5ed] bg-[#eef5ff] p-5">{problem ? <><p className="text-xs text-[#2565b4]">Selected problem</p><h3 className="mt-2 text-lg font-semibold">{problem.title}</h3></> : <p className="text-sm leading-6 text-[#657077]">{loading && (mode.id === "surprise-me" || mode.id === "recommended") ? "Finding your problem..." : mode.id === "company-specific" ? "Choose your company and problem in the selection flow, then return here to start." : mode.id === "custom" ? "Choose a problem from the library to get started." : "No problem is available for this mode yet."}</p>}
          {mode.id === "custom" && <Link to="/problems?choose=custom" state={{ modeProblems: selections }} className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-[#2378db] underline underline-offset-4">{problem ? "Change problem" : "Choose from problem library"}</Link>}</div>
          <button type="button" disabled={!problem} onClick={() => { if (problem) navigate(`/interview/${encodeURIComponent(problem.slug)}?mode=${mode.id}`); }} className="flex min-h-12 cursor-pointer items-center justify-between rounded-lg bg-[#2378db] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1969c5] disabled:cursor-not-allowed disabled:opacity-40">Start {mode.title.toLowerCase()}<span aria-hidden="true">?</span></button>
        </article>;
      })}</div>
    </section>
  </main>;
}
function surpriseIndex(seed: string, length: number) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % length;
}
