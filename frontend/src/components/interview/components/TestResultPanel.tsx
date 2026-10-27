import { useState } from "react";
import { Panel } from "./Panel";
import type { TestsResponse } from "../../../types";

interface TestResultPanelProps {
  testcases: string;
  starterCode?: string;
  result?: TestsResponse | null;
  error?: string | null;
  message?: string;
}

export function TestResultPanel({ testcases, starterCode = "", result = null, error = null,
  message = "Run your code to see test results." }: TestResultPanelProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState<"results" | "testcases">("results");
  const signature = starterCode.match(/def\s+(?!__init__\b)\w+\s*\(([^)]*)\)/)?.[1];
  let depth = 0;
  const parameters = signature?.split("").map((char) => {
    if ("[({".includes(char)) depth++;
    if ("])}".includes(char)) depth--;
    return char === "," && depth === 0 ? "\n" : char;
  }).join("").split("\n").filter((param) => param.trim() && param.trim() !== "self");
  const lines = testcases.split("\n").filter((line) => line.trim());
  const count = parameters?.length || lines.length || 1;
  const examples = Array.from({ length: Math.ceil(lines.length / count) }, (_, index) => ({
    case: index + 1, input: lines.slice(index * count, (index + 1) * count).join("\n"),
    passed: undefined as boolean | undefined,
  }));
  const cases = result?.cases.length ? result.cases : examples;
  const selectedCase = cases.find((item) => item.case === selected);
  const active = result?.cases.find((item) => item.case === selected);
  return <Panel className="sandbox-results">
    <div className="flex shrink-0 flex-wrap items-center gap-3">
      <div className="flex gap-5" role="tablist" aria-label="Code execution">
        {(["results", "testcases"] as const).map((item) => (
          <button key={item} id={`sandbox-${item}-tab`} role="tab"
            aria-selected={tab === item} aria-controls={`sandbox-${item}-panel`}
            tabIndex={tab === item ? 0 : -1}
            onClick={() => setTab(item)}
            onKeyDown={(event) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                event.preventDefault();
                const next = event.key === "Home" ? "results" : event.key === "End" ? "testcases" : tab === "results" ? "testcases" : "results";
                setTab(next);
                document.getElementById(`sandbox-${next}-tab`)?.focus();
              }
            }}
            className={`border-b-2 pb-2 text-base font-semibold ${tab === item ? "border-[#fac52e] theme-main-text" : "border-transparent theme-muted-text"}`}>
            {item === "results" ? "Test results" : "Testcases"}
          </button>
        ))}
      </div>
      {result && <span className="sandbox-result-count">{result.passed} / {result.total} passed</span>}
    </div>
    <div id="sandbox-testcases-panel" role="tabpanel" aria-labelledby="sandbox-testcases-tab"
      hidden={tab !== "testcases"} className="min-h-0 overflow-auto">
      <div className="sandbox-cases sandbox-input-cases">
        {cases.map((item) => <button key={item.case}
          className={`sandbox-case ${item.passed === false ? "failed" : "passed"}`}
          aria-expanded={selected === item.case} aria-controls="sandbox-case-input"
          onClick={() => setSelected(selected === item.case ? null : item.case)}>
          <span className="sandbox-case-dot" /><strong>Case {item.case}</strong>
          <span>{item.passed === undefined ? "Not run" : item.passed ? "passed" : "failed"}</span>
          <svg className="ml-auto shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" style={{ transform: selected === item.case ? "rotate(180deg)" : undefined }}><path d="m5 9 7 7 7-7" /></svg>
        </button>)}
      </div>
      {selectedCase && <div id="sandbox-case-input" className="mt-3 theme-body-text">
        <p className="mb-1 text-xs font-semibold">Input</p>
        <pre className="theme-code-surface rounded-lg p-3 font-mono text-xs leading-6 whitespace-pre-wrap [overflow-wrap:anywhere]">{selectedCase.input}</pre>
      </div>}
      {!cases.length && <p className="theme-muted-text text-sm">No example testcases available.</p>}
    </div>
    <div id="sandbox-results-panel" role="tabpanel" aria-labelledby="sandbox-results-tab"
      hidden={tab !== "results"} className="min-h-0 overflow-auto" aria-live="polite">
      {error ? <pre className="whitespace-pre-wrap text-red-600">{error}</pre> : result ? <>
        <div className="sandbox-cases">
          {result.cases.map((item) => <button key={item.case}
            className={`sandbox-case ${item.passed ? "passed" : "failed"}`}
            aria-expanded={selected === item.case} onClick={() => setSelected(selected === item.case ? null : item.case)}>
            <span className="sandbox-case-dot" /> <strong>Case {item.case}</strong>
            <span>{item.passed ? "passed" : "failed"}</span><span className="ml-auto">{selected === item.case ? "?" : "?"}</span>
          </button>)}
        </div>
        {active && <p className="mt-2 font-mono text-xs whitespace-pre-wrap">Case {active.case} ? {active.input} ? output {active.output ?? "?"} ? expected {active.expected}</p>}
        {result.error && <pre className="mt-2 whitespace-pre-wrap text-xs text-red-600">{result.error}</pre>}
        {result.stdout && <pre className="mt-2 whitespace-pre-wrap text-xs">{result.stdout}</pre>}
      </> : <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-sm theme-muted-text">
        <p>{message}</p>
      </div>}
    </div>
  </Panel>;
}
