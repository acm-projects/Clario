import { useEffect, useRef, useState, type ReactNode } from "react";

interface ResizableSplitProps {
  direction: "horizontal" | "vertical";
  storageKey: string;
  initialSize: number;
  label: string;
  size?: number;
  onSizeChange?: (size: number) => void;
  first: ReactNode;
  second: ReactNode;
}

const clamp = (value: number) => Math.min(85, Math.max(15, value));

export function ResizableSplit({
  direction, storageKey, initialSize, label, first, second, size: controlledSize, onSizeChange,
}: ResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<number | null>(null);
  const [internalSize, setInternalSize] = useState(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      const value = saved === null ? initialSize : Number(saved);
      return Number.isFinite(value) ? clamp(value) : initialSize;
    } catch {
      return initialSize;
    }
  });
  const size = controlledSize ?? internalSize;
  const setSize = (next: number) => {
    setInternalSize(next);
    onSizeChange?.(next);
  };
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
      className={`resizable-split [&.resizable-split_>_div_>_.resizable-split]:[flex:1] [&.resizable-split_.sandbox-call]:[flex:1] [&.resizable-split_.sandbox-call]:[min-width:0] [&.resizable-split_.sandbox-call]:[overflow:hidden] [&.resizable-split_.sandbox-results]:[max-height:none] [&.resizable-split_.sandbox-problem]:[border-radius:18px] [&.resizable-split_.sandbox-problem]:[min-width:0] [&.resizable-split_.sandbox-code]:[border-radius:18px] [&.resizable-split_.sandbox-code]:[min-width:0] [&.resizable-split_.sandbox-problem_nav]:[flex-wrap:wrap] [&.resizable-split_.sandbox-call-heading]:[flex-wrap:wrap] [&.resizable-split_.sandbox-cases]:[grid-template-columns:repeat(auto-fit,_minmax(150px,_1fr))] [&.resizable-split_.sandbox-video_>_div:last-child]:[flex-wrap:wrap] [@media_(max-width:_950px)]:[&.resizable-split_.sandbox-call]:[min-height:440px] [@media_(max-width:_600px)]:[&.resizable-split-horizontal]:[grid-template-columns:minmax(0,_1fr)]! [@media_(max-width:_600px)]:[&.resizable-split-horizontal_>_[role="separator"]]:[display:none] [@media_(max-width:_600px)]:[&.resizable-split-vertical_>_div:first-child_>_.resizable-split-horizontal]:[grid-template-rows:minmax(0,_1fr)_minmax(0,_1fr)] [@media_(max-width:_600px)]:[&.resizable-split-vertical_>_div:first-child_>_.resizable-split-horizontal]:[gap:12px] [@media_(max-width:_600px)]:[&.resizable-split_.sandbox-code]:[min-height:0] resizable-split-${direction} grid h-full min-h-0 min-w-0`}
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
            setSize(clamp(size + (event.key === forward ? 2 : -2)));
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