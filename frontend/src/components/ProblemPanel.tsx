import { useState } from "react";
import { Panel } from "./Panel";
import type { Problem } from "../types";

const TABS = ["Description", "Editorial", "Solutions", "Submissions"];

const difficultyStyle = {
  Easy: "bg-[#173a2c] text-[#5fd39a]",
  Medium: "bg-[#3a3217] text-[#e0b84f]",
  Hard: "bg-[#3a1c20] text-[#ec6f7a]",
} as const;

// Styles the raw description_html (p, code, em, strong, pre) without a typography plugin.
const htmlStyles = [
  "text-sm leading-[1.65] text-[#c3cde0]",
  "[&_p]:mb-3 [&_strong]:font-semibold [&_strong]:text-white [&_em]:italic",
  "[&_code]:rounded [&_code]:bg-[#1a2842] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px]",
  "[&_.example-title]:mt-5 [&_.example-title_strong]:text-sm",
  "[&_pre]:rounded-lg [&_pre]:bg-[#16233b] [&_pre]:px-3.5 [&_pre]:py-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:leading-6 [&_pre]:whitespace-pre-wrap",
].join(" ");

export function ProblemPanel({ problem, solved }: { problem: Problem; solved: boolean }) {
  const [showTopics, setShowTopics] = useState(false);

  return (
    <Panel>
      <nav className="flex shrink-0 items-center gap-5 border-b border-[#17243b] px-4 py-3 text-sm">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={i === 0 ? "font-semibold text-white" : "text-[#8a97ad] hover:text-white"}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            {problem.leetcode_id}. {problem.title}
          </h1>
          {solved && <span className="text-xs font-medium text-[#5fd39a]">Solved</span>}
        </div>

        <div className="mt-4 flex gap-2">
          <span className={`rounded-full px-3 py-1 text-xs ${difficultyStyle[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
          <button
            onClick={() => setShowTopics((v) => !v)}
            aria-expanded={showTopics}
            className="rounded-full bg-[#1a2842] px-3 py-1 text-xs text-[#c3cde0] hover:bg-[#22345a]"
          >
            Topics
          </button>
          <button className="rounded-full bg-[#1a2842] px-3 py-1 text-xs text-[#c3cde0] hover:bg-[#22345a]">
            Hint
          </button>
        </div>

        {showTopics && (
          <div className="mt-2 flex flex-wrap gap-2">
            {problem.topics.map((t) => (
              <span key={t} className="rounded-full border border-[#24365a] px-2.5 py-0.5 text-xs text-[#a9c4f0]">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Trusted fake data. Sanitize (e.g. DOMPurify) if this ever comes from a real API. */}
        <div
          className={`mt-4 ${htmlStyles}`}
          dangerouslySetInnerHTML={{ __html: problem.description_html }}
        />
      </div>
    </Panel>
  );
}
