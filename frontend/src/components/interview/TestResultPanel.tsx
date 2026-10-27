import { useState } from "react";
import { Panel } from "./Panel";
import type { TestsResponse } from "../../types";

export type ExecutionTab = "testcases" | "results";
interface TestResultPanelProps {
  testcases: string;
  isCompanyMode?: boolean;
  starterCode?: string;
  descriptionHtml: string;
  result?: TestsResponse | null;
  error?: string | null;
  running?: boolean;
  tab: ExecutionTab;
  onTabChange: (tab: ExecutionTab) => void;
}

function ValueBlock({ label, value }: { label: string; value: string }) {
  return <div className="space-y-2">
    <p className="theme-muted-text text-xs font-semibold">{label}</p>
    <pre className="theme-surface theme-body-text rounded-xl p-4 font-mono text-sm leading-6 whitespace-pre-wrap [overflow-wrap:anywhere]">{value}</pre>
  </div>;
}


export function TestResultPanel({
  testcases,
  descriptionHtml,
  starterCode = "",
  result = null,
  error = null,
  running = false,
  tab,
  onTabChange,
  isCompanyMode = false,
}: TestResultPanelProps) {

  const [selectedInput, setSelectedInput] = useState(1);
  const [selectedResult, setSelectedResult] = useState(1);
  const signature = starterCode.match(/def\s+(?!__init__\b)\w+\s*\(([^)]*)\)/)?.[1];
  let depth = 0;
  const parameters = signature?.split("").map((char) => {
    if ("[({".includes(char)) depth++;
    if ("])}".includes(char)) depth--;
    return char === "," && depth === 0 ? "\n" : char;
  }).join("").split("\n").filter((param) => param.trim() && param.trim() !== "self");
  const descriptionText = new DOMParser().parseFromString(
    descriptionHtml.replace(/<br\s*\/?\s*>|<\/pre>/gi, "\n"), "text/html",
  ).body.textContent ?? "";
  const expectedOutputs = Array.from(descriptionText.matchAll(/Output:\s*([^\n]+)/g),
    (match) => match[1].split(/Explanation:/i)[0].trim());
  const lines = testcases.split("\n").filter((line) => line.trim());
  const count = parameters?.length || lines.length || 1;
  const examples = Array.from({ length: Math.ceil(lines.length / count) }, (_, index) => ({
    case: index + 1, expected: expectedOutputs[index], input: lines.slice(index * count, (index + 1) * count).join("\n"),
  }));
  const inputCase = examples.find((item) => item.case === selectedInput) ?? examples[0];
  const active = result?.cases.find((item) => item.case === selectedResult) ?? result?.cases[0];
  const accepted = result && result.total > 0 && result.passed === result.total && !result.error;
  const caseClass = (selected: boolean) => `flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${selected ? "theme-surface theme-main-text" : "theme-muted-text hover:bg-[var(--surface)]"}`;

  return <Panel className="sandbox-results gap-4 rounded-[18px] px-5 py-4">
    <div className="flex shrink-0 gap-5" role="tablist" aria-label="Code execution">
      {(isCompanyMode ? ["results"] as const : ["testcases", "results"] as const).map((item) => <button key={item}
        id={`sandbox-${item}-tab`} role="tab" aria-selected={tab === item}
        aria-controls={`sandbox-${item}-panel`} tabIndex={tab === item ? 0 : -1}
        onClick={() => onTabChange(item)}
        onKeyDown={(event) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const next = event.key === "Home" ? "testcases" : event.key === "End" ? "results" : tab === "results" ? "testcases" : "results";
            onTabChange(next);
            document.getElementById(`sandbox-${next}-tab`)?.focus();
          }
        }}
        className={`border-b-2 pb-2 text-base font-semibold ${tab === item ? "border-[#2378db] theme-main-text" : "border-transparent theme-muted-text"}`}>
        {item === "testcases" ? "Test Cases" : "Test Results"}
      </button>)}
    </div>
    {!isCompanyMode && (
      <div id="sandbox-testcases-panel" role="tabpanel" aria-labelledby="sandbox-testcases-tab"
      hidden={tab !== "testcases"} className="min-h-0 flex-1 overflow-auto">
      <div className="mb-4 flex flex-wrap gap-2">
        {examples.map((item) => <button key={item.case} className={caseClass(inputCase?.case === item.case)}
          aria-pressed={inputCase?.case === item.case} onClick={() => setSelectedInput(item.case)}>Case {item.case}</button>)}
      </div>
      {inputCase ? <div className="space-y-5 pb-2">
        <ValueBlock label="Input" value={inputCase.input} />
        <ValueBlock label="Expected Output" value={inputCase.expected ?? result?.cases.find((item) => item.case === inputCase.case)?.expected ?? "Expected output unavailable."} />
      </div> : <p className="theme-muted-text text-sm">No example test cases available.</p>}
    </div>)}
    <div id="sandbox-results-panel" role="tabpanel" aria-labelledby="sandbox-results-tab"
      hidden={tab !== "results"} className="min-h-0 flex-1 overflow-auto" aria-live="polite" aria-busy={running}>
      {running ? <p className="theme-muted-text text-sm">Running your code…</p>
        : error ? <pre className="whitespace-pre-wrap text-sm text-red-500">{error}</pre>
        : result ? <div className="space-y-5 pb-2">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className={`text-xl font-semibold ${accepted ? "text-emerald-500" : "text-red-500"}`}>
              {accepted ? "Accepted" : result.error ? "Execution Error" : "Wrong Answer"}
            </h2>
            <span className="theme-muted-text text-sm">{result.passed} / {result.total} passed</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.cases.map((item) => <button key={item.case} className={caseClass(active?.case === item.case)}
              aria-pressed={active?.case === item.case} onClick={() => setSelectedResult(item.case)}>
              <span className={item.passed ? "text-emerald-500" : "text-red-500"} aria-label={item.passed ? "Passed" : "Failed"}>{item.passed ? "✓" : "✕"}</span>
              Case {item.case}
            </button>)}
          </div>

          {active && !isCompanyMode && (
            <>
              <ValueBlock label="Input" value={active.input} />
              <ValueBlock label="Output" value={active.output ?? "No output"} />
              <ValueBlock label="Expected" value={active.expected} />
            </>
          )}

          {isCompanyMode && result.cases.length > 0 && (
            <p className="theme-muted-text text-sm">
              Hidden test case inputs and expected outputs are not
              available during company interviews.
            </p>
          )}
          {result.error && <ValueBlock label="Error" value={result.error} />}
          {result.stdout && <ValueBlock label="Stdout" value={result.stdout} />}
        </div> : <p className="theme-muted-text text-sm">Run your code to see test results.</p>}
    </div>
  </Panel>;
}
