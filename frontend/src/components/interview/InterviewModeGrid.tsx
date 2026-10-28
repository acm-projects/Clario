import { interviewModes, modeLabels, type InterviewMode } from "../../lib/interviewModes";
// Share the same palettes and interaction styles across all six rounds.
const palettes = [
  { card: "border-[#c5c8ce] bg-[#3054ed] text-white", badge: "bg-white/15 text-white", copy: "text-[#dce3ff]" },
  { card: "border-[#c5c8ce] bg-[#fffdf8] text-[#182137]", badge: "bg-[#e9edff] text-[#3054ed]", copy: "text-[#687087]" },
  { card: "border-[#c5c8ce] bg-[#fffdf8] text-[#182137]", badge: "bg-[#e9edff] text-[#3054ed]", copy: "text-[#687087]" },
  { card: "border-[#c5c8ce] bg-[#ffdf4f] text-[#182137]", badge: "bg-[#182137] text-[#ffdf4f]", copy: "text-[#746329]" },
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
      const palette = palettes[index % palettes.length];
      const card = mode === "repo_debugging" || mode === "system_design"
        ? practiceCards[mode]
        : { title: modeLabels[mode], badge: "Coding", description: descriptions[mode], action: actions[mode] };
      return <button key={mode} type="button" disabled={disabled} onClick={() => onChoose(mode)} className={`flex h-full min-h-[330px] min-w-0 flex-col rounded-[30px] border p-7 text-left shadow-[0_12px_32px_-24px_#18213730] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_18px_32px_-20px_#18213735] motion-reduce:transform-none motion-reduce:transition-none sm:p-9 ${palette.card}`}>
        <span className="flex w-full flex-wrap items-center gap-2">
          <span aria-hidden="true" className={`grid size-11 place-items-center rounded-full font-mono text-xs font-semibold ${palette.badge}`}>{String(index + 1).padStart(2, "0")}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${palette.badge}`}>{card.badge}</span>

        </span>
        <h2 className="mb-4 mt-7 text-[30px] font-medium leading-tight tracking-[-.045em]">{card.title}</h2>
        <p className={`mb-8 text-sm leading-7 ${palette.copy}`}>{card.description}</p>
        <span className="mt-auto flex w-full items-center justify-between gap-5 pt-3 text-sm font-semibold">{card.action}<span aria-hidden="true">&#8594;</span></span>
      </button>;
    })}
  </section>;
}
