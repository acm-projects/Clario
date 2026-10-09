import { Pill } from "./Panel";

interface TopBarProps {
  timer: string;
  theme: "dark" | "light";
  onThemeChange: (theme: "dark" | "light") => void;
  onRun: () => void;
  onSubmit: () => void;
  running?: boolean;
}

export function TopBar({ timer, theme, onThemeChange, onRun, onSubmit, running = false }: TopBarProps) {
  return (
    <header className="theme-border relative flex h-[46px] shrink-0 items-center justify-between border-b px-5">
      <div className="flex items-center gap-5">
        <span className="theme-main-text text-[22px] font-medium tracking-[0.08em]">CLARIO</span>
        <button className="theme-muted-text text-sm hover:text-[var(--text-main)]">Problem List</button>
        <div role="group" aria-label="Color theme" className="theme-border flex items-center rounded-md border p-0.5">
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

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2.5">
        <button
          onClick={onRun}
          disabled={running}
          className="theme-surface theme-body-text theme-surface-hover flex h-[34px] items-center gap-2 rounded-lg px-5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg width="8" height="9" viewBox="0 0 8 9" fill="currentColor"><path d="M0 0l8 4.5L0 9z" /></svg>
          {running ? "Running..." : "Run"}
        </button>
        <button
          onClick={onSubmit}
          className="h-[34px] rounded-lg bg-[#2f6fd0] px-6 text-sm font-semibold text-white hover:bg-[#3b7ae0]"
        >
          Submit
        </button>
      </div>

      <div className="flex items-center gap-4">
        <Pill className="theme-surface theme-body-text flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4a8cf0]" />
          Session live
        </Pill>
        <span className="theme-body-text text-sm tabular-nums">{timer}</span>
      </div>
    </header>
  );
}
