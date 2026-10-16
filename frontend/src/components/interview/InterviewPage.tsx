import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { TopBar } from "./TopBar";
import { ProblemPanel } from "./ProblemPanel";
import { TestResultPanel } from "./TestResultPanel";
import { CodePanel } from "./CodePanel";
import { VideoCallPanel } from "./VideoCallPanel";
import { ResizableSplit } from "./ResizableSplit";
import { session } from "./data";
import { fakeProblem, type Problem, type TestsResponse } from "../../types";
import { ApiError, getProblem, runTests } from "../../lib/api";

export default function InterviewPage() {
  const navigate = useNavigate();
  const { problemId } = useParams<{ problemId: string }>();
  const [searchParams] = useSearchParams();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "not-found" | "server-error">("loading");
  const [openInfo, setOpenInfo] = useState<"topics" | "hint" | null>(null);
  const [language, setLanguage] = useState<"python3" | "java">("python3");
  const [code, setCode] = useState("");
  const [runResult, setRunResult] = useState<TestsResponse | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    window.localStorage.getItem("clario-theme") === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    window.localStorage.setItem("clario-theme", theme);
  }, [theme]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProblem() {
      setProblem(null);
      setLoadState("loading");
      setRunResult(null);
      setRunError(null);

      if (!problemId) {
        setLoadState("not-found");
        return;
      }

      try {
        setProblem(await getProblem(problemId, controller.signal));
        setLoadState("ready");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        // GET /api/problems/{slug} is still being built by Prapti
        // back to the bundled sample problem while that endpoint is missing.
        if (problemId === fakeProblem.slug) {
          setProblem(fakeProblem);
          setLoadState("ready");
          return;
        }

        setLoadState(
          error instanceof ApiError && error.status === 404 ? "not-found" : "server-error",
        );
      }
    }

    void loadProblem();
    return () => controller.abort();
  }, [problemId]);

  const handleEndInterview = () => navigate("/dashboard");

  const runCode = async () => {
    if (!problem) {
      setRunError("Problem data is not available.");
      return;
    }

    setRunning(true);
    setRunError(null);
    setRunResult(null);

    try {
      const sourceCode = code || problem.starter_code[language];
      setRunResult(
        await runTests({ slug: problem.slug, language, code: sourceCode }),
      );
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Unable to run code.");
    } finally {
      setRunning(false);
    }
  };

  if (loadState !== "ready" || !problem) {
    const message = {
      loading: "Loading problem…",
      ready: "Loading problem…",
      "not-found": "Problem not found",
      "server-error": "Couldn't reach the server",
    }[loadState];

    return (
      <main
        data-theme={theme}
        className="interview-page flex min-h-screen items-center justify-center bg-[var(--page-bg)] px-6 text-center text-lg font-semibold text-[var(--text-main)]"
        role="status"
        aria-live="polite"
      >
        {message}
      </main>
    );
  }

  return (
    <div data-theme={theme} className="interview-page relative flex h-screen flex-col overflow-hidden bg-[var(--page-bg)] text-[var(--text-main)]">
      <TopBar
        timer={session.timer}
        theme={theme}
        showUmpireTracker={searchParams.get("mode") === "practice"}
        onThemeChange={setTheme}
        onRun={runCode}
        onSubmit={() => {}}
        running={running}
      />

      <main className="sandbox-layout">
        <ResizableSplit direction="horizontal" storageKey="clario-sandbox-call-width" initialSize={76}
          label="Resize workspace and interview call"
          first={
            <ResizableSplit direction="vertical" storageKey="clario-sandbox-results-height" initialSize={81}
              label="Resize editor and test results"
              first={
                <ResizableSplit direction="horizontal" storageKey="clario-sandbox-problem-width" initialSize={36}
                  label="Resize problem and code editor"
                  first={<ProblemPanel problem={problem} solved={session.solved} />}
                  second={<CodePanel starterCode={problem.starter_code} theme={theme} initialLanguage={language}
                    onChange={(nextLanguage, nextCode) => { setLanguage(nextLanguage); setCode(nextCode); }} />}
                />
              }
              second={<TestResultPanel starterCode={problem.starter_code.python3} testcases={problem.example_testcases} result={runResult} error={runError} />}
            />
          }
          second={
        <div className="sandbox-call">
          <div className="sandbox-call-heading">
            <h2>Interview call</h2>
            <div className="flex gap-2">
              {(["topics", "hint"] as const).map((item) => (
                <button key={item} className="sandbox-button" aria-expanded={openInfo === item}
                  aria-controls="sandbox-info" onClick={() => setOpenInfo(openInfo === item ? null : item)}>
                  {item === "topics" ? "Topics" : "Hint"}
                </button>
              ))}
            </div>
            {openInfo && <div id="sandbox-info" className="sandbox-info" role="status">
              {openInfo === "topics" ? problem.topics.join(" ? ") : "Hints coming soon."}
            </div>}
          </div>
          <VideoCallPanel round={session.round} interviewer={session.interviewer} onEndInterview={handleEndInterview} />
        </div>
          }
        />
      </main>
    </div>
  );
}
