import BrandMark from "../layout/BrandMark";
import { useNavigate } from "react-router-dom";
import { Pill } from "./Panel";
import { UmpireTracker } from "./UmpireTracker";

interface TopBarProps {
  timer: string;
  modeLabel?: string;
  theme: "dark" | "light";
  onThemeChange: (theme: "dark" | "light") => void;
  onRun: () => void;
  onSubmit: () => void;
  running?: boolean;
}

export function TopBar({
  timer,
  modeLabel,
  theme,
  onThemeChange,
  onRun,
  onSubmit,
  running = false,
}: TopBarProps) {
  const navigate = useNavigate();
  return (
    <header className="theme-border relative flex h-[74px] shrink-0 items-center justify-between border-b px-5 max-[1250px]:h-auto max-[1250px]:min-h-[74px] max-[1250px]:flex-wrap max-[1250px]:gap-3 max-[1250px]:py-3">
      <div className="flex items-center gap-5">
        <span className="flex items-center gap-2.5 font-sans text-[28px] font-semibold tracking-[-0.045em] text-[var(--text-main)] max-[1150px]:text-2xl"><BrandMark />Clario</span>
        <button onClick={() => navigate("/problems")} className="theme-muted-text text-sm hover:text-[var(--text-main)]">Problem List</button>
        <div role="group" aria-label="Color theme" className={"sandbox-theme-toggle [&.sandbox-theme-toggle]:[margin-left:8px] [@media_(max-width:_1150px)]:[&.sandbox-theme-toggle]:[margin-left:0] [@media_(max-width:_600px)]:[&.sandbox-theme-toggle]:[display:flex] theme-border flex items-center rounded-md border p-0.5"}>
          <button
            type="button"
            title="Light mode"
            aria-label="Light mode"
            aria-pressed={theme === "light"}
            onClick={() => onThemeChange("light")}
            className={`flex h-7 w-8 items-center justify-center rounded ${theme === "light" ? "theme-surface theme-main-text" : "theme-muted-text"}`}
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
            className={`flex h-7 w-8 items-center justify-center rounded ${theme === "dark" ? "theme-surface theme-main-text" : "theme-muted-text"}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2.5 max-[1250px]:static max-[1250px]:order-3 max-[1250px]:w-full max-[1250px]:translate-x-0 max-[1250px]:justify-center">
        <button
          onClick={onRun}
          disabled={running}
          className="theme-surface theme-body-text theme-surface-hover flex h-[42px] items-center gap-2 rounded-lg px-5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg width="8" height="9" viewBox="0 0 8 9" fill="currentColor"><path d="M0 0l8 4.5L0 9z" /></svg>
          {running ? "Running..." : "Run"}
        </button>
        <button
          disabled={running}
          onClick={onSubmit}
          className="h-[42px] rounded-lg border border-[var(--line)] bg-[#fac52e] px-6 text-sm font-semibold text-[#122b50] disabled:opacity-50"
        >
          Submit
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <UmpireTracker />
        <Pill className="theme-surface theme-body-text flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4a8cf0]" />
          {modeLabel ?? "Session live"}
        </Pill>
        <span className={"sandbox-timer [&.sandbox-timer]:[border:1px_solid_var(--line)] [&.sandbox-timer]:[border-radius:11px] [&.sandbox-timer]:[background:var(--panel-bg)] [&.sandbox-timer]:[padding:8px_15px] [&.sandbox-timer]:[font-family:monospace] [&.sandbox-timer]:[font-size:16px] theme-body-text text-sm tabular-nums"}>{timer}</span>
      </div>
    </header>
  );
}
