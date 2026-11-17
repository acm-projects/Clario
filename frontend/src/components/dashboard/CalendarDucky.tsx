import type { CSSProperties } from "react";
import "./calendar-ducky.css";

/** Outline-only Ducky; the live date is separate text beneath the glasses. */
export default function CalendarDucky({ day, delay = 0, legend = false }: { day?: number; delay?: number; legend?: boolean }) {
  return <span aria-hidden="true" data-calendar-ducky=""
    className={`calendar-ducky pointer-events-none relative block shrink-0 aspect-[64/68] ${legend ? "w-7" : "w-[34px] sm:w-10 max-w-full"}`}
    data-animate={!legend} style={{ "--ducky-delay": `${delay}ms` } as CSSProperties}>
    <span className="calendar-ducky-face relative block h-full w-full">
      <svg focusable="false" viewBox="0 0 64 68" preserveAspectRatio="xMidYMid meet" className="block h-full w-full">
      <path d="M7 34C7 22 14 14 25 12c3-3 4-6 2-10 9-1 13 4 12 10 4-5 8-5 8-1l-1 6c8 5 12 12 12 22 5 16-6 26-25 26C12 65 2 57 5 43Z" fill="none" stroke="#e9b923" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 18q7-5 13-1m12 0q6-4 12 1" fill="none" stroke="#e9b923" strokeWidth="2" strokeLinecap="round" />
      <g fill="none" stroke="#242424" strokeWidth="1.8" strokeLinejoin="round">
        <rect x="8" y="22" width="21" height="17" rx="7" />
        <rect x="35" y="22" width="21" height="17" rx="7" />
        <path d="M29 27q3-3 6 0M5 24h3m48 0h3" fill="none" strokeLinecap="round" />
      </g>
      <ellipse cx="20" cy="30" rx="4" ry="6" fill="#242424" />
      <ellipse cx="44" cy="30" rx="4" ry="6" fill="#242424" />
      <circle cx="18.5" cy="27" r="1.5" fill="white" />
      <circle cx="42.5" cy="27" r="1.5" fill="white" />
      </svg>
      {day !== undefined && <span className="absolute inset-x-0 top-[61%] text-center font-sans text-[12px] font-extrabold leading-none text-[#182137] sm:text-[14px]">{day}</span>}
    </span>
  </span>;
}
