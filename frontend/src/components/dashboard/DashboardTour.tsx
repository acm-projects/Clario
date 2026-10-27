import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import DuckHead from "../layout/DuckHead";

import { dashboardTourSteps } from "./dashboardTourSteps";

type Box = { top: number; left: number; width: number; height: number };
type Position = { top: number; left: number };

export default function DashboardTour({ step, onStep, onClose }: { step: number; onStep: (step: number) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [position, setPosition] = useState<Position>({ top: 24, left: 24 });
  const maskId = useId();
  const current = dashboardTourSteps[step];
  const last = step === dashboardTourSteps.length - 1;

  useLayoutEffect(() => {
    const candidate = document.querySelector<HTMLElement>(current.selector);
    // Compact navigation hides secondary links; highlight the visible menu instead.
    const target = candidate?.getClientRects().length ? candidate : document.getElementById("workspace-navigation");
    target?.scrollIntoView({ behavior: "instant", block: "center", inline: "nearest" });
    const update = () => {
      const bounds = target?.getBoundingClientRect();
      const width = Math.min(380, window.innerWidth - 32);
      const height = dialog.current?.offsetHeight ?? 340;
      const small = window.innerWidth < 768;
      const nextBox = bounds ? { top: bounds.top - 7, left: bounds.left - 7, width: bounds.width + 14, height: bounds.height + 14 } : null;
      setBox(nextBox);
      let left = (window.innerWidth - width) / 2;
      let top = window.innerHeight - height - 16;
      if (!small && nextBox) {
        if (nextBox.left + nextBox.width + width + 40 < window.innerWidth) {
          left = nextBox.left + nextBox.width + 20;
          top = nextBox.top + (nextBox.height - height) / 2;
        } else if (nextBox.left > width + 40) {
          left = nextBox.left - width - 20;
          top = nextBox.top + (nextBox.height - height) / 2;
        } else {
          left = nextBox.left + (nextBox.width - width) / 2;
          top = nextBox.top + nextBox.height + height + 32 < window.innerHeight ? nextBox.top + nextBox.height + 20 : nextBox.top - height - 20;
        }
      }
      setPosition({ top: Math.max(16, Math.min(top, window.innerHeight - height - 16)), left: Math.max(16, Math.min(left, window.innerWidth - width - 16)) });
    };
    update();
    const observer = new ResizeObserver(update);
    if (target) observer.observe(target);
    if (dialog.current) observer.observe(dialog.current);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    dialog.current?.focus({ preventScroll: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [current]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  return createPortal(<div className="fixed inset-0 z-[1000] isolate font-sans text-[#182137]">
    <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs><mask id={maskId}><rect width="100%" height="100%" fill="white" />{box && <rect {...{ x: box.left, y: box.top, width: box.width, height: box.height }} rx="24" fill="black" />}</mask></defs>
      <rect width="100%" height="100%" fill="#101a35" fillOpacity=".65" mask={`url(#${maskId})`} />
      {box && <rect x={box.left} y={box.top} width={box.width} height={box.height} rx="24" fill="none" stroke="#ffdf4f" strokeWidth="3" />}
    </svg>
    <div ref={dialog} id="dashboard-tour" role="dialog" aria-modal="true" aria-labelledby="dashboard-tour-title" aria-describedby="dashboard-tour-copy" tabIndex={-1}
      style={position} className="absolute flex max-h-[calc(100dvh-32px)] w-[min(380px,calc(100vw-32px))] flex-col overflow-y-auto rounded-[28px] border border-white/70 bg-[#fffdf8] shadow-[0_24px_90px_#08112b66] outline-none max-md:max-h-[48dvh]"
      onKeyDown={event => {
        if (event.key === "Escape") { event.preventDefault(); onClose(); }
        if (event.key === "ArrowRight") { event.preventDefault(); if (!last) onStep(step + 1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); if (step > 0) onStep(step - 1); }
        if (event.key === "Tab") {
          const buttons = Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
          const first = buttons[0], final = buttons[buttons.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); final?.focus(); }
          else if (!event.shiftKey && (document.activeElement === final || document.activeElement === dialog.current)) { event.preventDefault(); first?.focus(); }
        }
      }}>
      <div className="flex items-center gap-3 rounded-t-[28px] bg-[#4566ed] px-6 py-4 text-white">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#ffdf4f]"><DuckHead className="size-10" /></span>
        <div className="flex-1"><p className="text-sm font-semibold">Quick tour</p><p className="mt-0.5 text-xs text-white/75">Your dashboard at a glance</p></div>
        <button type="button" aria-label="Close dashboard tour" onClick={onClose} className="grid size-10 cursor-pointer place-items-center rounded-full bg-white/10 text-2xl hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white">×</button>
      </div>
      <div className="p-6" aria-live="polite" aria-atomic="true">
        <p className="text-[10px] font-bold tracking-[.16em] text-[#4566ed]">{current.tag}</p>
        <h2 id="dashboard-tour-title" className="mt-3 text-[25px] font-semibold leading-tight tracking-tight">{current.title}</h2>
        <p id="dashboard-tour-copy" className="mt-3 text-sm leading-6 text-[#626b80]">{current.copy}</p>
      </div>
      <div className="px-6 pb-5">
        <div className="mb-4 flex items-center gap-1.5" role="group" aria-label="Tour stops">
          {dashboardTourSteps.map((item, index) => <button key={index} type="button" aria-label={`Step ${index + 1}: ${item.title}`} aria-current={index === step ? "step" : undefined} onClick={() => onStep(index)} className="group flex min-h-6 flex-1 cursor-pointer items-center rounded-full focus-visible:outline-2 focus-visible:outline-[#4566ed]"><span className={`h-1.5 w-full rounded-full transition-colors motion-reduce:transition-none ${index === step ? "bg-[#4566ed]" : index < step ? "bg-[#a6b5ff]" : "bg-[#e5e7ef] group-hover:bg-[#c4cefa]"}`} /></button>)}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs tabular-nums text-[#687087]">{String(step + 1).padStart(2, "0")} / {String(dashboardTourSteps.length).padStart(2, "0")}</span>
          <div className="flex gap-2"><button type="button" disabled={step === 0} onClick={() => onStep(step - 1)} className="min-h-11 cursor-pointer rounded-xl px-3 text-sm font-medium hover:bg-[#e9edff] disabled:cursor-default disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-[#4566ed]">Back</button><button type="button" onClick={() => last ? onClose() : onStep(step + 1)} className="min-h-11 cursor-pointer rounded-xl bg-[#4566ed] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#3054d6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4566ed]">{last ? "Done" : "Next"} <span aria-hidden="true">↗</span></button></div>
        </div>
        <p className="mt-3 text-center text-[10px] text-[#8990a0]">← → to explore · Esc to leave</p>
      </div>
    </div>
  </div>, document.body);
}
