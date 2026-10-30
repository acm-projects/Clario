import { useEffect, useState } from "react";
import BrandMark from "../layout/BrandMark";
import { useNavigate } from "react-router-dom";
import { Pill } from "./Panel";

interface TopBarProps {
  timer: string;
  startedAt?: number;
  endedAt?: number;
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
  startedAt,
  endedAt,
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
    <header className="relative flex h-[74px] shrink-0 items-center justify-between px-5 max-[1250px]:h-auto max-[1250px]:min-h-[74px] max-[1250px]:flex-wrap max-[1250px]:gap-3 max-[1250px]:py-3">
      <div className="flex items-center gap-5">
        {showBrand && <span className="flex items-center gap-2.5 font-sans text-[28px] font-semibold tracking-[-0.045em] text-[var(--text-main)] max-[1150px]:text-2xl"><BrandMark />Clario</span>}
        <button onClick={() => navigate(listPath)} className="theme-muted-text text-sm hover:text-[var(--text-main)]">{listLabel}</button>
      </div>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2.5">
        <button
          data-sandbox-run
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
        <span className={"sandbox-timer [&.sandbox-timer]:[border:0] [&.sandbox-timer]:[border-radius:11px] [&.sandbox-timer]:[background:var(--sandbox-blue)] [&.sandbox-timer]:[color:#fff] [&.sandbox-timer]:[padding:8px_15px] [&.sandbox-timer]:[font-family:monospace] [&.sandbox-timer]:[font-size:16px] text-sm tabular-nums"}>{startedAt === undefined ? timer : <ElapsedTime startedAt={startedAt} endedAt={endedAt} />}</span>
      </div>
    </header>
  );
}

function ElapsedTime({ startedAt, endedAt }: { startedAt: number; endedAt?: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (endedAt !== undefined) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [endedAt]);
  const seconds = Math.max(0, Math.floor(((endedAt ?? now) - startedAt) / 1000));
  const minutes = Math.floor(seconds / 60);
  return <span role="timer" aria-label="Elapsed interview time">{String(minutes).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</span>;
}
