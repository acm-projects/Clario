import DOMPurify from "dompurify";
import { Panel } from "./Panel";
import type { Problem } from "../../types";

// Styles the raw description_html (p, code, em, strong, pre) without a typography plugin.
const htmlStyles = [
  "problem-description theme-body-text",
  "[&_p]:mb-3 [&_strong]:font-semibold [&_strong]:text-[var(--text-main)] [&_em]:italic",
  "[&_code]:rounded [&_code]:bg-[var(--surface)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px]",
  "[&_.example-title]:mt-5 [&_.example-title_strong]:text-sm",
  "[&_pre]:rounded-lg [&_pre]:bg-[var(--code-surface)] [&_pre]:px-3.5 [&_pre]:py-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:leading-6 [&_pre]:whitespace-pre-wrap",
  "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1",
].join(" ");

export function ProblemPanel({ problem, solved }: { problem: Problem; solved: boolean }) {
  return (
    <Panel className={"sandbox-problem [&.sandbox-problem_.problem-title]:[font-size:26px] [&.sandbox-problem_.problem-title]:[letter-spacing:-.7px] [&.sandbox-problem_.problem-description]:[font-size:14px] [&.sandbox-problem_.problem-description]:[line-height:1.65] [&.sandbox-problem_pre]:[border:1px_solid_#817d71] [@media_(max-width:_600px)]:[&.sandbox-problem]:[max-height:480px]"}>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="flex items-center justify-between">
          <h1 className="problem-title theme-main-text text-lg font-extrabold leading-tight">
            {problem.leetcode_id}. {problem.title}
          </h1>
          <span className={`sandbox-difficulty [&.sandbox-difficulty]:[border:1px_solid_#8c9a8c] [&.sandbox-difficulty]:[border-radius:20px] [&.sandbox-difficulty]:[padding:3px_11px] [&.sandbox-difficulty]:[font-size:12px] [&.difficulty-easy]:[background:#e1f3e7] [&.difficulty-easy]:[color:#08734d] [&.difficulty-medium]:[background:#fff0bf] [&.difficulty-medium]:[color:#865b05] [&.difficulty-hard]:[background:#ffe6e8] [&.difficulty-hard]:[color:#b43a48] difficulty-${problem.difficulty.toLowerCase()}`}>{problem.difficulty}{solved ? " ? Solved" : ""}</span>
        </div>

        <div
          className={`problem-description mt-4 ${htmlStyles}`}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(problem.description_html),
          }}
        />
      </div>
    </Panel>
  );
}
