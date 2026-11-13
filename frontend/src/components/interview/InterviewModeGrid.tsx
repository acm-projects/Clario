import { interviewModes, modeLabels, type InterviewMode } from "../../lib/interviewModes";
// Shared cards for the three interview paths and the coding mode picker.
const palettes = [
  { card: "border-[#c5c8ce] bg-[#3054ed] text-white", badge: "bg-white/15 text-white", copy: "text-[#dce3ff]", action: "bg-white text-[#3054ed] hover:bg-[#e9edff]" },
  { card: "border-[#c5c8ce] bg-[#fffdf8] text-[#182137]", badge: "bg-[#e9edff] text-[#3054ed]", copy: "text-[#687087]", action: "bg-[#3054ed] text-white hover:bg-[#2444cf]" },
  { card: "border-[#c5c8ce] bg-[#ffdf4f] text-[#182137]", badge: "bg-[#182137] text-[#ffdf4f]", copy: "text-[#746329]", action: "bg-[#182137] text-white hover:bg-[#283550]" },
];

const practiceCards = {
  coding: {
    title: "Coding Interview",
    badge: "Coding",
    description: "Solve a coding challenge and talk through your approach. Choose Recommended, Custom, Surprise Me, or Company next.",
    action: "Choose a coding mode",
    features: ["Recommended", "Custom", "Surprise Me", "Company"],
  },
  repo_debugging: {
    title: "Repo Debugging",
    badge: "Debugging",
    description: "Find and fix bugs in a real-looking codebase while explaining your thinking.",
    action: "Choose a repository",
    features: ["Explore files", "Find bugs", "Run tests"],
  },
  system_design: {
    title: "System Design",
    badge: "No code",
    description: "Practice designing a system from a company scenario. Talk through requirements, architecture, scaling, and trade-offs.",
    action: "Choose a company",
    features: ["Architecture", "Scaling", "Trade-offs"],
  },
};

type InterviewPath = "coding" | "repo_debugging" | "system_design";
export default function InterviewModeGrid({ descriptions, onChoose, disabled, coding = false }: { descriptions: Record<InterviewMode, string>; onChoose: (mode: InterviewMode | InterviewPath) => void; disabled: boolean; coding?: boolean }) {

  const options: readonly (InterviewMode | InterviewPath)[] = coding ? interviewModes : ["coding", "repo_debugging", "system_design"];
  const actions = { recommended: "Review your recommendation", custom: "Explore the library", surprise_me: "Set up a surprise interview", company: "Choose a company" };
  return <section aria-label={coding ? "Coding mode selector" : "Interview mode selector"} className={`grid grid-cols-1 items-stretch gap-6 ${coding ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
    {options.map((mode, index) => {
      const palette = palettes[index % palettes.length];
      const card = mode === "coding" || mode === "repo_debugging" || mode === "system_design"
        ? practiceCards[mode]
        : { title: modeLabels[mode], badge: "Coding", description: descriptions[mode], action: actions[mode] };
      const path = mode === "coding" || mode === "repo_debugging" || mode === "system_design" ? mode : null;
      return <article key={mode} className={`relative flex h-full min-w-0 flex-col rounded-[30px] border p-6 text-left shadow-[0_12px_32px_-24px_#18213730] transition-shadow hover:shadow-[0_16px_36px_-20px_#18213745] lg:p-8 ${coding ? "min-h-[360px]" : "min-h-[500px] md:min-h-[min(640px,70svh)]"} ${palette.card}`}>
        <span className="flex w-full flex-wrap items-center gap-2">
          <span aria-hidden="true" className={`grid size-11 place-items-center rounded-full font-mono text-xs font-semibold ${palette.badge}`}>{String(index + 1).padStart(2, "0")}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${palette.badge}`}>{card.badge}</span>

        </span>
        <h2 className={`mb-4 text-[clamp(26px,2.8vw,38px)] font-semibold leading-tight tracking-[-.045em] mt-7`}>{card.title}</h2>
        <p className={`text-sm leading-7 ${palette.copy} ${coding ? "mb-8" : "mb-5"}`}>{card.description}</p>
        {path && <ul className="mb-8 flex flex-wrap gap-2" aria-label={`${card.title} options`}>{practiceCards[path].features.map(feature => <li key={feature} className={`rounded-full px-3 py-1.5 text-xs font-medium ${palette.badge}`}>{feature}</li>)}</ul>}
        <button type="button" disabled={disabled} onClick={() => onChoose(mode)} className={`mt-auto flex min-h-12 w-full cursor-pointer items-center justify-between gap-4 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors after:absolute after:inset-0 after:rounded-[30px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${palette.action}`}>
          {card.action}<span aria-hidden="true">&#8594;</span>
        </button>
      </article>;
    })}
  </section>;
}
