import { interviewModes, modeLabels, type InterviewMode } from "../../lib/interviewModes";

// Repeat across a two-column grid: blue/white, then white/yellow.
const palettes = [
  { card: "border-[#c5c8ce] bg-[#3054ed] text-white", badge: "bg-white/15 text-white", copy: "text-[#dce3ff]" },
  { card: "border-[#c5c8ce] bg-[#fffdf8] text-[#182137]", badge: "bg-[#e9edff] text-[#3054ed]", copy: "text-[#687087]" },
  { card: "border-[#c5c8ce] bg-[#fffdf8] text-[#182137]", badge: "bg-[#e9edff] text-[#3054ed]", copy: "text-[#687087]" },
  { card: "border-[#c5c8ce] bg-[#ffdf4f] text-[#182137]", badge: "bg-[#182137] text-[#ffdf4f]", copy: "text-[#746329]" },
];

export default function InterviewModeGrid({ descriptions, onChoose, disabled }: { descriptions: Record<InterviewMode, string>; onChoose: (mode: InterviewMode | "repo_debugging") => void; disabled: boolean }) {
  const options = [...interviewModes, "repo_debugging"] as const;
  const actions = { recommended: "Review your recommendation", custom: "Explore the library", surprise_me: "Set up a surprise interview", company: "Choose a company", repo_debugging: "Choose a repository" };
  return <section aria-label="Interview mode selector" className="grid grid-cols-1 gap-5 sm:grid-cols-2">
    {options.map((mode, index) => {
      const palette = palettes[index % palettes.length];
      return <button key={mode} type="button" disabled={disabled} onClick={() => onChoose(mode)} className={`flex min-h-[330px] min-w-0 flex-col rounded-[30px] border p-7 text-left shadow-[0_12px_32px_-24px_#18213730] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_18px_32px_-20px_#18213735] motion-reduce:transform-none motion-reduce:transition-none sm:p-9 ${palette.card}`}>
        <span className={`grid size-11 place-items-center rounded-full font-mono text-xs font-semibold ${palette.badge}`}>{String(index + 1).padStart(2, "0")}</span>
        <h2 className="mb-4 mt-7 text-[30px] font-medium leading-tight tracking-[-.045em]">{mode === "repo_debugging" ? "Repo Debugging" : modeLabels[mode]}</h2>
        <p className={`mb-8 text-sm leading-7 ${palette.copy}`}>{mode === "repo_debugging" ? "Debug a real-world codebase, fix bugs, and test your solution in a repository-based coding interview." : descriptions[mode]}</p>
        <span className="mt-auto flex w-full items-center justify-between gap-5 pt-3 text-sm font-semibold">{actions[mode]}<span aria-hidden="true">&#8594;</span></span>
      </button>;
    })}
  </section>;
}
