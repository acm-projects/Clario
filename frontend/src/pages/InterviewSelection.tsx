import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import type { ProblemSummary } from "../lib/problems";

type SelectedProblem = Pick<ProblemSummary, "slug" | "title" | "difficulty">;

export default function InterviewSelection() {
  const location = useLocation();
  const candidate = (location.state as { selectedProblem?: SelectedProblem } | null)?.selectedProblem;
  const selectedProblem = candidate && typeof candidate.slug === "string" && typeof candidate.title === "string" && ["Easy", "Medium", "Hard"].includes(candidate.difficulty) ? candidate : null;
  const [confirmed, setConfirmed] = useState(false);
  const card = "flex min-h-[440px] flex-col border border-[#dce5ed] bg-[#fffdf8] p-6 shadow-[0_10px_32px_-24px_#12354c40] sm:p-8";

  return <main className="app-sidebar-layout min-h-svh bg-[#f7f1d8] px-4 pt-2 font-sans text-[#191d20] sm:px-6 lg:pl-[calc(var(--sidebar-width)+48px)] lg:pr-8 lg:pt-6 [--sidebar-width:224px] has-[.sidebar-collapsed]:[--sidebar-width:80px] [&_:is(a,button):focus-visible]:outline-2 [&_:is(a,button):focus-visible]:outline-offset-4 [&_:is(a,button):focus-visible]:outline-[#2378db]">
    <NavbarDashboard />
    <section className="mx-auto max-w-[1040px] py-10 lg:py-14" aria-labelledby="mode-heading">
      <header className="mb-8">
        <p className="text-[10px] font-semibold tracking-[0.13em] text-[#2565b4]">YOUR NEXT CONVERSATION</p>
        <h1 id="mode-heading" className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Choose your interview.</h1>
        <p className="mt-4 text-sm leading-7 text-[#657077]">A little room to learn. Or a chance to put your skills to the test.</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <article className={card} aria-labelledby="practice-heading">
          <h2 id="practice-heading" className="text-center text-xl font-semibold tracking-tight">Practice Interview</h2>
          <div className="mt-8">
            <p className="text-sm leading-7 text-[#657077]">Choose a problem and work through your approach at your own pace. Take time to explain your reasoning and build confidence.</p>
            <div className="mt-6 rounded-xl border border-[#dce5ed] bg-[#eef5ff] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#2565b4]">Your practice problem</p>
              {selectedProblem ? <><h3 className="mt-3 text-lg font-semibold">{selectedProblem.title}</h3><p className="mt-2 text-xs text-[#657077]">{selectedProblem.difficulty}</p></> : <p className="mt-3 text-sm leading-6 text-[#657077]">Pick a problem from the library to get started.</p>}
              <Link to="/problems?choose=practice" className="mt-4 inline-flex min-h-10 items-center gap-4 text-sm font-semibold text-[#2378db] hover:underline hover:underline-offset-4">{selectedProblem ? "Change problem" : "Choose from problem library"}<span aria-hidden="true">&#8599;</span></Link>
            </div>
          </div>
          <button type="button" disabled={!selectedProblem} onClick={() => setConfirmed(true)} className="mt-8 flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-lg bg-[#2378db] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1969c5] disabled:cursor-not-allowed disabled:opacity-40">Continue <span aria-hidden="true">&#8594;</span></button>
          {confirmed && selectedProblem && <p role="status" className="mt-4 text-sm text-[#2565b4]">Selected for practice: {selectedProblem.title}.</p>}
        </article>
        <article className={card} aria-labelledby="mock-heading">
          <h2 id="mock-heading" className="text-center text-xl font-semibold tracking-tight">Mock Interview</h2>
          <p className="mt-8 text-sm leading-7 text-[#657077]">Put yourself in a real interview setting. Work through a problem chosen for your level, explain your thinking, and practice solving it independently without hints or coaching.</p>
        </article>
      </div>
    </section>
  </main>;
}
