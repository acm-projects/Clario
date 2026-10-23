import DuckHead from "../layout/DuckHead";

export default function ProblemLoading({ fullScreen = false, dark = false }: { fullScreen?: boolean; dark?: boolean }) {
  return <div role="status" aria-live="polite" className={`${fullScreen ? "min-h-svh" : "min-h-[360px] rounded-[28px] border border-[var(--border)]"} relative isolate grid place-items-center overflow-hidden px-6 py-12 font-sans ${dark ? "bg-[#0a1120] text-[#f4f7fc]" : "bg-[var(--surface-raised)] text-[var(--text)]"}`}>
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(#8195c9_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse,black,transparent_70%)]" />
    <div className="relative w-full max-w-[400px] text-center">
      <div aria-hidden="true" className="relative mx-auto mb-7 grid size-28 place-items-center">
        <div className="absolute inset-0 animate-spin rounded-full border border-dashed border-[#8b9ff0] [animation-duration:14s] motion-reduce:animate-none" />
        <span className="absolute -right-1 top-4 size-4 rounded-full bg-[#ffdf4f] shadow-[0_0_24px_#ffdf4f66]" />
        <span className="grid size-20 place-items-center rounded-[26px] bg-[#4566ed] shadow-[0_12px_35px_#4566ed40] motion-safe:animate-[landing-float_4s_ease-in-out_infinite]"><DuckHead className="size-16" /></span>
      </div>
      <p className="text-[10px] font-semibold tracking-[.22em] text-[#8b9ff0]">A LITTLE THINKING SPACE</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Preparing your next challenge</h1>
      <p className={`mt-3 text-sm leading-6 ${dark ? "text-[#a9b8d0]" : "text-[var(--text-muted)]"}`}>Fetching the problem and getting your workspace ready.<br />Take a breath. You've got this.</p>
      <div aria-hidden="true" className="mx-auto mt-7 max-w-[320px] overflow-hidden rounded-2xl border border-[#8195c9]/20 bg-[#101a30] p-4 text-left font-mono text-xs leading-7 shadow-lg">
        <div className="mb-3 flex gap-1.5"><span className="size-2 rounded-full bg-[#ff8c91]" /><span className="size-2 rounded-full bg-[#ffdf4f]" /><span className="size-2 rounded-full bg-[#76d8b0]" /></div>
        <p className="text-[#b6c7ff]"><span className="text-[#d5a8f4]">def</span> next_challenge():</p>
        <p className="pl-4 text-[#8293b5]"># make room for a new idea</p>
        <p className="pl-4 text-[#76d8b0]">return your_best_shot<span className="ml-1 inline-block h-3 w-1.5 bg-[#ffdf4f] align-middle motion-safe:animate-pulse" /></p>
      </div>
      <div aria-hidden="true" className="mx-auto mt-6 flex justify-center gap-2">{[0, 1, 2].map(index => <span key={index} style={{ animationDelay: `${index * 180}ms` }} className="size-1.5 rounded-full bg-[#8195ed] motion-safe:animate-bounce" />)}</div>
    </div>
  </div>;
}
