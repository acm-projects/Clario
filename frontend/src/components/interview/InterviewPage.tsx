import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { TopBar } from "./TopBar";
import { ProblemPanel } from "./ProblemPanel";
import { TestResultPanel } from "./TestResultPanel";
import { CodePanel } from "./CodePanel";
import { VideoCallPanel } from "./VideoCallPanel";
import { ResizableSplit } from "./ResizableSplit";
import { interviewModes } from "../../lib/interviewModes";
import { session } from "./data";
import { type Problem, type TestsResponse } from "../../types";
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
  const themeStyles: CSSProperties & Record<`--${string}`, string> = theme === "dark"
    ? {
        "--page-bg": "#0a1120", "--panel-bg": "#0f1a2e", "--line": "#34445e", "--color-scheme": "dark",
        "--text-main": "#f4f7fc", "--text-body": "#c3cde0", "--text-muted": "#8a97ad",
        "--surface": "#1a2842", "--surface-hover": "#22345a", "--code-surface": "#16233b",
        "--video-self": "#0c1626", "--video-interviewer": "#bfdbfe", "--avatar-ring": "#0c1a30",
        "--accent-text": "#6fa4ee", "--editor-footer-bg": "#0f1a2e", "--editor-footer-text": "#a9bce0",
        "--easy-bg": "#173a2c", "--easy-text": "#79dfac", "--easy-border": "#397653",
        "--medium-bg": "#3a3217", "--medium-text": "#f0cf76", "--medium-border": "#806a2b",
        "--hard-bg": "#3a1c20", "--hard-text": "#ffa2ac", "--hard-border": "#8d4550",
        "--count-bg": "#3a3217", "--count-text": "#f0cf76", "--count-border": "#806a2b",
        "--failed-bg": "#3a1c20", "--failed-text": "#ffa2ac", "--failed-border": "#aa5360",
        "--failed-dot": "#ff8796", "--passed-dot": "#79a9ff", "--input-failed-text": "#ffa2ac",
        "--input-failed-dot": "#ff8796", "--input-failed-bg": "#3a1c20", "--focus-color": "#fac52e",
      }
    : {
        "--page-bg": "#fbf4df", "--panel-bg": "#fff", "--line": "#292929", "--color-scheme": "light",
        "--text-main": "#173153", "--text-body": "#254268", "--text-muted": "#587096",
        "--surface": "#fbf4df", "--surface-hover": "#f6e9bf", "--code-surface": "#fbf4df",
        "--video-self": "#fbf4df", "--video-interviewer": "#bfdbfe", "--avatar-ring": "#e8efff",
        "--accent-text": "#245d9e", "--editor-footer-bg": "#fff", "--editor-footer-text": "#587096",
        "--easy-bg": "#e1f3e7", "--easy-text": "#08734d", "--easy-border": "#8c9a8c",
        "--medium-bg": "#fff0bf", "--medium-text": "#865b05", "--medium-border": "#8c9a8c",
        "--hard-bg": "#ffe6e8", "--hard-text": "#b43a48", "--hard-border": "#8c9a8c",
        "--count-bg": "#fff0bf", "--count-text": "#173153", "--count-border": "#968b65",
        "--failed-bg": "#fceceb", "--failed-text": "#ba2424", "--failed-border": "#cd2929",
        "--failed-dot": "#ba2424", "--passed-dot": "#305ed1", "--input-failed-text": "#cc3c09",
        "--input-failed-dot": "#cc3c09", "--input-failed-bg": "var(--surface)", "--focus-color": "#305ed1",
      };

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
      setCode("");

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
        style={themeStyles}
        className="flex min-h-screen items-center justify-center bg-[var(--page-bg)] px-6 text-center text-lg font-semibold text-[var(--text-main)] [color-scheme:var(--color-scheme)]"
        role="status"
        aria-live="polite"
      >
        {message}
      </main>
    );
  }

  return (
    <div data-theme={theme} style={themeStyles} className="group/interview relative flex h-screen flex-col overflow-hidden bg-[var(--page-bg)] text-[var(--text-main)] [color-scheme:var(--color-scheme)] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-[var(--focus-color)] [&_button:focus-visible]:outline-offset-[3px] [&_summary:focus-visible]:outline-2 [&_summary:focus-visible]:outline-[var(--focus-color)] [&_summary:focus-visible]:outline-offset-[3px] max-[950px]:h-auto max-[950px]:min-h-screen max-[950px]:overflow-auto">
      <TopBar
        timer={session.timer}
        theme={theme}
        showUmpireTracker={searchParams.get("mode") === "custom"}
        modeLabel={interviewModes.find(mode => mode.id === searchParams.get("mode"))?.title}
        onThemeChange={setTheme}
        onRun={runCode}
        onSubmit={() => {}}
        running={running}
      />

      <main className="flex min-h-0 flex-1 gap-4 p-4 max-[600px]:gap-2.5 max-[600px]:p-2.5">
        <ResizableSplit direction="horizontal" className="flex-1 [&>div>.resizable-split]:flex-1 max-[950px]:!grid-cols-[minmax(0,1fr)] max-[950px]:gap-4 max-[600px]:!grid-cols-[minmax(0,1fr)] [&>[role=separator]]:max-[950px]:hidden [&>div:first-child]:max-[950px]:h-[850px] [&>div:last-child]:max-[950px]:min-h-[440px] [&>div:first-child]:max-[600px]:h-[1100px]"
          storageKey="clario-sandbox-call-width" initialSize={76}
          label="Resize workspace and interview call"
          first={
            <ResizableSplit direction="vertical" className="flex-1 max-[600px]:[&>div:first-child>.resizable-split-horizontal]:!grid-rows-[minmax(0,1fr)_minmax(0,1fr)] max-[600px]:[&>div:first-child>.resizable-split-horizontal]:gap-3"
              storageKey="clario-sandbox-results-height" initialSize={81}
              label="Resize editor and test results"
              first={
                <ResizableSplit direction="horizontal" className="[&>div:first-child]:min-w-0 [&>div:last-child]:min-w-0 max-[600px]:!grid-cols-[minmax(0,1fr)] max-[600px]:!grid-rows-[minmax(0,1fr)_minmax(0,1fr)] max-[600px]:gap-3 max-[600px]:[&>[role=separator]]:hidden max-[600px]:[&>div:first-child]:max-h-[480px] max-[600px]:[&>div:last-child]:min-h-[480px]"
                  storageKey="clario-sandbox-problem-width" initialSize={36}
                  label="Resize problem and code editor"
                  first={<ProblemPanel problem={problem} solved={session.solved} />}
                  second={<CodePanel key={problem.slug} starterCode={problem.starter_code} theme={theme} initialLanguage={language}
                    onChange={(nextLanguage, nextCode) => { setLanguage(nextLanguage); setCode(nextCode); }} />}
                />
              }
              second={<TestResultPanel starterCode={problem.starter_code.python3} testcases={problem.example_testcases} result={runResult} error={runError} />}
            />
          }
          second={
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-[var(--line)] bg-[var(--panel-bg)] p-4 max-[1150px]:p-3">
          <div className="relative flex items-center justify-between gap-2 pb-3 max-[950px]:flex-wrap">
            <h2 className="text-lg font-semibold max-[1150px]:text-[15px]">Interview call</h2>
            <div className="flex gap-2">
              {(["topics", "hint"] as const).map((item) => (
                <button key={item} className="cursor-pointer rounded-[9px] border border-[var(--line)] bg-[var(--panel-bg)] px-[15px] py-2 text-[13px] hover:bg-[var(--surface-hover)] max-[1150px]:px-[10px]" aria-expanded={openInfo === item}
                  aria-controls="sandbox-info" onClick={() => setOpenInfo(openInfo === item ? null : item)}>
                  {item === "topics" ? "Topics" : "Hint"}
                </button>
              ))}
            </div>
            {openInfo && <div id="sandbox-info" className="absolute right-0 top-full z-20 rounded-[10px] border border-[var(--line)] bg-[var(--panel-bg)] p-[14px] shadow-[0_6px_20px_#0002]" role="status">
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
