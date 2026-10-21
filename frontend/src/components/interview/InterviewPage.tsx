import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { TopBar } from "./TopBar";
import { ProblemPanel } from "./ProblemPanel";
import { TestResultPanel } from "./TestResultPanel";
import { CodePanel } from "./CodePanel";
import { VideoCallPanel } from "./VideoCallPanel";
import { ResizableSplit } from "./ResizableSplit";
import { session } from "./data";
import { type Problem, type TestsResponse } from "../../types";
import { modeLabels, parseInterviewMode, type InterviewMode } from "../../lib/interviewModes";
import { ApiError, getProblem, runTests, getSession, saveSnapshot, endSession } from "../../lib/api";

function InterviewPage() {
  const navigate = useNavigate();
  const { problemId } = useParams<{ problemId: string }>();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const [ending, setEnding] = useState(false);
  const requestedMode = parseInterviewMode(searchParams.get("mode")) ?? "custom";
  const [activeMode, setActiveMode] = useState<InterviewMode>(requestedMode);
  const isMock = activeMode === "surprise_me" || activeMode === "company";
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "not-found" | "server-error">("loading");
  const [openInfo, setOpenInfo] = useState<"topics" | "hint" | null>(null);
  const [language, setLanguage] = useState<"python3" | "java">("python3");
  const [code, setCode] = useState("");
  const [runResult, setRunResult] = useState<TestsResponse | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    window.localStorage.getItem("clario-theme") === "light" ? "light" : "dark",
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
        if (sessionId) {
          const saved = await getSession(sessionId, controller.signal);
          if (controller.signal.aborted) return;
          setActiveMode(parseInterviewMode(saved.mode) ?? requestedMode);
          if (saved.problem_slug !== problemId) throw new Error("Session problem mismatch.");
          const loaded = saved.problem ?? await getProblem(problemId, controller.signal);
          setProblem({ ...loaded, starter_code: { python3: loaded.starter_code.python3 ?? "", java: loaded.starter_code.java ?? "", ...(saved.latest_code !== null ? { [saved.language]: saved.latest_code } : {}) } });
          setLanguage(saved.language);
          setCode(saved.latest_code ?? loaded.starter_code[saved.language] ?? "");
        } else {
          const loaded = await getProblem(problemId, controller.signal);
          if (controller.signal.aborted) return;
          setProblem(loaded);
          setCode(loaded.starter_code.python3 ?? "");
        }
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
  }, [problemId, sessionId, requestedMode, navigate]);

  const handleEndInterview = async () => {
    if (ending) return;
    setEnding(true);
    setRunError(null);
    try {
      if (sessionId) {
        await saveSnapshot(sessionId, code);
        await endSession(sessionId);
      }
      navigate(sessionId ? "/report/" + encodeURIComponent(sessionId) : "/dashboard");
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Could not save your interview. Please try again.");
    } finally {
      setEnding(false);
    }
  };

  const runCode = async () => {
    if (!problem) {
      setRunError("Problem data is not available.");
      return;
    }

    setRunning(true);
    setRunError(null);
    setRunResult(null);

    try {
      const sourceCode = code;
      if (sessionId) await saveSnapshot(sessionId, sourceCode);
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
        className="flex min-h-screen items-center justify-center bg-[#0a1120] px-6 text-center text-lg font-semibold text-white"
        role="status"
        aria-live="polite"
      >
        {message}
      </main>
    );
  }

  return (
    <div data-theme={theme} className={"interview-page [&.interview-page[data-theme=dark]]:[--page-bg:#0a1120] [&.interview-page[data-theme=dark]]:[--panel-bg:#0f1a2e] [&.interview-page[data-theme=dark]]:[--line:#34445e] [&.interview-page[data-theme=dark]]:[--text-main:#f4f7fc] [&.interview-page[data-theme=dark]]:[--text-body:#c3cde0] [&.interview-page[data-theme=dark]]:[--text-muted:#8a97ad] [&.interview-page[data-theme=dark]]:[--surface:#1a2842] [&.interview-page[data-theme=dark]]:[--surface-hover:#22345a] [&.interview-page[data-theme=dark]]:[--code-surface:#16233b] [&.interview-page[data-theme=dark]]:[--video-self:#0c1626] [&.interview-page[data-theme=dark]]:[--video-interviewer:#bfdbfe] [&.interview-page[data-theme=dark]]:[--avatar-ring:#0c1a30] [&.interview-page[data-theme=dark]]:[--accent-text:#6fa4ee] [&.interview-page[data-theme=dark]]:[--wave-a:#1c3d73] [&.interview-page[data-theme=dark]]:[--wave-b:#2c5ba8] [&.interview-page[data-theme=dark]]:[color-scheme:dark] [&.interview-page[data-theme=dark]]:[--editor-footer-bg:#0f1a2e] [&.interview-page[data-theme=dark]]:[--editor-footer-text:#a9bce0] [&.interview-page[data-theme=light]]:[--page-bg:#fbf4df] [&.interview-page[data-theme=light]]:[--panel-bg:#fff] [&.interview-page[data-theme=light]]:[--line:#292929] [&.interview-page[data-theme=light]]:[--text-main:#173153] [&.interview-page[data-theme=light]]:[--text-body:#254268] [&.interview-page[data-theme=light]]:[--text-muted:#587096] [&.interview-page[data-theme=light]]:[--surface:#fbf4df] [&.interview-page[data-theme=light]]:[--surface-hover:#f6e9bf] [&.interview-page[data-theme=light]]:[--code-surface:#fbf4df] [&.interview-page[data-theme=light]]:[--video-self:#fbf4df] [&.interview-page[data-theme=light]]:[--video-interviewer:#bfdbfe] [&.interview-page[data-theme=light]]:[--avatar-ring:#e8efff] [&.interview-page[data-theme=light]]:[--accent-text:#245d9e] [&.interview-page[data-theme=light]]:[--wave-a:#527db5] [&.interview-page[data-theme=light]]:[--wave-b:#2c5ba8] [&.interview-page[data-theme=light]]:[color-scheme:light] [&.interview-page[data-theme=light]]:[--editor-footer-bg:#fff] [&.interview-page[data-theme=light]]:[--editor-footer-text:#587096] [&.interview-page_.theme-panel]:[border-color:var(--line)] [&.interview-page_.theme-panel]:[background-color:var(--panel-bg)] [&.interview-page_.theme-border]:[border-color:var(--line)] [&.interview-page_.theme-main-text]:[color:var(--text-main)] [&.interview-page_.theme-body-text]:[color:var(--text-body)] [&.interview-page_.theme-muted-text]:[color:var(--text-muted)] [&.interview-page_.theme-surface]:[background-color:var(--surface)] [&.interview-page_.theme-surface-hover:hover]:[background-color:var(--surface-hover)] [&.interview-page_.theme-code-surface]:[background-color:var(--code-surface)] [&.interview-page_.theme-video-self]:[border-color:var(--line)] [&.interview-page_.theme-video-self]:[background-color:var(--video-self)] [&.interview-page_.theme-video-interviewer]:[background-color:var(--video-interviewer)] [&.interview-page_.theme-avatar-ring]:[--tw-ring-color:var(--avatar-ring)] [&.interview-page_.problem-title]:[font-size:24px] [&.interview-page_header_>_div:nth-child(2)_>_button:first-child]:[border:1px_solid_var(--line)] [&.interview-page_header_>_div:nth-child(2)_>_button:first-child]:[border-radius:11px] [&.interview-page_header_>_div:nth-child(2)_>_button:first-child]:[background:var(--panel-bg)] [&.interview-page_button:focus-visible]:[outline:2px_solid_#305ed1] [&.interview-page_button:focus-visible]:[outline-offset:3px] [&.interview-page_summary:focus-visible]:[outline:2px_solid_#305ed1] [&.interview-page_summary:focus-visible]:[outline-offset:3px] [@media_(max-width:_950px)]:[&.interview-page]:[height:auto] [@media_(max-width:_950px)]:[&.interview-page]:[min-height:100vh] [@media_(max-width:_950px)]:[&.interview-page]:[overflow:auto] [@media_(max-width:_950px)]:[&.interview-page_header]:[flex-wrap:wrap] [@media_(max-width:_950px)]:[&.interview-page_header]:[height:auto] [@media_(max-width:_950px)]:[&.interview-page_header]:[min-height:110px] [@media_(max-width:_950px)]:[&.interview-page_header]:[gap:12px] [@media_(max-width:_950px)]:[&.interview-page_header]:[padding:12px_16px] [@media_(max-width:_950px)]:[&.interview-page_header_>_div:nth-child(2)]:[position:static] [@media_(max-width:_950px)]:[&.interview-page_header_>_div:nth-child(2)]:[transform:none] [@media_(max-width:_950px)]:[&.interview-page_header_>_div:nth-child(2)]:[order:3] [@media_(max-width:_950px)]:[&.interview-page_header_>_div:nth-child(2)]:[width:100%] [@media_(max-width:_950px)]:[&.interview-page_header_>_div:nth-child(2)]:[justify-content:center] [&.interview-page_.sandbox-code_>_div:last-child]:[background:var(--editor-footer-bg)] [&.interview-page_.sandbox-code_>_div:last-child]:[color:var(--editor-footer-text)] [&.interview-page_.sandbox-code_>_div:last-child]:[border-color:var(--line)] [&.interview-page_.sandbox-code_>_div:last-child_.theme-muted-text]:[color:var(--editor-footer-text)] [&.interview-page_.sandbox-problem_nav]:[border-color:var(--line)] [&.interview-page_.sandbox-problem_pre]:[border-color:var(--line)] [&.interview-page_.sandbox-theme-toggle_button[aria-pressed=true]]:[background:#fac52e] [&.interview-page_.sandbox-theme-toggle_button[aria-pressed=true]]:[color:#122b50] [&.interview-page[data-theme=dark]_.difficulty-easy]:[background:#173a2c] [&.interview-page[data-theme=dark]_.difficulty-easy]:[color:#79dfac] [&.interview-page[data-theme=dark]_.difficulty-easy]:[border-color:#397653] [&.interview-page[data-theme=dark]_.difficulty-medium]:[background:#3a3217] [&.interview-page[data-theme=dark]_.difficulty-medium]:[color:#f0cf76] [&.interview-page[data-theme=dark]_.difficulty-medium]:[border-color:#806a2b] [&.interview-page[data-theme=dark]_.difficulty-hard]:[background:#3a1c20] [&.interview-page[data-theme=dark]_.difficulty-hard]:[color:#ffa2ac] [&.interview-page[data-theme=dark]_.difficulty-hard]:[border-color:#8d4550] [&.interview-page[data-theme=dark]_.sandbox-result-count]:[background:#3a3217] [&.interview-page[data-theme=dark]_.sandbox-result-count]:[color:#f0cf76] [&.interview-page[data-theme=dark]_.sandbox-result-count]:[border-color:#806a2b] [&.interview-page[data-theme=dark]_.sandbox-case.failed]:[background:#3a1c20] [&.interview-page[data-theme=dark]_.sandbox-case.failed]:[color:#ffa2ac] [&.interview-page[data-theme=dark]_.sandbox-case.failed]:[border-color:#aa5360] [&.interview-page[data-theme=dark]_.sandbox-case.failed_>_span:nth-of-type(2)]:[color:#ffa2ac] [&.interview-page[data-theme=dark]_.sandbox-case.failed_.sandbox-case-dot]:[background:#ff8796] [&.interview-page[data-theme=dark]_.sandbox-case.passed_.sandbox-case-dot]:[background:#79a9ff] [&.interview-page[data-theme=dark]_button:focus-visible]:[outline-color:#fac52e] [&.interview-page[data-theme=dark]_summary:focus-visible]:[outline-color:#fac52e] [&.interview-page_.sandbox-layout]:[display:flex] [&.interview-page_.sandbox-input-cases_.sandbox-case]:[border:0] [&.interview-page_.sandbox-input-cases_.sandbox-case]:[border-radius:18px] [&.interview-page[data-theme=light]_.sandbox-input-cases_.sandbox-case.failed]:[background:var(--surface)] [&.interview-page[data-theme=light]_.sandbox-input-cases_.sandbox-case.failed]:[color:#cc3c09] [&.interview-page[data-theme=light]_.sandbox-input-cases_.sandbox-case.failed_>_span:nth-of-type(2)]:[color:#cc3c09] [&.interview-page[data-theme=light]_.sandbox-input-cases_.sandbox-case.failed_.sandbox-case-dot]:[background:#cc3c09] relative flex h-screen flex-col overflow-hidden bg-[var(--page-bg)] font-sans text-[var(--text-main)]"}>
      <TopBar
        timer={session.timer}
        theme={theme}
        modeLabel={modeLabels[activeMode]}
        onThemeChange={setTheme}
        onRun={runCode}
        onSubmit={() => void handleEndInterview()}
        running={running || ending}
      />

      <main className={"sandbox-layout [&.sandbox-layout]:[display:grid] [&.sandbox-layout]:[grid-template-columns:minmax(0,_1fr)_minmax(290px,_24.2%)] [&.sandbox-layout]:[gap:16px] [&.sandbox-layout]:[flex:1] [&.sandbox-layout]:[min-height:0] [&.sandbox-layout]:[padding:16px] [@media_(max-width:_950px)]:[&.sandbox-layout]:[grid-template-columns:minmax(0,_1fr)] [@media_(max-width:_600px)]:[&.sandbox-layout]:[padding:10px] [@media_(max-width:_600px)]:[&.sandbox-layout]:[gap:10px] [&.sandbox-layout_>_.resizable-split]:[flex:1] [@media_(max-width:_950px)]:[&.sandbox-layout_>_.resizable-split-horizontal]:[height:auto] [@media_(max-width:_950px)]:[&.sandbox-layout_>_.resizable-split-horizontal]:[grid-template-columns:minmax(0,_1fr)]! [@media_(max-width:_950px)]:[&.sandbox-layout_>_.resizable-split-horizontal]:[gap:16px] [@media_(max-width:_950px)]:[&.sandbox-layout_>_.resizable-split-horizontal_>_[role=separator]]:[display:none] [@media_(max-width:_950px)]:[&.sandbox-layout_>_.resizable-split-horizontal_>_div:first-child]:[height:850px] [@media_(max-width:_600px)]:[&.sandbox-layout_>_.resizable-split-horizontal_>_div:first-child]:[height:1100px]"}>
        <ResizableSplit direction="horizontal" storageKey="clario-sandbox-call-width" initialSize={76}
          label="Resize workspace and interview call"
          first={
            <ResizableSplit direction="vertical" storageKey="clario-sandbox-results-height" initialSize={81}
              label="Resize editor and test results"
              first={
                <ResizableSplit direction="horizontal" storageKey="clario-sandbox-problem-width" initialSize={36}
                  label="Resize problem and code editor"
                  first={<ProblemPanel problem={problem} solved={session.solved} />}
                  second={<CodePanel key={sessionId ?? problem.slug} lockLanguage={Boolean(sessionId)} starterCode={problem.starter_code} theme={theme} initialLanguage={language}
                    onChange={(nextLanguage, nextCode) => { setLanguage(nextLanguage); setCode(nextCode); }} />}
                />
              }
              second={<TestResultPanel starterCode={problem.starter_code.python3} testcases={problem.example_testcases} result={runResult} error={runError} />}
            />
          }
          second={
        <div className={"sandbox-call [&.sandbox-call]:[border-radius:18px] [&.sandbox-call]:[display:flex] [&.sandbox-call]:[flex-direction:column] [&.sandbox-call]:[min-height:0] [&.sandbox-call]:[border:1px_solid_var(--line)] [&.sandbox-call]:[background:var(--panel-bg)] [&.sandbox-call]:[padding:16px] [@media_(max-width:_1150px)]:[&.sandbox-call]:[padding:12px] [@media_(max-width:_950px)]:[&.sandbox-call]:[min-height:440px]"}>
          <div className={"sandbox-call-heading [&.sandbox-call-heading]:[position:relative] [&.sandbox-call-heading]:[display:flex] [&.sandbox-call-heading]:[justify-content:space-between] [&.sandbox-call-heading]:[align-items:center] [&.sandbox-call-heading]:[gap:8px] [&.sandbox-call-heading]:[padding-bottom:12px] [&.sandbox-call-heading_h2]:[font-size:18px] [&.sandbox-call-heading_h2]:[font-weight:600] [@media_(max-width:_1150px)]:[&.sandbox-call-heading_h2]:[font-size:15px]"}>
            <h2>Interview call</h2>
            <div className="flex gap-2">
              {!isMock && (["topics", "hint"] as const).map((item) => (
                <button key={item} className={"sandbox-button [&.sandbox-button]:[padding:8px_15px] [&.sandbox-button]:[border:1px_solid_var(--line)] [&.sandbox-button]:[border-radius:9px] [&.sandbox-button]:[background:var(--panel-bg)] [&.sandbox-button]:[font-size:13px] [&.sandbox-button]:[cursor:pointer] [&.sandbox-button:hover]:[background:var(--surface-hover)] [&.sandbox-button.is-active]:[background:#fac52e] [&.sandbox-button.is-active]:[color:#122b50] [@media_(max-width:_1150px)]:[&.sandbox-button]:[padding:8px_10px]"} aria-expanded={openInfo === item}
                  aria-controls={"sandbox-info [&.sandbox-info]:[position:absolute] [&.sandbox-info]:[top:100%] [&.sandbox-info]:[right:0] [&.sandbox-info]:[z-index:20] [&.sandbox-info]:[padding:14px] [&.sandbox-info]:[border:1px_solid_var(--line)] [&.sandbox-info]:[border-radius:10px] [&.sandbox-info]:[background:var(--panel-bg)] [&.sandbox-info]:[box-shadow:0_6px_20px_#0002]"} onClick={() => setOpenInfo(openInfo === item ? null : item)}>
                  {item === "topics" ? "Topics" : "Hint"}
                </button>
              ))}
            </div>
            {!isMock && openInfo && <div id={"sandbox-info [&.sandbox-info]:[position:absolute] [&.sandbox-info]:[top:100%] [&.sandbox-info]:[right:0] [&.sandbox-info]:[z-index:20] [&.sandbox-info]:[padding:14px] [&.sandbox-info]:[border:1px_solid_var(--line)] [&.sandbox-info]:[border-radius:10px] [&.sandbox-info]:[background:var(--panel-bg)] [&.sandbox-info]:[box-shadow:0_6px_20px_#0002]"} className={"sandbox-info [&.sandbox-info]:[position:absolute] [&.sandbox-info]:[top:100%] [&.sandbox-info]:[right:0] [&.sandbox-info]:[z-index:20] [&.sandbox-info]:[padding:14px] [&.sandbox-info]:[border:1px_solid_var(--line)] [&.sandbox-info]:[border-radius:10px] [&.sandbox-info]:[background:var(--panel-bg)] [&.sandbox-info]:[box-shadow:0_6px_20px_#0002]"} role="status">
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

export default function InterviewRoom() {
  const [searchParams] = useSearchParams();
  return <InterviewPage key={searchParams.get("session") ?? "no-session"}/>;
}
