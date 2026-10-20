import DOMPurify from "dompurify";
import { Panel } from "./Panel";
import type { Problem } from "../../types";

const TABS = ["Description", "Editorial", "Solutions", "Submissions"];

// Styles the raw description_html (p, code, em, strong, pre) without a typography plugin.
const htmlStyles = [
  "text-left text-sm leading-[1.65] text-[var(--text-body)]",
  "[&_p]:mb-3 [&_strong]:font-semibold [&_strong]:text-[var(--text-main)] [&_em]:italic",
  "[&_code]:rounded [&_code]:bg-[var(--surface)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px]",
  "[&_.example-title]:mt-5 [&_.example-title_strong]:text-sm",
  "[&_pre]:rounded-lg [&_pre]:border [&_pre]:border-[var(--line)] [&_pre]:bg-[var(--code-surface)] [&_pre]:px-3.5 [&_pre]:py-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:leading-6 [&_pre]:whitespace-pre-wrap",
  "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1",
].join(" ");

export function ProblemPanel({ problem, solved }: { problem: Problem; solved: boolean }) {
  return (
    <Panel>
      <nav className="mx-[21px] flex shrink-0 flex-wrap items-center gap-[17px] border-b border-[var(--line)] py-[17px] pb-[11px] text-sm max-[1150px]:gap-[10px] max-[1150px]:text-[11px]">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`relative ${i === 0 ? "font-semibold text-[var(--text-main)] after:absolute after:-bottom-3 after:left-0 after:right-0 after:h-0.5 after:bg-[#fac52e]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="flex items-center justify-between">
          <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.7px] text-[var(--text-main)]">
            {problem.leetcode_id}. {problem.title}
          </h1>
          <span className={`rounded-[20px] border px-[11px] py-[3px] text-xs ${
            problem.difficulty.toLowerCase() === "easy"
              ? "border-[var(--easy-border)] bg-[var(--easy-bg)] text-[var(--easy-text)]"
              : problem.difficulty.toLowerCase() === "medium"
                ? "border-[var(--medium-border)] bg-[var(--medium-bg)] text-[var(--medium-text)]"
                : "border-[var(--hard-border)] bg-[var(--hard-bg)] text-[var(--hard-text)]"
          }`}>{problem.difficulty}{solved ? " ? Solved" : ""}</span>
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
