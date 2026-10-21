import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TopBar } from "./components/TopBar";
import { ProblemPanel } from "./components/ProblemPanel";
import { TestResultPanel } from "./components/TestResultPanel";
import { CodePanel } from "./components/CodePanel";
import { VideoCallPanel } from "./components/VideoCallPanel";
import { ResizableSplit } from "./components/ResizableSplit";
import { session } from "./data";
import { useInterviewSession } from "./hooks/useInterviewSession";
import "./interview.css";

export default function InterviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    problem,
    loadState,
    language,
    runResult,
    runError,
    running,
    setLanguage,
    setCode,
    runCode,
  } = useInterviewSession();
  const [openInfo, setOpenInfo] = useState<"topics" | "hint" | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    window.localStorage.getItem("clario-theme") === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    window.localStorage.setItem("clario-theme", theme);
  }, [theme]);

  const handleEndInterview = () => navigate("/dashboard");

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
