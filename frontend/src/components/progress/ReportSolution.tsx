import { useMemo, useState } from "react";
import type { FeedbackInterview } from "../../lib/feedback";
import "./report-solution.css";
import { codeDifference } from "../../utils/codeDifference";

function practiceSteps(fix: string) {
  if (/empty|boundary|edge|duplicate/i.test(fix)) return { steps: ["Identify the input condition named in this fix and decide its expected output from the problem requirements.", "Trace that input through your current conditions and loop boundaries. Revise the handling where the result differs from the requirement."], verification: "Check the case named above and a normal input. Compare the actual output with the expected result, and explain why both follow the same rule." };
  if (/complexity|space|time|trade.off/i.test(fix)) return { steps: ["Identify the input size and count how often the main operation runs, including work inside loops.", "Account for extra data structures separately. Explain the time and space costs and which constraint makes your approach suitable."], verification: "Try doubling the input size on paper. Does the number of operations grow as your complexity explanation predicts?" };
  if (/plan|invariant|explain|approach/i.test(fix)) return { steps: ["Before coding, describe the approach in ordered steps and state what must remain true as you process the input.", "Connect each step to the corresponding part of your implementation. Use one small example to explain why the result follows."], verification: "Walk through the example without skipping a state change. Check that the explanation agrees with what the code actually does." };
  return { steps: ["Find the part of your solution or explanation described in this fix. Restate the intended behavior using the problem requirements.", "Apply the suggested change in a small step, then trace how it affects the result. Explain why the revised behavior meets the requirement."], verification: "Check one representative input and one relevant boundary case. Write down the expected behavior before comparing it with your revision." };
}

export default function ReportSolution({ report }: { report: FeedbackInterview }) {
  const [tab, setTab] = useState<"yours" | "solution">("yours");
  const [activeFix, setActiveFix] = useState<number | null>(0);
  const content = tab === "yours" ? report.submittedCode : report.correctedSolution;
  const differences = useMemo(() => codeDifference(report.submittedCode ?? "", report.correctedSolution ?? ""), [report.submittedCode, report.correctedSolution]);
  const canCompare = report.submittedCode !== null && report.correctedSolution !== null;
  const excerpt = activeFix === null ? null : report.fixDetails?.[activeFix]?.codeExcerpt;
  return <section className="report-solution" aria-label="Solution feedback">
    <div className="solution-fixes"><div className="solution-heading"><h2>{report.actions.fix.length ? `${report.actions.fix.length} things to fix` : "Your next revision"}</h2></div>
      {report.actions.fix.length ? report.actions.fix.map((fix, i) => {
        const detail = report.fixDetails?.[i];
        const guidance = practiceSteps(fix);
        return <details className="solution-fix" key={`${report.id}-${i}`} open={activeFix === i}>
          <summary className="solution-fix-title" onClick={event => { event.preventDefault(); setActiveFix(activeFix === i ? null : i); }}><h3><span className="solution-fix-number">Fix {i + 1}</span>{detail?.title ?? fix}</h3><span>{activeFix === i ? "Close" : "Details"}</span></summary>
          <div className="solution-fix-body"><p className="solution-action">{detail?.explanation || (detail ? fix : "This is the feedback saved for this interview. Use the steps below to apply it to your next revision.")}</p>
          <h4>What to change</h4><ol>{(detail?.steps.length ? detail.steps : guidance.steps).map((step, index) => <li key={index}>{step}</li>)}</ol>
          <h4>How to check it</h4><p>{detail?.verification || guidance.verification}</p>
          {!detail && <small>Practice guidance for this saved fix.</small>}
          {report.correctedSolution && <button type="button" className="solution-view-change" onClick={() => setTab("solution")}>Compare with the solution <span aria-hidden="true">&#8594;</span></button>}</div>
        </details>;
      }) : <p>No specific fixes were saved. Review your approach, trace a normal input and an edge case, then explain the complexity before your next attempt.</p>}
    </div>
    <div className="solution-code-panel"><div className="solution-code-header"><h3>Compare your solution</h3><div className="solution-tabs" aria-label="Code view"><button type="button" aria-pressed={tab === "yours"} onClick={() => setTab("yours")}>Your code</button><button type="button" aria-pressed={tab === "solution"} onClick={() => setTab("solution")}>Solution</button></div></div>
      {canCompare && <p className={`solution-change-key solution-change-key-${tab}`}><span aria-hidden="true" />{differences.yours.size + differences.solution.size === 0 ? "Your code and the solution are identical" : tab === "yours" ? "Highlighted lines are changed or removed in the solution" : "Highlighted lines are new or changed from your code"}</p>}
      <div className="solution-code-scroll" tabIndex={0} aria-label={tab === "yours" ? "Your code" : "Solution code"}>{content ? <pre>{content.split("\n").map((line, i) => {
        const highlighted = canCompare && differences[tab].has(i);
        const related = tab === "solution" && excerpt?.split("\n").some(part => part.trim() && part === line);
        return <div className={`solution-line${highlighted ? ` solution-line-highlight solution-line-${tab}` : ""}${related ? " solution-line-related" : ""}`} key={i}><span className="solution-line-number" aria-hidden="true">{i + 1}</span><code>{line || " "}</code></div>;
      })}</pre> : <p className="solution-code-empty">{tab === "yours" ? "Your code was not saved with this interview. You can still review the feedback and suggested solution." : "A solution is not available for this interview yet. Use the fixes to revise your code, then trace a normal input and an edge case."}</p>}</div>
    </div>
  </section>;
}
