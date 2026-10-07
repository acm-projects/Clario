import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Link, useLocation, useOutletContext, useParams } from "react-router-dom";
import type { ProfileContext } from "../lib/profile";
import { supabase } from "../lib/supabase";

type Problem = { title: string; description: string | null; starter_code: string | null };

export default function InterviewRoom() {
  const { profile } = useOutletContext<ProfileContext>();
  const { state } = useLocation();
  const { problemId } = useParams();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const language = (state?.language || profile.preferred_language) === "Java" ? "java" : "python";

  useEffect(() => {
    let active = true;
    async function load() {
      setProblem(null);
      setError(false);
      try {
        const { data, error: problemError } = await supabase.from("problems").select("title, description, starter_code").eq("id", problemId).single();
        if (problemError) throw problemError;
        if (active) setProblem(data);
      } catch (err) {
        if (import.meta.env.DEV) console.error("Interview problem loading failed", err);
        if (active) setError(true);
      }
    }
    void load();
    return () => { active = false; };
  }, [problemId, retry]);

  return <div className="min-h-svh bg-[#F6EDD1] p-6 text-[#191d20]">
    <Link to="/dashboard" className="text-sm underline underline-offset-4">Back to dashboard</Link>
    <h1 className="mb-4 mt-8 text-2xl font-semibold">{problem?.title || "Interview Room"}</h1>
    {error ? <div><p role="alert">We couldn't load this problem.</p><button onClick={() => setRetry((value) => value + 1)} className="mt-4 rounded-lg bg-[#3b8fe8] px-5 py-3">Retry</button></div> : !problem ? <p role="status">Loading your problem...</p> : <>
      {problem.description && <p className="mb-6 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-[#55595c]">{problem.description}</p>}
      <p className="mb-4 font-detail text-xs">{language === "java" ? "Java" : "Python"}</p>
      <Editor key={`${problemId}-${language}`} height="500px" defaultLanguage={language} defaultValue={problem.starter_code || (language === "java" ? "// Write your solution here\n" : "# Write your solution here\n")} theme="vs-dark" />
    </>}
  </div>;
}
