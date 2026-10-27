import type { ReactNode } from "react";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`theme-panel flex min-h-0 flex-col overflow-hidden rounded-xl border ${className}`}
    >
      {children}
    </section>
  );
}

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`theme-surface theme-body-text rounded-full px-3 py-1 text-xs ${className}`}>
      {children}
    </span>
  );
}
