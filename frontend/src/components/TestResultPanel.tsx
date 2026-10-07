import { useState } from "react";
import { Panel } from "./Panel";

interface TestResultPanelProps {
  testcases: string; // Problem.example_testcases
  message?: string;
}

export function TestResultPanel({
  testcases,
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
        <div className="theme-muted-text flex flex-1 items-center justify-center text-sm">{message}</div>
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
