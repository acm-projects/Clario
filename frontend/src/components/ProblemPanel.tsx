import DOMPurify from "dompurify";
import { Panel } from "./Panel";
import type { Problem } from "../types";

const TABS = ["Description", "Editorial", "Solutions", "Submissions"];

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
    <Panel>
      <nav className="theme-border flex shrink-0 items-center gap-2 border-b px-3 py-3 text-xs">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={i === 0 ? "theme-main-text font-semibold" : "theme-muted-text hover:text-[var(--text-main)]"}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="flex items-center justify-between">
          <h1 className="problem-title theme-main-text text-2xl font-extrabold leading-tight">
            {problem.leetcode_id}. {problem.title}
          </h1>
          {solved && <span className="text-[var(--success)] text-xs font-medium">Solved</span>}
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
