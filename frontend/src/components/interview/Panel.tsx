import type { ReactNode } from "react";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--panel-bg)] ${className}`}
    >
      {children}
    </section>
  );
}

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`rounded-full bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text-body)] ${className}`}>
      {children}
    </span>
  );
}
