import { TopBar } from "./TopBar";
import { ProblemPanel } from "./ProblemPanel";
import { TestResultPanel } from "./TestResultPanel";
import { CodePanel } from "./CodePanel";
import { VideoCallPanel } from "./VideoCallPanel";
import { problem, session } from "./data";

function Wave() {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[44px] w-full"
      viewBox="0 0 1440 44"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d="M0 18 C 180 40, 320 0, 560 14 S 980 40, 1200 12 S 1400 8, 1440 16 V44 H0Z" fill="#1c3d73" opacity="0.55" />
      <path d="M0 28 C 220 10, 420 44, 700 28 S 1100 6, 1440 30 V44 H0Z" fill="#2c5ba8" />
    </svg>
  );
}

export default function InterviewPage() {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#0a1120] text-[#e6ebf5]">
      <TopBar timer={session.timer} onRun={() => {}} onSubmit={() => {}} />

      <main className="grid min-h-0 flex-1 grid-cols-[360px_minmax(0,1fr)_300px] gap-3 pb-12 pt-3">
        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_165px] gap-3">
          <ProblemPanel problem={problem} solved={session.solved} />
          <TestResultPanel testcases={problem.example_testcases} />
        </div>
        <CodePanel starterCode={problem.starter_code} />
        <VideoCallPanel round={session.round} interviewer={session.interviewer} />
      </main>

      <Wave />
    </div>
  );
}
