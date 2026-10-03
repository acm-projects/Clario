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
    active ? "font-semibold text-white" : "text-[#8a97ad] hover:text-white";

  return (
    <Panel>
      <nav className="flex shrink-0 items-center gap-5 border-b border-[#17243b] px-4 py-3 text-sm">
        <button className={tabClass(tab === "result")} onClick={() => setTab("result")}>
          Test Result
        </button>
        <button className={tabClass(tab === "testcase")} onClick={() => setTab("testcase")}>
          Testcase
        </button>
      </nav>

      {tab === "result" ? (
        <div className="flex flex-1 items-center justify-center text-sm text-[#a6b2c7]">{message}</div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <pre className="rounded-lg bg-[#16233b] px-3.5 py-3 font-mono text-xs leading-6 text-[#c3cde0]">
            {testcases}
          </pre>
        </div>
      )}
    </Panel>
  );
}
