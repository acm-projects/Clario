import { useEffect, useRef, useState, type ReactNode } from "react";

interface ResizableSplitProps {
  direction: "horizontal" | "vertical";
  storageKey: string;
  initialSize: number;
  label: string;
  first: ReactNode;
  second: ReactNode;
}

const clamp = (value: number) => Math.min(85, Math.max(15, value));

export function ResizableSplit({
  direction, storageKey, initialSize, label, first, second,
}: ResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<number | null>(null);
  const [size, setSize] = useState(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      const value = saved === null ? initialSize : Number(saved);
      return Number.isFinite(value) ? clamp(value) : initialSize;
    } catch {
      return initialSize;
    }
  });
  const horizontal = direction === "horizontal";

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, String(size));
    } catch {
      // Resizing still works when browser storage is unavailable.
    }
  }, [size, storageKey]);

  return (
    <div
      ref={containerRef}
      className={`resizable-split resizable-split-${direction} grid h-full min-h-0 min-w-0`}
      style={horizontal
        ? { gridTemplateColumns: `minmax(0, ${size}fr) 12px minmax(0, ${100 - size}fr)` }
        : { gridTemplateRows: `minmax(0, ${size}fr) 12px minmax(0, ${100 - size}fr)` }}
    >
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden [&>section]:flex-1">{first}</div>
      <div
        role="separator"
        tabIndex={0}
        aria-label={label}
        aria-orientation={horizontal ? "vertical" : "horizontal"}
        aria-valuemin={15}
        aria-valuemax={85}
        aria-valuenow={Math.round(size)}
        title="Drag or use arrow keys to resize; double-click to reset"
        className={`group flex touch-none items-center justify-center rounded select-none outline-none hover:bg-[var(--surface)] focus-visible:bg-[var(--surface)] focus-visible:ring-2 focus-visible:ring-[#2f6fd0] ${horizontal ? "cursor-col-resize" : "cursor-row-resize"}`}
        onDoubleClick={() => setSize(initialSize)}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          draggingRef.current = event.pointerId;
        }}
        onPointerMove={(event) => {
          if (draggingRef.current !== event.pointerId) return;
          const bounds = containerRef.current?.getBoundingClientRect();
          if (!bounds) return;
          const length = (horizontal ? bounds.width : bounds.height) - 12;
          if (length <= 0) return;
          const offset = horizontal ? event.clientX - bounds.left : event.clientY - bounds.top;
          setSize(clamp(((offset - 6) / length) * 100));
        }}
        onPointerUp={(event) => {
          draggingRef.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={() => { draggingRef.current = null; }}
        onLostPointerCapture={() => { draggingRef.current = null; }}
        onKeyDown={(event) => {
          const backward = horizontal ? "ArrowLeft" : "ArrowUp";
          const forward = horizontal ? "ArrowRight" : "ArrowDown";
          if (event.key === backward || event.key === forward) {
            event.preventDefault();
            setSize((current) => clamp(current + (event.key === forward ? 2 : -2)));
          } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            setSize(event.key === "Home" ? 15 : 85);
          }
        }}
      >
        <span className={`rounded-full bg-[var(--line)] group-hover:bg-[#2f6fd0] group-focus-visible:bg-[#2f6fd0] ${horizontal ? "h-8 w-1" : "h-1 w-8"}`} />
      </div>
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden [&>section]:flex-1">{second}</div>
    </div>
  );
}