import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import DuckHead from "../layout/DuckHead";

import { dashboardTourSteps } from "./dashboardTourSteps";

type Box = { top: number; left: number; width: number; height: number };
type Position = { top: number; left: number; maxHeight?: number };

export default function DashboardTour({ step, onStep, onClose }: { step: number; onStep: (step: number) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [position, setPosition] = useState<Position>({ top: 24, left: 24 });
  const maskId = useId();
  const current = dashboardTourSteps[step];
  const last = step === dashboardTourSteps.length - 1;

  useLayoutEffect(() => {
    // Give the last dashboard sections room to scroll above a bottom-docked tour.
    const spacer = document.createElement("div");
    spacer.setAttribute("aria-hidden", "true");
    spacer.style.height = "100dvh";
    spacer.style.pointerEvents = "none";
    document.body.append(spacer);
    const scrollX = window.scrollX, scrollY = window.scrollY;
    return () => {
      spacer.remove();
      window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
    };
  }, []);

  useLayoutEffect(() => {
    if (copy.current) copy.current.scrollTop = 0;
    const candidate = document.querySelector<HTMLElement>(current.selector);
    // Compact navigation hides secondary links; highlight the visible menu instead.
    const target = candidate?.getClientRects().length ? candidate : document.getElementById("workspace-navigation");
    const update = (reveal = false) => {
      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const width = Math.min(380, viewportWidth - 32);
      let bounds = target?.getBoundingClientRect();
      const beside = viewportWidth >= 768 && bounds && (bounds.right + width + 43 <= viewportWidth || bounds.left >= width + 43);
      const maxHeight = beside ? viewportHeight - 32 : Math.floor((viewportHeight - 32) * .55);
      if (dialog.current) dialog.current.style.maxHeight = `${maxHeight}px`;
      const height = dialog.current?.offsetHeight ?? Math.min(340, maxHeight);
      if (reveal && target) {
        target.scrollIntoView({ behavior: "instant", block: "center", inline: "nearest" });
        bounds = target.getBoundingClientRect();
        if (!beside) {
          // Reserve the lower part of the screen for the tour instead of covering the target.
          const availableHeight = Math.max(48, viewportHeight - height - 64);
          window.scrollBy({ top: bounds.top - 16 - Math.max(0, (availableHeight - bounds.height) / 2), behavior: "instant" });
        }
      }
      bounds = target?.getBoundingClientRect();
      let left = (viewportWidth - width) / 2;
      let top = viewportHeight - height - 16;
      if (beside && bounds) {
        left = bounds.right + width + 43 <= viewportWidth ? bounds.right + 27 : bounds.left - width - 27;
        top = bounds.top + (bounds.height - height) / 2;
      }
      top = Math.max(16, Math.min(top, viewportHeight - height - 16));
      setPosition({ top, left: Math.max(16, Math.min(left, viewportWidth - width - 16)), maxHeight });
      const boxTop = Math.max(4, (bounds?.top ?? 0) - 7);
      const boxLeft = Math.max(4, (bounds?.left ?? 0) - 7);
      const boxBottom = Math.min(viewportHeight - 4, beside ? viewportHeight - 4 : top - 16, (bounds?.bottom ?? 0) + 7);
      const boxRight = Math.min(viewportWidth - 4, (bounds?.right ?? 0) + 7);
      setBox(bounds && boxBottom > boxTop && boxRight > boxLeft ? { top: boxTop, left: boxLeft, width: boxRight - boxLeft, height: boxBottom - boxTop } : null);
    };
    update(true);
    const onResize = () => update(true);
    const onScroll = () => update();
    const observer = new ResizeObserver(onResize);
    if (target) observer.observe(target);
    if (dialog.current) observer.observe(dialog.current);
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    dialog.current?.focus({ preventScroll: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [current]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    const background = Array.from(document.body.children).filter((element): element is HTMLElement => element instanceof HTMLElement && !element.contains(dialog.current));
    const inertStates = background.map(element => element.inert);
    background.forEach(element => { element.inert = true; });
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      background.forEach((element, index) => { element.inert = inertStates[index]; });
    };
  }, []);

  return createPortal(<div className="fixed inset-0 z-[1000] isolate font-sans text-[#182137]">
    <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs><mask id={maskId}><rect width="100%" height="100%" fill="white" />{box && <rect {...{ x: box.left, y: box.top, width: box.width, height: box.height }} rx="24" fill="black" />}</mask></defs>
      <rect width="100%" height="100%" fill="#101a35" fillOpacity=".65" mask={`url(#${maskId})`} />
      {box && <rect x={box.left} y={box.top} width={box.width} height={box.height} rx="24" fill="none" stroke="#ffdf4f" strokeWidth="3" />}
    </svg>
    <div ref={dialog} id="dashboard-tour" role="dialog" aria-modal="true" aria-labelledby="dashboard-tour-title" aria-describedby="dashboard-tour-copy" tabIndex={-1}
      style={position} className="absolute flex max-h-[calc(100dvh-32px)] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-[24px] border border-white/70 bg-[#fffdf8] shadow-[0_24px_90px_#08112b66] outline-none"
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
      <div className="flex shrink-0 items-center gap-3 bg-[#4566ed] px-5 py-3 text-white max-md:px-4 max-md:py-2">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ffdf4f] max-md:size-8"><DuckHead className="size-8" /></span>
        <div className="flex-1"><p className="text-sm font-semibold">Quick tour</p><p className="mt-0.5 text-xs text-white/75 max-md:hidden">Explore with Cue</p></div>
        <button type="button" aria-label="Close dashboard tour" onClick={onClose} className="grid size-10 cursor-pointer place-items-center rounded-full bg-white/10 text-2xl hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white">×</button>
      </div>
      <div ref={copy} className="min-h-0 overflow-y-auto overscroll-contain p-5 max-md:p-4" aria-live="polite" aria-atomic="true" tabIndex={0}>
        <p className="text-[10px] font-bold tracking-[.16em] text-[#4566ed]">{current.tag}</p>
        <h2 id="dashboard-tour-title" className="mt-2 text-[22px] font-semibold leading-tight tracking-tight">{current.title}</h2>
        <p id="dashboard-tour-copy" className="mt-2 text-sm leading-6 text-[#626b80]">{current.copy}</p>
      </div>
      <div className="shrink-0 border-t border-[#e5e7ef] bg-[#fffdf8] px-5 pb-4 pt-2 max-md:px-4 max-md:pb-3">
        <div className="mb-1 flex items-center gap-1.5" role="group" aria-label="Tour stops">
          {dashboardTourSteps.map((item, index) => <button key={index} type="button" aria-label={`Step ${index + 1}: ${item.title}`} aria-current={index === step ? "step" : undefined} onClick={() => onStep(index)} className="group flex min-h-6 flex-1 cursor-pointer items-center rounded-full focus-visible:outline-2 focus-visible:outline-[#4566ed]"><span className={`h-1.5 w-full rounded-full transition-colors motion-reduce:transition-none ${index === step ? "bg-[#4566ed]" : index < step ? "bg-[#a6b5ff]" : "bg-[#e5e7ef] group-hover:bg-[#c4cefa]"}`} /></button>)}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs tabular-nums text-[#687087]">{String(step + 1).padStart(2, "0")} / {String(dashboardTourSteps.length).padStart(2, "0")}</span>
          <div className="flex gap-2"><button type="button" disabled={step === 0} onClick={() => onStep(step - 1)} className="min-h-11 cursor-pointer rounded-xl px-3 text-sm font-medium hover:bg-[#e9edff] disabled:cursor-default disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-[#4566ed]">Back</button><button type="button" onClick={() => last ? onClose() : onStep(step + 1)} className="min-h-11 cursor-pointer rounded-xl bg-[#4566ed] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#3054d6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4566ed]">{last ? "Done" : "Next"} <span aria-hidden="true">↗</span></button></div>
        </div>
        <p className="mt-3 text-center text-[10px] text-[#8990a0] max-md:hidden">← → to explore · Esc to leave</p>
      </div>
    </div>
  </div>, document.body);
}
