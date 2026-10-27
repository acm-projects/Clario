import "./problem-description.css";
import DOMPurify from "dompurify";
import { Panel } from "./Panel";
import type { Problem } from "../../types";

export function ProblemPanel({ problem, solved }: { problem: Problem; solved: boolean }) {
  const description = new DOMParser().parseFromString(
    DOMPurify.sanitize(problem.description_html), "text/html",
  );
  // Remove imported spacer paragraphs while preserving images and other media.
  description.querySelectorAll("p").forEach((paragraph) => {
    if (!paragraph.textContent?.trim() && !paragraph.querySelector("img, svg, video, iframe")) {
      paragraph.remove();
    }
  });
  return (
    <Panel className={"sandbox-problem [&.sandbox-problem_.problem-title]:[font-size:26px] [&.sandbox-problem_.problem-title]:[letter-spacing:-.7px] [&.sandbox-problem_.problem-description]:[font-size:14px] [&.sandbox-problem_.problem-description]:[line-height:1.65] [@media_(max-width:_600px)]:[&.sandbox-problem]:[max-height:480px]"}>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="problem-title theme-main-text text-lg font-extrabold leading-tight">
            {problem.leetcode_id}. {problem.title}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
          <span className={`sandbox-difficulty [&.sandbox-difficulty]:[border:1px_solid_#8c9a8c] [&.sandbox-difficulty]:[border-radius:20px] [&.sandbox-difficulty]:[padding:3px_11px] [&.sandbox-difficulty]:[font-size:12px] [&.difficulty-easy]:[background:#e1f3e7] [&.difficulty-easy]:[color:#08734d] [&.difficulty-medium]:[background:#fff0bf] [&.difficulty-medium]:[color:#865b05] [&.difficulty-hard]:[background:#ffe6e8] [&.difficulty-hard]:[color:#b43a48] difficulty-${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
          {solved && <span className="text-xs font-semibold text-emerald-500">✓ Solved</span>}
          </div>
        </div>

        <div
          className="problem-description theme-body-text mt-5"
          dangerouslySetInnerHTML={{
            __html: description.body.innerHTML,
          }}
        />
      </div>
    </Panel>
  );
}
