import { DuckIcon } from "./DuckIcon";
import { useNavigate } from "react-router-dom";
import { Pill } from "./Panel";
import { UmpireTracker } from "./UmpireTracker";

interface TopBarProps {
  timer: string;
  modeLabel?: string;
  theme: "dark" | "light";
  showUmpireTracker?: boolean;
  onThemeChange: (theme: "dark" | "light") => void;
  onRun: () => void;
  onSubmit: () => void;
  running?: boolean;
}

export function TopBar({
  timer,
  modeLabel,
  theme,
  showUmpireTracker = false,
  onThemeChange,
  onRun,
  onSubmit,
  running = false,
}: TopBarProps) {
  const navigate = useNavigate();
  return (
    <header className="relative flex h-[74px] shrink-0 items-center justify-between border-b border-[var(--line)] px-5 max-[950px]:h-auto max-[950px]:min-h-[110px] max-[950px]:flex-wrap max-[950px]:gap-3 max-[950px]:px-4 max-[950px]:py-3">
      <div className="flex items-center gap-5 max-[1150px]:gap-2">
        <span className="flex items-center gap-4 text-[28px] font-extrabold tracking-[-1px] max-[1150px]:gap-2 max-[1150px]:text-[23px]"><span className="grid size-8 place-items-center rounded-full bg-[#fac52e] text-[26px] text-[#173153] max-[600px]:hidden"><DuckIcon /></span>Clario</span>
        <button onClick={() => navigate("/problems")} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-main)]">Problem List</button>
        <div role="group" aria-label="Color theme" className="ml-2 flex items-center rounded-md border border-[var(--line)] p-0.5 max-[1150px]:ml-0">
          <button
            type="button"
            title="Light mode"
            aria-label="Light mode"
            aria-pressed={theme === "light"}
            onClick={() => onThemeChange("light")}
            className={`flex h-7 w-8 items-center justify-center rounded ${theme === "light" ? "bg-[#fac52e] text-[#122b50]" : "text-[var(--text-muted)]"}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </svg>
          </button>
          <button
            type="button"
            title="Dark mode"
            aria-label="Dark mode"
            aria-pressed={theme === "dark"}
            onClick={() => onThemeChange("dark")}
            className={`flex h-7 w-8 items-center justify-center rounded ${theme === "dark" ? "bg-[#fac52e] text-[#122b50]" : "text-[var(--text-muted)]"}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2.5 max-[950px]:static max-[950px]:order-3 max-[950px]:w-full max-[950px]:translate-x-0 max-[950px]:justify-center">
        <button
          onClick={onRun}
          disabled={running}
          className="flex h-[42px] items-center gap-2 rounded-lg bg-[var(--surface)] px-5 text-sm font-medium text-[var(--text-body)] hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg width="8" height="9" viewBox="0 0 8 9" fill="currentColor"><path d="M0 0l8 4.5L0 9z" /></svg>
          {running ? "Running..." : "Run"}
        </button>
        <button
          onClick={onSubmit}
          className="h-[42px] rounded-lg border border-[var(--line)] bg-[#fac52e] px-6 text-sm font-semibold text-[#122b50]"
        >
          Submit
        </button>
      </div>

      <div className="flex items-center gap-4">
        {showUmpireTracker && <UmpireTracker />}
        <Pill className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4a8cf0]" />
          {modeLabel ? `${modeLabel} ? Live` : "Session live"}
        </Pill>
        <span className="rounded-[11px] border border-[var(--line)] bg-[var(--panel-bg)] px-[15px] py-2 font-mono text-base tabular-nums text-[var(--text-body)]">{timer}</span>
      </div>
    </header>
  );
}
