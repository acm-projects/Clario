import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import type { ProfileContext } from "../lib/profile";
import { loadRecommendedProblem } from "../lib/dashboard";
import { supabase } from "../lib/supabase";

export default function InterviewSelection() {
  const { profile } = useOutletContext<ProfileContext>();
  const navigate = useNavigate();
  const [language, setLanguage] = useState(profile.preferred_language === "Java" ? "Java" : "Python");
  const [difficulty, setDifficulty] = useState(["easy", "medium", "hard"].includes(profile.starting_difficulty?.toLowerCase() || "") ? profile.starting_difficulty!.toLowerCase() : "easy");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startInterview() {
    if (starting) return;
    setStarting(true);
    setError(null);
    try {
      const problem = await loadRecommendedProblem(supabase, difficulty);
      if (!problem) {
        setError("No problem is available at this difficulty yet. Try another level.");
        return;
      }
      navigate(`/interview/${encodeURIComponent(problem.id)}`, { state: { language } });
    } catch (err) {
      if (import.meta.env.DEV) console.error("Interview selection failed", err);
      setError("We couldn't load an interview problem. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  return <main className="min-h-svh bg-[#F6EDD1] px-4 py-6 text-[#191d20] sm:px-6 lg:px-[5%] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4">
    <header className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 rounded-2xl border border-[#191d20]/5 bg-[#fffdf8] px-6 py-4"><Link to="/" className="text-2xl font-semibold tracking-[-0.07em]" aria-label="Clario home">CLARIO<span className="text-[#3b8fe8]">.</span></Link><Link to="/dashboard" className="text-xs text-[#2565b4] hover:underline">Back to dashboard</Link></header>
    <section className="mx-auto max-w-[640px] py-10 sm:py-14">
      <p className="font-detail text-[10px] font-medium tracking-widest text-[#2565b4]">YOUR NEXT CONVERSATION</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Make a little progress.</h1>
      <p className="mt-4 text-sm leading-7 text-[#55595c]">Choose your language and difficulty, then practice talking through a coding problem with Clario.</p>
      {/* Session choices start from the profile without changing saved preferences. */}
      <form onSubmit={(event) => { event.preventDefault(); void startInterview(); }} aria-busy={starting} className="mt-7 rounded-2xl border border-[#191d20]/5 bg-[#fffdf8] p-6 shadow-[0_6px_24px_-16px_rgba(25,29,32,0.18)] sm:p-8">
        <fieldset disabled={starting}><legend className="text-sm font-semibold">Coding language</legend><div className="mt-3 grid grid-cols-2 gap-3">{["Python", "Java"].map((value) => <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-4 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 ${language === value ? "border-[#3b8fe8]/40 bg-[#e7f0fc] text-[#2565b4]" : "border-[#191d20]/10"}`}><input type="radio" name="language" value={value} checked={language === value} onChange={() => setLanguage(value)} className="accent-[#3b8fe8]" />{value}</label>)}</div></fieldset>
        <fieldset disabled={starting} className="mt-7"><legend className="text-sm font-semibold">Difficulty</legend><div className="mt-3 grid gap-3 sm:grid-cols-3">{["easy", "medium", "hard"].map((value) => <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-4 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 ${difficulty === value ? "border-[#3b8fe8]/40 bg-[#e7f0fc] text-[#2565b4]" : "border-[#191d20]/10"}`}><input type="radio" name="difficulty" value={value} checked={difficulty === value} onChange={() => setDifficulty(value)} className="accent-[#3b8fe8]" /><span className="capitalize">{value}</span></label>)}</div></fieldset>
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{error}</p>}
        <button type="submit" disabled={starting} className="mt-7 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-4 rounded-lg bg-[#3b8fe8] px-6 py-3 text-sm font-semibold text-[#121826] transition hover:bg-[#6eaff8] disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none">{starting ? "Preparing your interview..." : "Start Interview"}<span aria-hidden="true">&#8599;</span></button>
      </form>
    </section>
  </main>;
}