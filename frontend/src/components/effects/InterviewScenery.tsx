export default function InterviewScenery() {
  return <div aria-hidden="true" className="interview-scenery pointer-events-none absolute inset-0 -z-1 overflow-hidden">
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-1 h-1/2">
      {["left-[3%] top-[12%] w-28 sm:w-44", "right-[5%] top-[8%] w-36 sm:w-56", "right-[24%] top-[65%] w-24 sm:w-36"].map(position => <svg key={position} viewBox="0 0 240 100" className={`absolute ${position} text-white opacity-80 motion-safe:animate-[landing-cloud-drift_26s_ease-in-out_infinite_alternate]`} fill="currentColor" focusable="false"><path d="M42 87C21 87 9 76 9 61c0-16 13-28 30-28h4C49 14 66 5 84 9c13 2 23 10 28 21 8-8 19-12 31-10 17 2 29 14 32 29h13c23 0 39 8 39 21s-13 17-34 17Z" /></svg>)}
    </div>
  </div>;
}
