import type { ReactNode } from "react";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#17243b] bg-[#0f1a2e] ${className}`}
    >
      {children}
    </section>
  );
}

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`rounded-full bg-[#1a2842] px-3 py-1 text-xs text-[#c3cde0] ${className}`}>
      {children}
    </span>
  );
}
