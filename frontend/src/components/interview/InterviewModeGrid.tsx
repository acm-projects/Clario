import { interviewModes, modeLabels, type InterviewMode } from "../../lib/interviewModes";
// Share the same palettes and interaction styles across all six rounds.
const palettes = [
  { card: "border-[#c5c8ce] bg-[#3054ed] text-white", badge: "bg-white/15 text-white", copy: "text-[#dce3ff]", action: "bg-white text-[#3054ed] hover:bg-[#e9edff]" },
  { card: "border-[#c5c8ce] bg-[#fffdf8] text-[#182137]", badge: "bg-[#e9edff] text-[#3054ed]", copy: "text-[#687087]", action: "bg-[#3054ed] text-white hover:bg-[#2444cf]" },
  { card: "border-[#c5c8ce] bg-[#ffdf4f] text-[#182137]", badge: "bg-[#182137] text-[#ffdf4f]", copy: "text-[#746329]", action: "bg-[#182137] text-white hover:bg-[#283550]" },
];

const practiceCards = {
  repo_debugging: {
    title: "Repo Debugging",
    badge: "Debugging",
    description: "Find and fix bugs in a real-looking codebase while explaining your thinking.",
    action: "Choose a repository",
  },
  system_design: {
    title: "System Design",
    badge: "No code",
    description: "Practice designing a system from a company scenario. Talk through requirements, architecture, scaling, and trade-offs.",
    action: "Choose a company",
  },
};

export default function InterviewModeGrid({ descriptions, onChoose, disabled }: { descriptions: Record<InterviewMode, string>; onChoose: (mode: InterviewMode | "repo_debugging" | "system_design") => void; disabled: boolean }) {

  const options = [...interviewModes, "repo_debugging", "system_design"] as const;
  const actions = { recommended: "Review your recommendation", custom: "Explore the library", surprise_me: "Set up a surprise interview", company: "Choose a company" };
  return <section aria-label="Interview mode selector" className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
    {options.map((mode, index) => {
      const palette = palettes[[0, 1, 2, 2, 0, 1][index]];
      const card = mode === "repo_debugging" || mode === "system_design"
        ? practiceCards[mode]
        : { title: modeLabels[mode], badge: "Coding", description: descriptions[mode], action: actions[mode] };
      return <article key={mode} className={`flex h-full min-h-[330px] min-w-0 flex-col rounded-[30px] border p-7 text-left shadow-[0_12px_32px_-24px_#18213730] sm:p-9 ${palette.card}`}>
        <span className="flex w-full flex-wrap items-center gap-2">
          <span aria-hidden="true" className={`grid size-11 place-items-center rounded-full font-mono text-xs font-semibold ${palette.badge}`}>{String(index + 1).padStart(2, "0")}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${palette.badge}`}>{card.badge}</span>

        </span>
        <h2 className="mb-4 mt-7 text-[30px] font-medium leading-tight tracking-[-.045em]">{card.title}</h2>
        <p className={`mb-8 text-sm leading-7 ${palette.copy}`}>{card.description}</p>
        <button type="button" disabled={disabled} onClick={() => onChoose(mode)} className={`mt-auto flex min-h-12 w-full cursor-pointer items-center justify-between gap-4 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${palette.action}`}>
          {card.action}<span aria-hidden="true">&#8594;</span>
        </button>
      </article>;
    })}
  </section>;
}
