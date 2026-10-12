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
  current: "bg-[#4a8cf0] text-white ring-2 ring-[#9bc1ff] ring-offset-1 ring-offset-[var(--page-bg)]",
  skipped: "bg-orange-500 text-white",
  todo: "bg-gray-500 text-white",
} as const;

export function UmpireTracker() {
  return (
    <div role="group" aria-label="UMPIRE interview steps" className="flex items-center gap-1">
      {steps.map(({ letter, name, key }) => {
        const state = fakeSteps[key];
        return (
          <span
            key={key}
            title={name}
            aria-label={`${name}: ${state}`}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${stateStyles[state]}`}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
}
