import { DuckIcon } from "./DuckIcon";
import { useNavigate } from "react-router-dom";
import { Pill } from "./Panel";
import { UmpireTracker } from "./UmpireTracker";

interface TopBarProps {
  timer: string;
  showUmpireTracker?: boolean;
  onRun: () => void;
  onSubmit: () => void;
  running?: boolean;
}

export function TopBar({
  timer,
  showUmpireTracker = false,
  onRun,
  onSubmit,
  running = false,
}: TopBarProps) {
  const navigate = useNavigate();
  return (
    <header className="theme-border relative flex h-[74px] shrink-0 items-center justify-between border-b px-5">
      <div className="flex items-center gap-5">
        <span className="sandbox-brand"><span className="sandbox-brand-icon" aria-hidden="true"><DuckIcon /></span>Clario</span>
        <button onClick={() => navigate("/problems")} className="theme-muted-text text-sm hover:text-[var(--text-main)]">Problem List</button>

      </div>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2.5">
        <button
          onClick={onRun}
          disabled={running}
          className="theme-surface theme-body-text theme-surface-hover flex h-[42px] items-center gap-2 rounded-lg px-5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg width="8" height="9" viewBox="0 0 8 9" fill="currentColor"><path d="M0 0l8 4.5L0 9z" /></svg>
          {running ? "Running..." : "Run"}
        </button>
        <button
          onClick={onSubmit}
          className="h-[42px] rounded-lg sandbox-submit px-6 text-sm font-semibold"
        >
          Submit
        </button>
      </div>

      <div className="flex items-center gap-4">
        {showUmpireTracker && <UmpireTracker />}
        <Pill className="theme-surface theme-body-text flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4a8cf0]" />
          Session live
        </Pill>
        <span className="sandbox-timer theme-body-text text-sm tabular-nums">{timer}</span>
      </div>
    </header>
  );
}
