const fakeSteps = {
  understand: "done",
  match: "skipped",
  plan: "done",
  implement: "current",
  review: "todo",
  evaluate: "todo",
} as const;

const steps = [
  { letter: "U", name: "Understand", key: "understand" },
  { letter: "M", name: "Match", key: "match" },
  { letter: "P", name: "Plan", key: "plan" },
  { letter: "I", name: "Implement", key: "implement" },
  { letter: "R", name: "Review", key: "review" },
  { letter: "E", name: "Evaluate", key: "evaluate" },
] as const;

const stateStyles = {
  done: "bg-[#2f6fd0] text-white",
  current: "bg-[#bfdbfe] text-[#1e3a8a] ring-2 ring-[#60a5fa] ring-offset-1 ring-offset-[var(--page-bg)]",
  skipped: "bg-gray-500 text-white",
  todo: "bg-transparent text-[var(--text-muted)] border border-[var(--line)]",
} as const;

export function UmpireTracker() {
  return (
    <div role="group" aria-label="UMPIRE interview steps" className="flex shrink-0 items-center gap-1">
      {steps.map(({ letter, name, key }) => {
        const state = fakeSteps[key];
        return (
          <span
            key={key}
            title={name}
            aria-label={`${name}: ${state}`}
            aria-current={state === "current" ? "step" : undefined}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${stateStyles[state]}`}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
}
