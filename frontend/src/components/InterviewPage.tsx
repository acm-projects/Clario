import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TopBar } from "./TopBar";
import { ProblemPanel } from "./ProblemPanel";
import { TestResultPanel } from "./TestResultPanel";
import { CodePanel } from "./CodePanel";
import { VideoCallPanel } from "./VideoCallPanel";
import "./interview.css";
import { session } from "./data";
import { fakeProblem, type Language, type Problem, type RunResult } from "../types";

async function fakeRun(language: string, code: string): Promise<RunResult> {
  void language;
  await new Promise((resolve) => window.setTimeout(resolve, 800));
  if (code.includes("error")) {
    return { stdout: "", stderr: "Error: something went wrong", exit_code: 1 };
  }
  return { stdout: "hi\n", stderr: "", exit_code: 0 };
}

const difficultyStyle = {
  dark: {
    Easy: "bg-[#173a2c] text-[#5fd39a]",
    Medium: "bg-[#3a3217] text-[#e0b84f]",
    Hard: "bg-[#3a1c20] text-[#ec6f7a]",
  },
  light: {
    Easy: "bg-[#e3f5ea] text-[#187344]",
    Medium: "bg-[#fff3cf] text-[#865b05]",
    Hard: "bg-[#ffe6e8] text-[#b43a48]",
  },
} as const;

function Wave() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[44px] w-full"
      viewBox="0 0 1440 44"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d="M0 18 C 180 40, 320 0, 560 14 S 980 40, 1200 12 S 1400 8, 1440 16 V44 H0Z" fill="var(--wave-a)" opacity="0.55" />
      <path d="M0 28 C 220 10, 420 44, 700 28 S 1100 6, 1440 30 V44 H0Z" fill="var(--wave-b)" />
    </svg>
  );
}

export default function InterviewPage() {
  const navigate = useNavigate();
  const { problemId } = useParams<{ problemId: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "not-found" | "server-error">("loading");
  const [openInfo, setOpenInfo] = useState<"topics" | "hint" | null>(null);
  const [language, setLanguage] = useState<Language>("java");
  const [code, setCode] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [resultMessage, setResultMessage] = useState("You must run your code first");
  const [resultTab, setResultTab] = useState<"result" | "testcase">("result");
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
      setResultMessage("You must run your code first");

      if (!problemId) {
        setLoadState("not-found");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8000/api/problems/${encodeURIComponent(problemId)}`,
          { signal: controller.signal },
        );

        if (response.status === 404) {
          setLoadState("not-found");
          return;
        }
        if (!response.ok) {
          throw new Error(`Problem request failed: ${response.status}`);
        }

        const fetchedProblem = (await response.json()) as Problem;
        setProblem(fetchedProblem);
        setLanguage("java");
        setCode(fetchedProblem.starter_code.java ?? "");
        setLoadState("ready");
      } catch {
        if (!controller.signal.aborted) {
          if (problemId === fakeProblem.slug) {
            setProblem(fakeProblem);
            setLanguage("java");
            setCode(fakeProblem.starter_code.java);
            setLoadState("ready");
          } else {
            setLoadState("server-error");
          }
        }
      }
    }

    void loadProblem();
    return () => controller.abort();
  }, [problemId]);

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

  async function handleRun() {
    setResultTab("result");
    setIsRunning(true);
    setRunResult(null);
    setResultMessage("Running...");
    try {
      setRunResult(await fakeRun(language, code));
    } finally {
      setIsRunning(false);
    }
  }

  function handleSubmit() {
    setResultTab("result");
    setRunResult(null);
    setResultMessage("Submissions coming soon");
  }

  function handleEndInterview() {
    navigate("/report");
  }

  return (
    <div data-theme={theme} className="interview-room relative flex h-screen w-screen max-w-none self-center flex-col overflow-hidden bg-[var(--page-bg)] text-[var(--text-main)]">
      <TopBar timer={session.timer} theme={theme} onThemeChange={setTheme} isRunning={isRunning} onRun={handleRun} onSubmit={handleSubmit} />

      <main className="relative z-10 grid min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)_300px] gap-3 px-4 pb-3 pt-3">
        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_210px] gap-3">
          <ProblemPanel problem={problem} solved={session.solved} />
          <TestResultPanel
            testcases={problem.example_testcases}
            message={resultMessage}
            isRunning={isRunning}
            result={runResult}
            activeTab={resultTab}
            onTabChange={setResultTab}
          />
        </div>
        <CodePanel
          key={problem.slug}
          starterCode={problem.starter_code}
          theme={theme}
          onChange={(nextLanguage, nextCode) => {
            setLanguage(nextLanguage);
            setCode(nextCode);
          }}
        />
        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2">
          <div className="relative flex flex-wrap items-center justify-end gap-2 px-1">
            <span className={`rounded-full px-3 py-1 text-xs ${difficultyStyle[theme][problem.difficulty]}`}>
              {problem.difficulty}
            </span>
            <button
              onClick={() => setOpenInfo((current) => current === "topics" ? null : "topics")}
              aria-expanded={openInfo === "topics"}
              aria-controls="problem-topics"
              className="theme-surface theme-body-text theme-surface-hover rounded-full px-3 py-1 text-xs"
            >
              Topics
            </button>
            <button
              onClick={() => setOpenInfo((current) => current === "hint" ? null : "hint")}
              aria-expanded={openInfo === "hint"}
              aria-controls="problem-hint"
              className="theme-surface theme-body-text theme-surface-hover rounded-full px-3 py-1 text-xs"
            >
              Hint
            </button>
            {openInfo === "topics" && (
              <div id="problem-topics" className="theme-panel absolute right-0 top-full z-10 mt-2 flex max-w-full flex-wrap justify-end gap-2 rounded-lg border p-2 shadow-xl">
                {problem.topics.map((topic) => (
                  <span key={topic} className="theme-border rounded-full border px-2.5 py-0.5 text-xs text-[var(--accent-text)]">
                    {topic}
                  </span>
                ))}
              </div>
            )}
            {openInfo === "hint" && (
              <div id="problem-hint" role="status" className="theme-panel theme-body-text absolute right-0 top-full z-10 mt-2 rounded-lg border px-3 py-2 text-xs shadow-xl">
                Hints coming soon.
              </div>
            )}
          </div>
          <VideoCallPanel round={session.round} interviewer={session.interviewer} onEndInterview={handleEndInterview} />
        </div>
      </main>

      <Wave />
    </div>
  );
}
