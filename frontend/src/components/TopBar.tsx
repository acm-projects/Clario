import { Pill } from "./Panel";

interface TopBarProps {
  timer: string;
  onRun: () => void;
  onSubmit: () => void;
}

export function TopBar({ timer, onRun, onSubmit }: TopBarProps) {
  return (
    <header className="relative flex h-[46px] shrink-0 items-center justify-between border-b border-[#131f35] px-5">
      <div className="flex items-center gap-7">
        <span className="text-[22px] font-medium tracking-[0.08em] text-white">CLARIO</span>
        <button className="text-sm text-[#8a97ad] hover:text-white">Problem List</button>
      </div>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2.5">
        <button
          onClick={onRun}
          className="flex h-[34px] items-center gap-2 rounded-lg bg-[#1a2842] px-5 text-sm font-medium text-[#dfe6f3] hover:bg-[#22345a]"
        >
          <svg width="8" height="9" viewBox="0 0 8 9" fill="currentColor"><path d="M0 0l8 4.5L0 9z" /></svg>
          Run
        </button>
        <button
          onClick={onSubmit}
          className="h-[34px] rounded-lg bg-[#2f6fd0] px-6 text-sm font-semibold text-white hover:bg-[#3b7ae0]"
        >
          Submit
        </button>
      </div>

      <div className="flex items-center gap-4">
        <Pill className="flex items-center gap-2 bg-[#16264a] text-[#a9c4f0]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4a8cf0]" />
          Session live
        </Pill>
        <span className="text-sm tabular-nums text-[#dfe6f3]">{timer}</span>
      </div>
    </header>
  );
}
