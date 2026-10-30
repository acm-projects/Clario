import BrandMark from "../layout/BrandMark";
import { useNavigate } from "react-router-dom";
import { Pill } from "./Panel";

interface TopBarProps {
  timer: string;
  modeLabel?: string;
  onRun: () => void;
  onSubmit: () => void;
  running?: boolean;
  listLabel?: string;
  listPath?: string;
  runLabel?: string;
  showBrand?: boolean;
}

export function TopBar({
  timer,
  modeLabel,
  onRun,
  onSubmit,
  running = false,
  listLabel = "Problem List",
  listPath = "/problems",
  runLabel = "Run",
  showBrand = true,
}: TopBarProps) {
  const navigate = useNavigate();
  return (
    <header className="theme-border relative flex h-[74px] shrink-0 items-center justify-between border-b px-5">
      <div className="flex items-center gap-5">
        {showBrand && <span className="flex items-center gap-2.5 font-sans text-[28px] font-semibold tracking-[-0.045em] text-[var(--text-main)] max-[1150px]:text-2xl"><BrandMark />Clario</span>}
        <button onClick={() => navigate(listPath)} className="theme-muted-text text-sm hover:text-[var(--text-main)]">{listLabel}</button>
      </div>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2.5">
        <button
          data-sandbox-run
          title="Run test cases"
          onClick={onRun}
          disabled={running}
          className="theme-surface theme-body-text theme-surface-hover flex h-[42px] items-center gap-2 rounded-lg px-5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg width="8" height="9" viewBox="0 0 8 9" fill="currentColor"><path d="M0 0l8 4.5L0 9z" /></svg>
          {running ? "Running..." : runLabel}
        </button>
        <button
          disabled={running}
          onClick={onSubmit}
          title="Send your current code to the interviewer for review"
          className="h-[42px] rounded-lg border border-[var(--line)] bg-[#fac52e] px-6 text-sm font-semibold text-[#122b50] disabled:opacity-50"
        >
          Submit
        </button>
      </div>

      <div className="flex items-center gap-4">
        <Pill className="theme-surface theme-body-text flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4a8cf0]" />
          {modeLabel ?? "Session live"}
        </Pill>
        <span className={"sandbox-timer [&.sandbox-timer]:[border:1px_solid_var(--line)] [&.sandbox-timer]:[border-radius:11px] [&.sandbox-timer]:[background:var(--panel-bg)] [&.sandbox-timer]:[padding:8px_15px] [&.sandbox-timer]:[font-family:monospace] [&.sandbox-timer]:[font-size:16px] theme-body-text text-sm tabular-nums"}>{timer}</span>
      </div>
    </header>
  );
}
