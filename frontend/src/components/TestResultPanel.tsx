import { Panel } from "./Panel";
import type { RunResult } from "../types";

interface TestResultPanelProps {
  testcases: string; // Problem.example_testcases
  message?: string;
  isRunning?: boolean;
  result?: RunResult | null;
  activeTab: "result" | "testcase";
  onTabChange: (tab: "result" | "testcase") => void;
}

export function TestResultPanel({
  testcases,
  message = "You must run your code first",
  isRunning = false,
  result = null,
  activeTab,
  onTabChange,
}: TestResultPanelProps) {
  const tabClass = (active: boolean) =>
    active ? "theme-main-text font-semibold" : "theme-muted-text hover:text-[var(--text-main)]";

  return (
    <Panel>
      <nav className="theme-border flex shrink-0 items-center gap-5 border-b px-4 py-3 text-sm">
        <button className={tabClass(activeTab === "result")} onClick={() => onTabChange("result")}>
          Test Result
        </button>
        <button className={tabClass(activeTab === "testcase")} onClick={() => onTabChange("testcase")}>
          Testcase
        </button>
      </nav>

      {activeTab === "result" ? (
        isRunning ? (
          <div className="theme-muted-text flex flex-1 items-center justify-center text-sm" role="status">Running...</div>
        ) : result ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-3 text-xs">
            {result.stdout && <pre className="theme-code-surface theme-body-text rounded-lg px-3.5 py-3 font-mono leading-5 whitespace-pre-wrap">{result.stdout}</pre>}
            {result.stderr && (
              <pre className="rounded-lg bg-red-950/20 px-3.5 py-3 font-mono leading-5 whitespace-pre-wrap text-red-500">{result.stderr}</pre>
            )}
          </div>
        ) : (
          <div className="theme-muted-text flex flex-1 items-center justify-center text-sm" role="status">{message}</div>
        )
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
