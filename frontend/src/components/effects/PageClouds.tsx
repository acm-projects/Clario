export default function PageClouds() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-1 overflow-hidden text-[#fffdf8] opacity-60">
      {["right-[3%] top-[5%] w-[20vw]", "left-[12%] top-[40%] w-44", "right-[8%] top-[72%] w-56"].map((position) => (
        <svg key={position} className={`absolute ${position}`} viewBox="0 0 240 100" fill="currentColor" focusable="false">
          <path d="M42 87C21 87 9 76 9 61c0-16 13-28 30-28h4C49 14 66 5 84 9c13 2 23 10 28 21 8-8 19-12 31-10 17 2 29 14 32 29h13c23 0 39 8 39 21s-13 17-34 17Z" />
        </svg>
      ))}
    </div>
  );
}
