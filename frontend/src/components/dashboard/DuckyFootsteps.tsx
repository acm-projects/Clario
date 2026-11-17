import type { CSSProperties } from "react";
import "./ducky-footsteps.css";

/** A connected bent leg and rounded, three-lobed webbed paddle, mirrored for its partner. */
const legAndPaddle = "M10 2C9.1 1.7 8.4 2.2 8.5 3.2L9.5 10.7 8.4 17.3C6.8 18.1 3.5 19.2 2.2 21.3 1.3 22.8 2.6 24 4.4 23.5L7.1 22.8C6.4 24.5 7.4 25.8 9.2 25.2L12.1 24.1C13.1 25.4 15.4 25.4 16.7 24.3 18.2 22.9 16 20.6 12.1 18L12.8 10.7 11.5 3.3C11.4 2.6 10.9 2.2 10 2Z";

export function DuckyFeetIcon({ animate = false, delay = 0, tilt = 0, legend = false }: {animate?: boolean; delay?: number; tilt?: number; legend?: boolean}) {
  const style = {"--ducky-step-delay": `${delay}ms`, "--ducky-pair-tilt": `${tilt}deg`} as CSSProperties;
  return <svg viewBox="0 0 40 28" aria-hidden="true" focusable="false" data-ducky-footsteps="" data-stepping={animate} className={`ducky-feet pointer-events-none overflow-visible ${legend ? "ducky-feet--legend relative shrink-0" : "absolute bottom-0 left-1/2"} ${animate ? "ducky-feet--stepping" : ""}`} style={style}>
    <g className="ducky-hover-pair">
      <g className="ducky-foot ducky-foot--left"><path d={legAndPaddle} /></g>
      <g className="ducky-foot ducky-foot--right"><path d={legAndPaddle} transform="translate(40 0) scale(-1 1)" /></g>
    </g>
  </svg>;
}

// The calendar mounts date markers on load / month changes. CSS runs once per mount;
// ordinary React rerenders leave the animation intact. No saved assessment/activity is changed.
export default function DuckyFootsteps({ delay, tilt }: {userId: string; date: string; delay: number; tilt: number}) {
  return <DuckyFeetIcon animate delay={delay} tilt={tilt} />;
}
