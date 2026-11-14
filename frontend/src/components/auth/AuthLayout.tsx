import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import BrandMark from "../layout/BrandMark";
import DecryptedText from "../effects/DecryptedText";
import WaterWaves from "../effects/WaterWaves";

const cloudPositions = [
  "top-[8%] left-[7%] w-[120px] [animation-delay:-4s]",
  "top-[18%] right-[6%] w-[150px] [animation-delay:-12s]",
  "bottom-[24%] left-[5%] w-[100px] [animation-delay:-8s]",
  "bottom-[12%] right-[7%] w-[125px] [animation-delay:-18s]",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <main className={"grid min-h-svh grid-cols-1 bg-[var(--page-background)] font-sans text-[#182137] lg:grid-cols-2 [&_:is(button,a,input):focus-visible]:outline-2 [&_:is(button,a,input):focus-visible]:outline-offset-4 [&_:is(button,a,input):focus-visible]:outline-[#182137]"}>
    <section aria-labelledby="auth-catchphrase" className="relative isolate flex min-h-[520px] flex-col overflow-hidden border-b border-[#4b505c] bg-[#4566ed] px-6 pt-7 pb-20 sm:px-10 lg:min-h-svh lg:border-r lg:border-b-0 lg:px-12 xl:px-16">
      <Link to="/" aria-label="Clario home" className="relative z-10 inline-flex w-fit items-center gap-3 rounded-2xl border border-[#4b505c] bg-[var(--page-background)] px-3 py-2 text-xl font-bold tracking-tight"><BrandMark />clario<span className="-ml-2 text-[#4566ed]">.</span></Link>
      <div className="pointer-events-none absolute inset-0 -z-1" aria-hidden="true">{cloudPositions.map((position,index)=><svg key={index} viewBox="0 0 240 100" className={"absolute h-auto overflow-visible opacity-80 animate-[landing-cloud-drift_26s_ease-in-out_infinite_alternate] motion-reduce:animate-none "+position}><path d="M42 87C21 87 9 76 9 61c0-16 13-28 30-28h4C49 14 66 5 84 9c13 2 23 10 28 21 8-8 19-12 31-10 17 2 29 14 32 29h13c23 0 39 8 39 21s-13 17-34 17Z" fill="var(--page-background)" stroke="#4b505c" strokeWidth="1.4" strokeLinejoin="round" /></svg>)}</div>
      <div className="relative z-1 mx-auto mt-12 flex w-full max-w-[520px] flex-1 flex-col justify-center lg:mt-16">
        <p className="mb-5 w-fit rounded-full border border-white/35 bg-[#4566ed] px-3 py-1.5 font-mono text-[14px] font-medium tracking-[.12em] text-white">YOUR NEXT CHAPTER STARTS HERE</p>
        <h1 id="auth-catchphrase" className="text-[clamp(38px,5vw,66px)] font-semibold uppercase leading-[1.04] tracking-[-.045em] text-white"><span className="italic text-[#ffdf4f]"><DecryptedText text="QUACK" initialText="CRACK" animateOn="view" sequential speed={100} delay={500} characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ" /></span><br />the technical<br />interview.</h1>
        <p className="mt-5 max-w-[350px] text-sm leading-7 text-[#edf1ff]">Practice out loud. Build confidence.<br />Find your flow with Clario.</p>
        <div className="relative mt-4 h-[220px] w-full sm:h-[260px]" role="img" aria-label="Clario duck walking, wearing glasses and a blue tie">
          <div className="absolute top-[-24px] h-[320px] w-[160px] animate-[auth-duck-stroll_12s_linear_infinite] sm:top-[-36px] sm:h-[400px] sm:w-[200px] motion-reduce:left-[calc(50%-80px)] motion-reduce:animate-none sm:motion-reduce:left-[calc(50%-100px)]" aria-hidden="true">
            <div className="h-full w-full bg-no-repeat [background-size:800%_400%] animate-[auth-duck-frames_.8s_steps(8)_infinite,auth-duck-direction_12s_steps(1)_infinite] motion-reduce:animate-none" style={{backgroundImage:"url("+import.meta.env.BASE_URL+"duckwalking.png)"}} />
          </div>
        </div>
      </div>
      <WaterWaves className="pointer-events-none absolute inset-x-0 bottom-0 -z-1 h-20 [--water:#3054ed] [--wave-far:#e8f1ff] [--wave-mid:#809cf7] [--wave-near:#5576ef]" />
    </section>
    <section aria-label="Account access" className="flex min-w-0 items-center justify-center px-5 py-12 sm:px-10 lg:min-h-svh lg:px-8 lg:py-10 xl:px-14">{children}</section>
  </main>;
}
