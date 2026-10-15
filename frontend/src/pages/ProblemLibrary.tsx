import FooterWaves from "../components/effects/FooterWaves";
import "./problem-library.css";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { loadProblems, type ProblemSummary } from "../lib/problems";

type DifficultyFilter = "All" | "Easy" | "Medium" | "Hard";
const filters: DifficultyFilter[] = ["All", "Easy", "Medium", "Hard"];
const badges = { Easy: "bg-[#e6f0e8] text-[#3a6d48]", Medium: "bg-[#fff0cf] text-[#8a6115]", Hard: "bg-[#fce6e6] text-[#a33b3b]" };
const difficultyOrder = { Easy: 0, Medium: 1, Hard: 2 };

export default function ProblemLibrary() {
  const [searchParams] = useSearchParams();
  const choosing = searchParams.get("choose") === "practice";
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("All");
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("All");
  const [sort, setSort] = useState("difficulty");
  const [allProblems, setAllProblems] = useState<ProblemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const source = allProblems;
  const topics = Array.from(new Set(source.flatMap((problem) => problem.topics))).sort();
  const problems = source.filter((problem) =>
    (difficulty === "All" || problem.difficulty === difficulty) &&
    (topic === "All" || problem.topics.includes(topic)) &&
    [problem.title, problem.leetcode_id, ...problem.topics].join(" ").toLowerCase().includes(query.trim().toLowerCase())
  ).sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty] || a.title.localeCompare(b.title));
  function resetFilters() { setDifficulty("All"); setTopic("All"); setQuery(""); }

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError(null);
      try {
        const data = await loadProblems(controller.signal);
        if (!controller.signal.aborted) setAllProblems(data);
      } catch {
        if (!controller.signal.aborted) setError("We couldn't load the problem library. Please check that the backend is running and try again.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [retry]);

  return <main className={"app-sidebar-layout [--sidebar-width:224px] [&:has(.sidebar-collapsed)]:[--sidebar-width:80px] [@media_(min-width:_1024px)]:[padding-left:calc(var(--sidebar-width)_+_48px)] [@media_(min-width:_1024px)]:[padding-right:24px] [@media_(min-width:_1024px)]:[padding-top:24px] library-page flex flex-col [background:#F7F1E4] [&_h1]:[font-size:clamp(32px,_3.5vw,_48px)] [&_h1]:[letter-spacing:-.045em] min-h-svh px-4 pt-2 font-sans text-[#191d20] sm:px-6 lg:px-[5%] [&_button]:cursor-pointer [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4"}>
    <div className="library-content flex flex-1 flex-col">
    <NavbarDashboard />
    <section aria-labelledby="library-heading" className="mx-auto w-full max-w-[1120px] flex-1 py-10 sm:py-14">
      <p className={"workspace-eyebrow [font-size:10px] font-semibold [letter-spacing:.13em] [color:#2565b4]"}>PRACTICE AT YOUR PACE</p>
      <h1 id="library-heading" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Problem Library</h1>
      <p className="mt-3 text-sm leading-7 text-[#55595c]">Find your next challenge. Build a solution and practice explaining why it works.</p>
      {choosing && <div className="library-practice-notice mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#bcd5f4] bg-[#eef5ff] p-4 text-sm text-[#2565b4]"><p>Pick a problem for your practice interview.</p><Link to="/interview" className="inline-flex min-h-10 items-center font-semibold underline underline-offset-4">Back to interview modes</Link></div>}
      <div className={"library-controls [border:1px_solid_#191d2010] [border-radius:18px] [background:#fffdf8] [box-shadow:0_10px_32px_-24px_#12354c40] [padding:24px] [border-color:#dce5ed] [@media_(max-width:_479px)]:[padding:18px] mt-6"}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#2565b4]">
        <p>Live problem library</p>
      </div>

        <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr_1fr]">
          <label className="flex flex-col gap-2 text-xs font-medium">Search problems<input className={"library-input [min-height:44px] w-full [border:1px_solid_#191d2018] [border-radius:10px] [background:white] [padding:10px_12px] [color:#191d20] [font-size:13px] [&:focus-visible]:[outline:2px_solid_#2378db] [&:focus-visible]:[outline-offset:2px]"} type="search" placeholder="Search by name, number, or topic" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <label className="flex flex-col gap-2 text-xs font-medium">Topic<select className={"library-input [min-height:44px] w-full [border:1px_solid_#191d2018] [border-radius:10px] [background:white] [padding:10px_12px] [color:#191d20] [font-size:13px] [&:focus-visible]:[outline:2px_solid_#2378db] [&:focus-visible]:[outline-offset:2px]"} value={topic} onChange={(event) => setTopic(event.target.value)}><option value="All">All topics</option>{topics.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="flex flex-col gap-2 text-xs font-medium">Sort by<select className={"library-input [min-height:44px] w-full [border:1px_solid_#191d2018] [border-radius:10px] [background:white] [padding:10px_12px] [color:#191d20] [font-size:13px] [&:focus-visible]:[outline:2px_solid_#2378db] [&:focus-visible]:[outline-offset:2px]"} value={sort} onChange={(event) => setSort(event.target.value)}><option value="difficulty">Difficulty</option><option value="title">Name: A to Z</option></select></label>
        </div>
        <div role="group" aria-label="Filter by difficulty" className="mt-5 flex flex-wrap items-center gap-2">
          {filters.map((filter) => <button key={filter} type="button" aria-pressed={difficulty === filter} onClick={() => setDifficulty(filter)} className={`min-h-10 rounded-full border px-4 py-2 text-xs transition motion-reduce:transition-none ${difficulty === filter ? "border-[#3b8fe8]/30 bg-[#e7f0fc] font-semibold text-[#2565b4]" : "border-[#191d20]/10 bg-white text-[#55595c] hover:bg-[#f5faff]"}`}>{filter}<span className="ml-2 opacity-60">{source.filter((problem) => filter === "All" || problem.difficulty === filter).length}</span></button>)}
          {(query || topic !== "All" || difficulty !== "All") && <button type="button" onClick={resetFilters} className="ml-auto min-h-10 px-2 text-xs text-[#2565b4] underline underline-offset-4">Clear filters</button>}
        </div>
      </div>
      <div className={"library-results min-w-0 [padding:24px] [border:1px_solid_#dce5ed] [border-radius:18px] [background:#fffdf8] [box-shadow:0_10px_32px_-24px_#12354c40] [&_.problem-library-grid]:flex [&_.problem-library-grid]:flex-col [&_.problem-library-grid]:[gap:0] [&_.problem-library-card]:[padding:24px_0] [&_.problem-library-card]:[border:0] [&_.problem-library-card]:[border-bottom:1px_solid_#191d2014] [&_.problem-library-card]:[border-radius:0] [&_.problem-library-card]:[background:transparent] [&_.problem-library-card]:[box-shadow:none] [&_.problem-library-card:first-child]:[padding-top:8px] [&_.problem-library-card:last-child]:[border-bottom:0] [&_.problem-library-card:last-child]:[padding-bottom:0] [&_.problem-library-card:is(:hover,_:focus-within)]:[box-shadow:none] [&_.problem-library-card_>_div:last-child]:[border:0] [&_.problem-library-card_>_div:last-child]:[padding-top:0] [&_.problem-library-card_>_div:last-child_a]:[width:auto] [@media_(max-width:_479px)]:[padding:18px] mt-6"}>
      <p role="status" className="mb-4 text-xs text-[#55595c]">{loading ? "Loading problems..." : error ? "Problems unavailable" : `${problems.length} of ${source.length} problems`}</p>
      {loading ? <p className="py-10 text-sm text-[#55595c]">Fetching the problem library...</p> : error ? <div className="py-6"><p role="alert" className="text-sm">{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-4 text-sm text-[#2565b4] underline">Retry</button></div> : problems.length ?
        <ul className={"problem-library-grid grid [gap:20px] [grid-template-columns:minmax(0,_1fr)] [@media_(min-width:_768px)]:[grid-template-columns:repeat(2,_minmax(0,_1fr))]"}>{problems.map((problem) => <li key={problem.slug} className={"problem-library-card [border:1px_solid_#191d2010] [border-radius:18px] [background:#f8fbff] [box-shadow:0_10px_32px_-24px_#12354c40] min-w-0 flex flex-col [padding:24px] [transition:border-color_180ms_ease,_box-shadow_180ms_ease] [border-color:#dce5ed] [&:hover]:[border-color:#3b8fe855] [&:hover]:[box-shadow:0_12px_32px_-24px_#12354c70] [&:focus-within]:[border-color:#3b8fe855] [&:focus-within]:[box-shadow:0_12px_32px_-24px_#12354c70] [@media_(prefers-reduced-motion:_reduce)]:transition-none"}>
          <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-medium tracking-widest text-[#777a7c]">{problem.leetcode_id !== null ? `PROBLEM ${String(problem.leetcode_id).padStart(2, "0")}` : "PRACTICE PROBLEM"}</span><span className={`rounded-full px-3 py-1 text-xs font-medium ${badges[problem.difficulty]}`}>{problem.difficulty}</span></div>
          <h2 className="mt-4 text-xl font-semibold leading-7 tracking-tight">{problem.title}</h2>
          <p className="mb-5 mt-3 line-clamp-3 text-sm leading-7 text-[#55595c]">{new DOMParser().parseFromString(problem.description_html, "text/html").querySelector("p")?.textContent || "Explore the problem and consider how you would solve it."}</p>
          <div className="mb-6 flex flex-wrap gap-2">{problem.topics.map((item) => <button type="button" key={item} onClick={() => setTopic(item)} aria-pressed={topic === item} className="min-h-8 rounded-lg bg-[#e7f0fc] px-2.5 py-1.5 text-[11px] text-[#2565b4] transition hover:bg-[#d5e6fc] motion-reduce:transition-none">{item}</button>)}</div>
        {choosing && <Link to="/interview" state={{ selectedProblem: { slug: problem.slug, title: problem.title, difficulty: problem.difficulty } }} className="mt-4 inline-flex min-h-11 items-center justify-between gap-4 self-start rounded-lg bg-[#2378db] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1969c5] focus-visible:outline-[#2378db]">Choose this problem <span aria-hidden="true">&#8599;</span></Link>}
        </li>)}</ul> : <div className="py-10 text-center"><h2 className="text-lg font-semibold">No matching problems</h2><p className="mt-2 text-sm text-[#55595c]">Try another search or clear your filters.</p><button type="button" onClick={resetFilters} className="mt-5 min-h-10 text-sm font-semibold text-[#2565b4] underline underline-offset-4">Show all problems</button></div>}
      </div>
    </section>
    </div>
    <FooterWaves />
  </main>;
}
