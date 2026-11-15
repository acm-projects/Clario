
import { Panel } from "./Panel";
import type { SystemDesignQuestion } from "../../lib/api";

interface Props {
  question: SystemDesignQuestion;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function SystemDesignQuestionPanel({
  question,
  notes,
  onNotesChange,
}: Props) {
  return (
    <Panel className="sandbox-problem flex min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="theme-muted-text mb-2 text-xs font-semibold uppercase tracking-wide">
              {question.company} · System Design
            </p>

            <h1 className="problem-title theme-main-text text-2xl font-extrabold leading-tight">
              {question.title}
            </h1>
          </div>

          <span
            className={`sandbox-difficulty difficulty-${question.difficulty.toLowerCase()} rounded-full px-3 py-1 text-xs font-semibold`}
          >
            {question.difficulty}
          </span>
        </div>

        <div className="theme-body-text mt-6 whitespace-pre-wrap text-sm leading-7">
          {question.prompt}
        </div>

        <div className="mt-8">
          <h2 className="theme-main-text mb-2 text-lg font-semibold">
            Design Notes
          </h2>

          <p className="theme-muted-text mb-3 text-xs">
            Capture your architecture, components, APIs, database design,
            and trade-offs during the interview.
          </p>

          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Start outlining your system design..."
            rows={10}
            className="theme-main-text w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--panel-bg)] p-4 text-sm leading-6 outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </Panel>
  );
}
