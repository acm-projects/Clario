import { useState } from "react";
import { Panel } from "./Panel";
import type { TestsResponse } from "../types";

interface TestResultPanelProps {
  testcases: string; // Problem.example_testcases
  result?: TestsResponse | null;
  error?: string | null;
  message?: string;
}

// Verdict -> badge colours. Keys mirror the RunStatus values from the backend;
// an unknown verdict falls back to the neutral "Unsupported" styling.
const STATUS_STYLE: Record<string, string> = {
  Accepted: "bg-[#173a2c] text-[#5fd39a]",
  "Wrong Answer": "bg-[#3a3217] text-[#e0b84f]",
  "Runtime Error": "bg-[#3a1c20] text-[#ec6f7a]",
  "Time Limit Exceeded": "bg-[#3a3217] text-[#e0b84f]",
  "Compile Error": "bg-[#3a1c20] text-[#ec6f7a]",
  Unsupported: "bg-[#1c2436] text-[#8a97ad]",
};

const statusStyle = (status: string) =>
  STATUS_STYLE[status] ?? "bg-[#1c2436] text-[#8a97ad]";

export function TestResultPanel({
  testcases,
  result = null,
  error = null,
  message = "You must run your code first",
}: TestResultPanelProps) {
  const [tab, setTab] = useState<"result" | "testcase">("result");
  const tabClass = (active: boolean) =>
    active ? "theme-main-text font-semibold" : "theme-muted-text hover:text-[var(--text-main)]";

  return (
    <Panel>
      <nav className="theme-border flex shrink-0 items-center gap-5 border-b px-4 py-3 text-sm">
        <button className={tabClass(tab === "result")} onClick={() => setTab("result")}>
          Test Result
        </button>
        <button className={tabClass(tab === "testcase")} onClick={() => setTab("testcase")}>
          Testcase
        </button>
      </nav>

      {tab === "result" ? (
        <div className="theme-muted-text min-h-0 flex-1 overflow-auto p-3 text-sm">
          {error ? (
            <pre className="whitespace-pre-wrap text-red-400">{error}</pre>
          ) : result ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle(result.status)}`}>
                  {result.status}
                </span>
                {result.total > 0 && (
                  <span className="theme-muted-text text-xs">
                    {result.passed}/{result.total} passed
                  </span>
                )}
              </div>

              {result.error && (
                <pre className="whitespace-pre-wrap font-mono text-xs text-red-400">
                  {result.error}
                </pre>
              )}

              {result.cases.map((testCase) => (
                <div
                  key={testCase.case}
                  className="theme-code-surface rounded-lg px-3 py-2 font-mono text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="theme-body-text font-semibold">
                      Case {testCase.case}
                    </span>
                    <span className={testCase.passed ? "text-green-400" : "text-red-400"}>
                      {testCase.passed ? "✓ Passed" : "✗ Failed"}
                    </span>
                  </div>
                  <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
                    <dt className="theme-muted-text">Input</dt>
                    <dd className="whitespace-pre-wrap [overflow-wrap:anywhere]">{testCase.input}</dd>
                    <dt className="theme-muted-text">Expected</dt>
                    <dd className="whitespace-pre-wrap [overflow-wrap:anywhere]">{testCase.expected}</dd>
                    <dt className="theme-muted-text">Output</dt>
                    <dd className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                      {testCase.output ?? "—"}
                    </dd>
                  </dl>
                </div>
              ))}

              {result.stdout && (
                <div className="theme-code-surface rounded-lg px-3 py-2 font-mono text-xs">
                  <div className="theme-muted-text mb-1">stdout</div>
                  <pre className="whitespace-pre-wrap [overflow-wrap:anywhere]">{result.stdout}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">{message}</div>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <pre className="theme-code-surface theme-body-text rounded-lg px-3.5 py-3 font-mono text-xs leading-6">
            {testcases}
          </pre>
        </div>
      )}
    </Panel>
  );
}
