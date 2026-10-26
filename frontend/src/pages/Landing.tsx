import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DecryptedText from "../components/effects/DecryptedText";
import WaterWaves from "../components/effects/WaterWaves";
import BrandMark from "../components/layout/BrandMark";

import useReducedMotion from "../hooks/useReducedMotion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const cloudPositions = [
  "w-[clamp(80px,10vw,140px)] -top-12 left-[5%] opacity-90 [animation-delay:-8s]",
  "w-[clamp(90px,11vw,150px)] -top-10 left-[38%] opacity-90 [animation-delay:-17s] [animation-duration:32s]",
  "w-[clamp(80px,10vw,140px)] -top-14 right-[5%] opacity-80 [animation-delay:-5s]",
  "w-[clamp(100px,13vw,180px)] bottom-[6%] right-[12%] opacity-85 [animation-delay:-12s] [animation-duration:35s]",
  "w-[clamp(90px,12vw,160px)] bottom-[17%] left-[5%] opacity-85 [animation-delay:-20s] [animation-duration:33s]",
];

const sampleCode = "class Solution:\n    def twoSum(self, nums, target):\n        # explain it to the duck\n        seen = {}\n        for i, n in enumerate(nums):\n            need = target - n\n            if need in seen:\n                return [seen[need], i]\n            seen[n] = i";

function CodingPreview({ compact = false }: { compact?: boolean }) {
  const [position, setPosition] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setPosition(current => current >= sampleCode.length + 56 ? 0 : current + 1);
    }, 45);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  const visibleCode = reducedMotion ? sampleCode : sampleCode.slice(0, position);
  const finished = reducedMotion || position >= sampleCode.length;

    return (
    <figure className={compact ? "@container m-0 flex h-full w-full min-w-0 flex-col overflow-hidden bg-cream-gradient text-[#182137] [&_.demo-panels]:min-h-0 [&_.demo-panels]:flex-1 [&_.demo-panels]:overflow-auto [&>div:first-child]:shrink-0 [&>figcaption]:shrink-0" : "@container m-0 w-full min-w-0 overflow-hidden rounded-2xl border border-[#182137]/20 bg-cream-gradient text-[#182137] shadow-[0_24px_48px_-24px_#18213740]"} aria-label="Illustrative Clario interview workspace">
      <div className="flex items-center justify-between gap-2 border-b border-[#182137]/15 bg-white px-3 py-2 text-[clamp(7px,1.8cqw,12px)]">
        <span className="flex items-center gap-1.5 font-bold"><img src={import.meta.env.BASE_URL + "happyduck.png"} className="size-[1.8em] object-contain" alt="" /> Clario</span><span className="rounded-md border border-[#182137]/15 bg-cream-gradient px-2 py-1 font-mono">Time 44:45</span>
        <div className="flex gap-1.5" aria-hidden="true"><span className="rounded-md border border-[#182137]/20 px-2 py-1">Run</span><span className="rounded-md bg-[#ffdf4f] px-2 py-1 font-semibold">Submit</span></div>
      </div>
      <div className={"demo-panels grid grid-cols-[minmax(0,.9fr)_minmax(0,1.8fr)_minmax(0,1fr)] gap-2 p-2 text-[clamp(6px,1.55cqw,11px)] " + (compact ? "min-h-[220px]" : "min-h-[320px]")}>
        <div className="min-w-0 rounded-xl border border-[#182137]/15 bg-white p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-1"><h3 className="font-bold">1. Two Sum</h3><span className="rounded border border-[#4566ed]/20 bg-[#e3ebff] px-1.5 py-0.5 text-[.8em] text-[#2946b6]">Easy</span></div>
          <p className="mt-2 leading-[1.6]">Given an array of integers and a target, return the indices of the two numbers that add up to the target.</p>
          <h4 className="mt-3 font-semibold">Example 1</h4><div className="mt-1 rounded-lg bg-cream-gradient p-2 font-mono leading-[1.6]">nums = [2,7,11,15]<br />target = 9<br />Output: [0,1]</div>
          <h4 className="mt-3 font-semibold">Example 2</h4><div className="mt-1 rounded-lg bg-cream-gradient p-2 font-mono leading-[1.6]">nums = [3,2,4]<br />target = 6<br />Output: [1,2]</div>
        </div>
        <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#182137]/15 bg-[#111727]">
          <div className="flex items-center justify-between gap-1 border-b border-[#182137]/15 bg-cream-gradient p-2" aria-hidden="true"><div className="flex gap-1"><span className="rounded-md bg-[#ffdf4f] px-2 py-1 font-semibold text-[#182137]">Python</span><span className="rounded-md border border-[#182137]/15 bg-white px-2 py-1 text-[#182137]">Java</span></div><span className="rounded-md border border-[#182137]/15 bg-white px-1.5 py-1 text-[#182137]">Reset</span></div>
          <pre className="sr-only"><code>{sampleCode}</code></pre>
          <div className="min-w-0 flex-1 overflow-x-auto px-2 py-3 font-mono leading-[1.9] [scrollbar-width:thin]" aria-hidden="true">{sampleCode.split("\n").map((line, index) => <div key={index + line} className="flex min-w-max gap-2"><span className="w-2.5 shrink-0 select-none text-right text-[#68758f]">{index + 1}</span><code className={"whitespace-pre " + (index === 2 ? "text-[#8c95a9]" : [0,1,4,6,7].includes(index) ? "text-[#f3d365]" : "text-[#dce3f3]")}>{visibleCode.split("\n")[index] || ""}{!finished && index === visibleCode.split("\n").length - 1 && <span className="ml-px inline-block h-[1em] w-px bg-[#a9beff]" />}</code></div>)}</div>
        </div>
        <div className="row-span-2 flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#182137]/15 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-1 border-b border-[#182137]/15 p-2 font-semibold"><span>Interview call</span><span className="text-[.75em] font-normal">Topics / Hint</span></div>
          <div className="grid flex-1 grid-rows-2 gap-2 p-2">
            <div className="relative flex min-h-20 flex-col items-center justify-center rounded-lg border border-[#182137]/15 bg-cream-gradient p-2"><span className="absolute top-1 left-1 rounded bg-white px-1 text-[.8em]">You</span><svg viewBox="0 0 64 64" className="mt-2 w-[35%] max-w-14" aria-hidden="true"><circle cx="32" cy="18" r="10" fill="#e9993e" stroke="#182137" strokeWidth="2"/><path d="M12 53c1-25 39-25 40 0Z" fill="#4566ed" stroke="#182137" strokeWidth="2"/></svg><span className="mt-1 text-[.8em] text-[#687087]">Mic on</span></div>
            <div className="relative flex min-h-24 flex-col items-center justify-center rounded-lg border border-[#e8c842] bg-[#4566ed] p-2"><span className="absolute top-1 left-1 rounded bg-white px-1 text-[.8em] text-[#182137]">Clario</span><div className="mt-3 grid aspect-square w-[65%] max-w-24 place-items-center rounded-full border border-[#182137] bg-[#e3ebff]"><img src={import.meta.env.BASE_URL + "happyduck.png"} className="h-full w-full object-contain" alt="" /></div><span className="mt-1.5 flex items-center gap-1 text-[.8em] font-semibold text-white"><span className="flex items-center gap-0.5" aria-hidden="true">{[5,9,6,12].map((height,index)=><i key={index} className={"w-0.5 rounded-full bg-[#ffdf4f] " + (paused ? "" : "animate-pulse motion-reduce:animate-none")} style={{height,animationDelay:index*160+"ms"}}/>)}</span>Speaking...</span></div>
          </div>
          <div className="flex justify-center gap-1.5 border-t border-[#182137]/15 bg-cream-gradient p-2" aria-hidden="true">{["Mic","Cam","..."].map(label=><span key={label} className="grid size-5 place-items-center rounded-full border border-[#182137]/20 bg-white text-[.65em]">{label}</span>)}<span className="grid size-5 place-items-center rounded-full bg-[#ce5353] text-white">&#215;</span></div>
        </div>
        <div className="col-span-2 rounded-xl border border-[#182137]/15 bg-white p-2.5"><div className="flex items-center gap-2 font-semibold">Test results <span className="rounded bg-[#ffdf4f] px-1.5 py-0.5 text-[.8em]">{finished ? "2 / 3 passed" : "Waiting for solution"}</span></div><div className="mt-2 grid grid-cols-3 gap-1">{["Case 1", "Case 2", "Case 3"].map((label,index)=><span key={label} className="rounded-md bg-cream-gradient p-1.5"><span className={index===2?"text-[#af4d25]":"text-[#4566ed]"}>&#9679;</span> {label}<span className="ml-1 text-[#687087]">{finished ? index===2 ? "failed" : "passed" : "pending"}</span></span>)}</div></div>
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-[#182137]/15 bg-white px-3 py-2 text-[clamp(7px,1.5cqw,10px)] text-[#687087]"><span>Illustrative demo / no code is executed</span>{!reducedMotion && <button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused} className="cursor-pointer py-1 text-[#182137] underline underline-offset-4">{paused ? "Resume animation" : "Pause animation"}</button>}</figcaption>
    </figure>
  );
}

const duckVariants = [
  { src: import.meta.env.BASE_URL + "happyduck.png", label: "Happy" },
  { src: import.meta.env.BASE_URL + "confusedduck.png", label: "Confused" },
  { src: import.meta.env.BASE_URL + "angryduck.png", label: "Angry" },
];

function LandingMascot() {

  const reducedMotion = useReducedMotion();
  return (
    <div className={"landing-mascot relative grid min-w-0 w-full [min-height:560px] [align-items:start] justify-end flex-col isolate [grid-template-columns:minmax(0,_1fr)] [gap:0] [padding-bottom:140px] [@media_(max-width:_1023px)]:[min-height:540px] [@media_(max-width:_1023px)]:[width:min(100%,_600px)] [@media_(max-width:_1023px)]:[margin-inline:auto] [@media_(min-width:_1024px)_and_(max-width:_1279px)]:[min-height:510px] [@media_(max-width:_479px)]:[min-height:470px] [@media_(max-width:_479px)]:[padding-bottom:120px] [&:hover_.landing-computer-display]:[box-shadow:0_26px_48px_-24px_#2378db60,_inset_0_1px_0_white] [&:hover_.landing-duck]:[animation-duration:3s] [&:hover_.landing-duck-frame]:[animation-duration:12s]"} onPointerMove={(event) => {
      if (reducedMotion || event.pointerType === "touch") return;
      const bounds = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty("--duck-react-x", `${((event.clientX - bounds.left) / bounds.width - 0.5) * 16}px`);
      event.currentTarget.style.setProperty("--duck-react-y", `${((event.clientY - bounds.top) / bounds.height - 0.5) * 10}px`);
    }} onPointerLeave={(event) => {
      event.currentTarget.style.setProperty("--duck-react-x", "0px");
      event.currentTarget.style.setProperty("--duck-react-y", "0px");
    }}>
          <div className="landing-clouds pointer-events-none absolute inset-0 -z-1 overflow-visible" aria-hidden="true">{cloudPositions.map((position, cloud) => <svg key={cloud} className={["landing-cloud absolute h-auto overflow-visible animate-[landing-cloud-drift_26s_ease-in-out_infinite_alternate] motion-reduce:animate-none", position].join(" ")} viewBox="0 0 240 100" fill="none" focusable="false"><path d="M42 87C21 87 9 76 9 61c0-16 13-28 30-28h4C49 14 66 5 84 9c13 2 23 10 28 21 8-8 19-12 31-10 17 2 29 14 32 29h13c23 0 39 8 39 21s-13 17-34 17Z" fill="#fffdf8" stroke="#4b505c" strokeWidth="1.4" strokeLinejoin="round"/><path d="M42 87h151" stroke="#4b505c" strokeWidth="2" strokeLinecap="round"/></svg>)}</div>
      <div className="landing-computer relative [top:auto] [left:auto] [width:100%] [max-width:100%] [transform:none] [grid-column:1] [grid-row:1] [margin:40px_0_0_0] [@media_(max-width:_1023px)]:[left:0] [@media_(max-width:_1023px)]:w-full [@media_(max-width:_479px)]:w-full [@media_(max-width:_479px)]:[transform:none]" aria-label="Animated interview demo on a desktop computer">
        <div className="landing-computer-display relative [padding:16px_12px_0] [border:1px_solid_#4b505c] [border-radius:18px] [background:#d9dcde] [box-shadow:0_22px_45px_-24px_#333d4f65,_inset_0_1px_0_#fff] [transition:box-shadow_240ms_ease] [@media_(prefers-reduced-motion:_reduce)]:transition-none">
          <span className="landing-computer-camera absolute [top:6px] [left:50%] [width:4px] [height:4px] rounded-full [background:#414a52]" aria-hidden="true" />
          <div className={"landing-computer-screen aspect-[16/10] overflow-hidden rounded-[7px] border-[5px] border-[#4b505c] bg-cream-gradient [&_figure]:rounded-none [&_figure]:border-0 [&_figure]:shadow-none"}><CodingPreview compact /></div>
          <div className={"landing-computer-chin grid place-items-center [height:38px] [color:#81898f] [&_.brand-mark]:[width:23px] [&_.brand-mark]:[height:23px]"} aria-hidden="true"><BrandMark /></div>
        </div>
        <div className="landing-computer-stand [width:20%] [height:58px] [margin:0_auto] [background:linear-gradient(90deg,_#b9bec2,_#e6e8e9_50%,_#c4c9cc)] [clip-path:polygon(18%_0,_82%_0,_100%_100%,_0_100%)]" aria-hidden="true" />
        <div className="landing-computer-foot [width:38%] [height:9px] [margin:-2px_auto_0] [border-radius:50%_50%_4px_4px] [background:#c4c9cc] [box-shadow:0_10px_16px_#55595c20]" aria-hidden="true" />
      </div>
      <div className={"landing-duck-reaction absolute bottom-7 left-0 z-2 w-[66%] max-w-[400px] [transform:translate(var(--duck-react-x,0px),var(--duck-react-y,0px))] transition-transform duration-200 ease-out max-[1023px]:w-[70%] motion-reduce:transform-none motion-reduce:transition-none [&_.landing-duck]:m-0 [&_.landing-duck]:w-full [&_.landing-duck-frame]:absolute [&_.landing-duck-frame]:inset-0 [&_.landing-duck-frame]:size-full [&_.landing-duck-frame]:opacity-0 [&_.landing-duck-frame]:animate-[landing-duck-crossfade_12s_linear_infinite] motion-reduce:[&_.landing-duck-frame]:animate-none"}>
        <div className="landing-duck-cycle relative w-full [aspect-ratio:1] [animation:landing-float_6s_ease-in-out_infinite] [@media_(prefers-reduced-motion:_reduce)]:animate-none" role="img" aria-label="Clario duck mascot in different moods">
          {duckVariants.map((duck, index) => <img key={duck.src} className={"landing-duck relative [width:min(80%,_300px)] [aspect-ratio:1] object-contain block [animation:landing-float_6s_ease-in-out_infinite] [filter:drop-shadow(0_18px_10px_#9679241c)] [@media_(max-width:_1023px)]:[width:240px] [@media_(prefers-reduced-motion:_reduce)]:animate-none landing-duck-frame [&:first-child]:[opacity:1] [@media_(prefers-reduced-motion:_reduce)]:[opacity:0] [@media_(prefers-reduced-motion:_reduce)]:[&:first-child]:[opacity:1]"} src={duck.src} width="500" height="500" alt="" aria-hidden="true" style={{ animationDelay: String(index * 4 - 12) + "s" }} />)}
        </div>
      </div>
    </div>
  );
}
export default function Landing() {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const [headlineReversed, setHeadlineReversed] = useState(false);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const select = gsap.utils.selector(pageRef);
      const desktop = window.matchMedia('(min-width: 1024px)').matches;
      const hero = select('.landing-hero')[0];
      const ocean = select('.landing-ocean')[0];

      const panorama = gsap.timeline({
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8, invalidateOnRefresh: true },
      });
      panorama.to(select('.landing-hero-copy'), { x: 0, y: desktop ? -20 : 0, rotation: 0, ease: 'none' }, 0);
      panorama.to(select('.landing-mascot'), { x: 0, y: desktop ? -25 : 0, ease: 'none' }, 0);
      // Each cloud moves at a different depth as the hero scrolls away.
      select('.landing-cloud').forEach((cloud, index) => {
        const direction = index % 2 === 0 ? -1 : 1;
        panorama.to(cloud, {
          x: () => {
            const element = cloud;
            const layer = element.parentElement;
            if (!layer) return 0;
            // Leave room for the CSS drift while keeping clouds clear of the copy.
            const left = Number.parseFloat(window.getComputedStyle(element).left) || 0;
            const width = element.getBoundingClientRect().width;
            const min = Math.min(0, 28 - left);
            const max = Math.max(0, layer.clientWidth - left - width - 28);
            return gsap.utils.clamp(min, max, direction * (desktop ? 32 + index * 6 : 14 + index * 3));
          },
          y: -(desktop ? 60 + index * 35 : 30 + index * 18),
          rotation: direction * 3,
          ease: 'none',
        }, 0);
      });

      gsap.fromTo(select('.landing-waves svg'), { xPercent: -3, scaleX: 1.12 }, {
        xPercent: 3, scaleX: 1.12, ease: 'none',
        scrollTrigger: { trigger: ocean, start: 'top bottom', end: 'top top', scrub: 1 },
      });
      select('.feature-card').forEach((card, index) => {
        gsap.fromTo(card, { y: 80 + index * 22, rotation: index === 1 ? 2 : -1.5, scale: 0.96 }, {
          y: 0, rotation: 0, scale: 1, ease: 'none',
          scrollTrigger: { trigger: card, start: 'top 98%', end: 'top 42%', scrub: 0.7, invalidateOnRefresh: true },
        });
      });
      gsap.to(select('.ocean-light'), {
        xPercent: 6, y: -40, ease: 'none',
        scrollTrigger: { trigger: ocean, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
      });
    }, pageRef);
    return () => media.revert();
  }, { scope: pageRef });

  useEffect(() => {
    const scrollbarClasses = ["[scrollbar-width:none]", "[&::-webkit-scrollbar]:hidden"];
    const addedClasses = [document.documentElement, document.body].map((element) => {
      const classes = scrollbarClasses.filter((name) => !element.classList.contains(name));
      element.classList.add(...classes);
      return { element, classes };
    });
    return () => {
      addedClasses.forEach(({ element, classes }) => element.classList.remove(...classes));
    };
  }, []);
  const primaryButton = "inline-flex cursor-pointer items-center justify-between gap-6 rounded-2xl border border-black bg-[#4566ed] font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#3655d8] motion-reduce:transform-none motion-reduce:transition-none";

  return (
    <div ref={pageRef} className={"relative isolate min-h-screen overflow-hidden bg-[var(--page-background)] landing-page [--font-sans:'DM_Sans',_sans-serif] [--font-detail:'Inter',_sans-serif] [font-family:var(--font-sans)] [background-color:var(--page-background)] [&_#landing-title]:[font-family:var(--font-sans)] [&_#landing-title]:font-semibold [&_#landing-title]:[font-size:clamp(40px,_4.7vw,_76px)] [&_#landing-title]:[line-height:1.2] [&_#landing-title]:[letter-spacing:-0.025em] [&_#landing-title]:[overflow-wrap:anywhere] [&_:where(nav,_p,_dl,_figcaption,_footer,_button)]:[font-family:var(--font-detail)] font-sans text-[#182137] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[#182137]"}>
      <header className="relative z-10 mx-1 mt-1 rounded-[28px] border border-black bg-[#4566ed] px-3 sm:px-4">
        <nav aria-label="Main navigation" className={"landing-nav [&_button:not(.landing-brand)]:[min-height:44px] mx-auto flex min-h-[64px] w-full items-center justify-between gap-3 py-3 text-[#182137] [&_button]:border [&_button]:border-black sm:gap-6"}>
          <button onClick={() => navigate("/")} aria-label="Clario home" className={"landing-brand grid place-items-center bg-white [width:48px] [height:48px] [border-radius:12px] [color:#3054ed] [transition:background_180ms_ease,_color_180ms_ease] [&_.brand-mark]:[width:46px] [&_.brand-mark]:[height:46px] [&:hover]:[color:#2543ca] [&:hover]:[background:#e9edff] [@media_(prefers-reduced-motion:_reduce)]:transition-none [@media_(prefers-reduced-motion:_reduce)]:animate-none cursor-pointer"}><BrandMark /></button>
          <div className="flex items-center gap-2 sm:gap-3"><button onClick={() => navigate("/login")} className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#ffdf4f] px-4 py-2.5 text-sm font-semibold text-[#182137] transition-colors hover:bg-[#f4cf37] motion-reduce:transition-none">Log in</button><button onClick={() => navigate("/signup")} className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#182137] transition-colors hover:bg-[#e9edff] motion-reduce:transition-none sm:gap-4">Sign up <span aria-hidden="true">&#8599;</span></button></div>
        </nav>
      </header>
      <main>
        <div className="landing-hero relative isolate mx-auto grid max-w-[1672px] items-center gap-8 px-6 pb-4 pt-12 md:px-[7%] xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] xl:gap-6 xl:pb-2 xl:pt-14">

          <section className="landing-hero-copy relative z-10 min-w-0" aria-labelledby="landing-title">
            <div className="mb-8 flex items-center gap-4 font-sans text-xs font-semibold tracking-widest"><span className="h-0.5 w-8 bg-[#3054ed]" aria-hidden="true" />AI MOCK INTERVIEWER</div>
            <h1 id="landing-title" aria-label="CRACK THE TECHNICAL INTERVIEW" className="m-0 max-w-[760px] text-balance text-[clamp(44px,4.7vw,76px)] font-sans font-semibold uppercase leading-[1.05] tracking-normal"><span className="italic"><DecryptedText key={headlineReversed ? "crack" : "quack"} text={headlineReversed ? "CRACK" : "QUACK"} initialText={headlineReversed ? "QUACK" : "CRACK"} delay={1500} animateOn="view" onComplete={() => setHeadlineReversed((value) => !value)} sequential speed={100} revealDirection="start" characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ" encryptedClassName="text-[#3054ed]" /></span> THE TECHNICAL INTERVIEW</h1>
            <p className="mt-8 max-w-[456px] text-[17px] leading-[1.7] text-[#687087]">A live AI-powered technical interview coach helping you practice smarter, get real-time feedback, and build confidence.</p>
            <button onClick={() => navigate("/signup")} className={`${primaryButton} mt-8 min-h-14 min-w-[184px] px-6 py-4`}>Join today <span aria-hidden="true" className="text-xl">&#8599;</span></button>
            <div className="mt-12 flex max-w-[520px] flex-wrap gap-x-6 gap-y-4 border-t border-[#182137]/15 pt-6 font-sans text-xs text-[#687087]" aria-label="How Clario helps you prepare">{["Practice", "Get feedback", "Build confidence"].map((label, index) => <span key={label}><b className="mr-2 font-sans text-[14px] font-normal">0{index + 1}</b>{label}</span>)}</div>
          </section>
          <LandingMascot />

        </div>
        <div className={"landing-ocean relative isolate [background:linear-gradient(180deg,var(--water),var(--water-deep))] [&_button:focus-visible]:[outline-color:white]"}><WaterWaves className="landing-waves [background:var(--page-background)] relative h-20 overflow-hidden md:h-24" /><div className={"ocean-light pointer-events-none absolute [z-index:-1] [inset:176px_0_0] [mask-image:linear-gradient(transparent,_black_100px)] overflow-hidden [&::before]:[content:''] [&::before]:absolute [&::before]:[inset:-40%_-20%] [&::before]:[background:repeating-conic-gradient(from_168deg_at_50%_0%,_transparent_0deg_9deg,_#e5edff14_10deg_14deg,_transparent_15deg_26deg)] [&::before]:[filter:blur(14px)] [&::before]:[animation:ocean-sway_18s_ease-in-out_infinite_alternate] [@media_(prefers-reduced-motion:_reduce)]:[&::before]:animate-none"} aria-hidden="true" /><div className={"ocean-bubbles pointer-events-none absolute [z-index:-1] [inset:150px_0_0] overflow-hidden [&_i]:absolute [&_i]:[bottom:-60px] [&_i]:[left:8%] [&_i]:[width:20px] [&_i]:[height:20px] [&_i]:[border:1px_solid_#e8efff40] [&_i]:rounded-full [&_i]:[box-shadow:inset_3px_3px_6px_#ffffff12] [&_i]:[animation:ocean-rise_17s_linear_infinite] [&_i:nth-child(2)]:[left:24%] [&_i:nth-child(2)]:[width:10px] [&_i:nth-child(2)]:[height:10px] [&_i:nth-child(2)]:[animation-delay:-8s] [&_i:nth-child(3)]:[left:45%] [&_i:nth-child(3)]:[width:28px] [&_i:nth-child(3)]:[height:28px] [&_i:nth-child(3)]:[animation-delay:-3s] [&_i:nth-child(3)]:[animation-duration:22s] [&_i:nth-child(4)]:[left:68%] [&_i:nth-child(4)]:[width:12px] [&_i:nth-child(4)]:[height:12px] [&_i:nth-child(4)]:[animation-delay:-12s] [&_i:nth-child(5)]:[left:84%] [&_i:nth-child(5)]:[animation-delay:-6s] [&_i:nth-child(5)]:[animation-duration:20s] [&_i:nth-child(6)]:[left:94%] [&_i:nth-child(6)]:[width:9px] [&_i:nth-child(6)]:[height:9px] [&_i:nth-child(6)]:[animation-delay:-14s] [@media_(prefers-reduced-motion:_reduce)]:[&_i]:animate-none [@media_(prefers-reduced-motion:_reduce)]:[&_i]:[bottom:25%]"} aria-hidden="true">{[0, 1, 2, 3, 4, 5].map((bubble) => <i key={bubble} />)}</div>
        <section aria-labelledby="landing-info-title" className={"landing-underwater feature-section [&.feature-section]:[position:relative] [&.feature-section]:[z-index:1] [&.feature-section]:[max-width:1440px] [&.feature-section]:[margin:auto] [&.feature-section]:[padding:64px_6%_100px] [&.feature-section]:[color:#fff] [@media_(max-width:700px)]:[&.feature-section]:[padding:44px_24px_64px]"}>
          <header className={"feature-heading [&.feature-heading]:[text-align:center] [&.feature-heading_h2]:[margin:22px_0] [&.feature-heading_h2]:[font-size:clamp(36px,5vw,68px)] [&.feature-heading_h2]:[font-weight:600] [&.feature-heading_h2]:[letter-spacing:-.055em] [&.feature-heading_h2]:[line-height:1.06] [&.feature-heading_>_p:last-child]:[margin:28px_auto_0] [&.feature-heading_>_p:last-child]:[color:#dce7ff] [&.feature-heading_>_p:last-child]:[font-size:clamp(15px,1.6vw,20px)] [@media_(max-width:700px)]:[&.feature-heading_h2]:[font-size:38px]"}>
            <p className={"reference-eyebrow [&.reference-eyebrow]:[font-family:monospace] [&.reference-eyebrow]:[font-size:14px] [&.reference-eyebrow]:[font-weight:600] [&.reference-eyebrow]:[letter-spacing:.13em]"}>NOT ANOTHER LEETCODE CLONE</p>
            <h2 id="landing-info-title">The interview skills<br />code alone can&#8217;t teach.</h2>
            <p>Clario listens to how you think&#8212;not just what you type.</p>
          </header>
          <div className={"feature-cards [&.feature-cards]:[display:grid] [&.feature-cards]:[grid-template-columns:repeat(3,minmax(0,1fr))] [&.feature-cards]:[align-items:start] [&.feature-cards]:[gap:24px] [&.feature-cards]:[margin-top:80px] [@media_(max-width:1100px)]:[&.feature-cards]:[gap:16px] [@media_(max-width:700px)]:[&.feature-cards]:[grid-template-columns:1fr] [@media_(max-width:700px)]:[&.feature-cards]:[margin-top:44px]"}>
            <article className={"feature-card [&.feature-card]:[display:flex] [&.feature-card]:[flex-direction:column] [&.feature-card]:[min-height:490px] [&.feature-card]:[border-radius:34px] [&.feature-card]:[padding:36px] [&.feature-card_h3]:[margin:90px_0_20px] [&.feature-card_h3]:[font-size:clamp(22px,2.15vw,31px)] [&.feature-card_h3]:[font-weight:500] [&.feature-card_h3]:[line-height:1.15] [&.feature-card_h3]:[letter-spacing:-.045em] [&.feature-card_>_p]:[margin:0_0_32px] [&.feature-card_>_p]:[font-size:15px] [&.feature-card_>_p]:[line-height:1.8] [&.feature-card_>_p]:[color:#626b7a] [@media_(max-width:1100px)]:[&.feature-card]:[padding:26px] [@media_(max-width:1100px)]:[&.feature-card_h3]:[margin-top:65px] [@media_(max-width:700px)]:[&.feature-card]:[min-height:390px] [@media_(max-width:700px)]:[&.feature-card]:[padding:30px] [@media_(max-width:700px)]:[&.feature-card_h3]:[margin-top:48px] [@media_(max-width:700px)]:[&.feature-card_h3]:[font-size:29px] [@media_(max-width:700px)]:[&.feature-card_>_p]:[font-size:14px] feature-card-code [&.feature-card-code]:[background:#ffdf4f] [&.feature-card-code]:[color:#182137] [&.feature-card-code_>_p]:[color:#746630] [@media_(max-width:700px)]:[&.feature-card-code]:[margin-top:0]"}>
              <div className={"feature-card-top [&.feature-card-top]:[display:flex] [&.feature-card-top]:[align-items:flex-start] [&.feature-card-top]:[justify-content:space-between]"}><span className={"feature-icon [&.feature-icon]:[display:grid] [&.feature-icon]:[place-items:center] [&.feature-icon]:[width:58px] [&.feature-icon]:[height:58px] [&.feature-icon]:[background:#000000] [&.feature-icon]:[color:white] [&.feature-icon]:[border-radius:18px] [&.feature-icon_svg]:[width:26px] [&.feature-icon_svg]:[height:26px]"}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 20" /></svg></span></div>
              <h3>Code under pressure</h3><p>A focused editor, realistic constraints, and hints only when you truly need them.</p>
              <pre className={"feature-code [&.feature-code]:[margin:auto_0_0] [&.feature-code]:[border-radius:18px] [&.feature-code]:[padding:22px] [&.feature-code]:[background:#fff0ae] [&.feature-code]:[font:14px/1.9_monospace] [&.feature-code]:[white-space:pre-wrap] [&.feature-code_b]:[color:#3054ed] [&.feature-code_em]:[color:#8a7753]"} aria-label="Illustrative code"><code><b>function</b>{' solve(input) {\n  '}<em>// you&#8217;ve got this</em>{'\n}'}</code></pre>
            </article>
            <article className={"feature-card [&.feature-card]:[display:flex] [&.feature-card]:[flex-direction:column] [&.feature-card]:[min-height:490px] [&.feature-card]:[border-radius:34px] [&.feature-card]:[padding:36px] [&.feature-card_h3]:[margin:90px_0_20px] [&.feature-card_h3]:[font-size:clamp(22px,2.15vw,31px)] [&.feature-card_h3]:[font-weight:500] [&.feature-card_h3]:[line-height:1.15] [&.feature-card_h3]:[letter-spacing:-.045em] [&.feature-card_>_p]:[margin:0_0_32px] [&.feature-card_>_p]:[font-size:15px] [&.feature-card_>_p]:[line-height:1.8] [&.feature-card_>_p]:[color:#626b7a] [@media_(max-width:1100px)]:[&.feature-card]:[padding:26px] [@media_(max-width:1100px)]:[&.feature-card_h3]:[margin-top:65px] [@media_(max-width:700px)]:[&.feature-card]:[min-height:390px] [@media_(max-width:700px)]:[&.feature-card]:[padding:30px] [@media_(max-width:700px)]:[&.feature-card_h3]:[margin-top:48px] [@media_(max-width:700px)]:[&.feature-card_h3]:[font-size:29px] [@media_(max-width:700px)]:[&.feature-card_>_p]:[font-size:14px] feature-card-voice [&.feature-card-voice]:[margin-top:28px] [@media_(max-width:700px)]:[&.feature-card-voice]:[margin-top:0] [&.feature-card-voice]:[background:#2644bf] [&.feature-card-voice]:[color:white] [&.feature-card-voice_>_p]:[color:#d2ddff]"}>
              <div className={"feature-card-top [&.feature-card-top]:[display:flex] [&.feature-card-top]:[align-items:flex-start] [&.feature-card-top]:[justify-content:space-between]"}><span className={"feature-icon [&.feature-icon]:[display:grid] [&.feature-icon]:[place-items:center] [&.feature-icon]:[width:58px] [&.feature-icon]:[height:58px] [&.feature-icon]:[background:#000000] [&.feature-icon]:[color:white] [&.feature-icon]:[border-radius:18px] [&.feature-icon_svg]:[width:26px] [&.feature-icon_svg]:[height:26px]"}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3" /></svg></span></div>
              <h3>Speak your strategy</h3><p>Talk through trade-offs and edge cases with a responsive AI interviewer that asks the right follow-ups.</p>
              <div className={"feature-waveform [&.feature-waveform]:[display:flex] [&.feature-waveform]:[align-items:center] [&.feature-waveform]:[justify-content:space-between] [&.feature-waveform]:[gap:6px] [&.feature-waveform]:[height:50px] [&.feature-waveform]:[margin-top:auto] [&.feature-waveform_i]:[flex:1] [&.feature-waveform_i]:[border-radius:12px] [&.feature-waveform_i]:[background:#6c87ec]"} aria-hidden="true">{[10,20,30,18,38,28,14,32,22,10,26,36,16,26].map((height, i) => <i key={i} style={{ height }} />)}</div>
            </article>
            <article className={"feature-card [&.feature-card]:[display:flex] [&.feature-card]:[flex-direction:column] [&.feature-card]:[min-height:490px] [&.feature-card]:[border-radius:34px] [&.feature-card]:[padding:36px] [&.feature-card_h3]:[margin:90px_0_20px] [&.feature-card_h3]:[font-size:clamp(22px,2.15vw,31px)] [&.feature-card_h3]:[font-weight:500] [&.feature-card_h3]:[line-height:1.15] [&.feature-card_h3]:[letter-spacing:-.045em] [&.feature-card_>_p]:[margin:0_0_32px] [&.feature-card_>_p]:[font-size:15px] [&.feature-card_>_p]:[line-height:1.8] [&.feature-card_>_p]:[color:#626b7a] [@media_(max-width:1100px)]:[&.feature-card]:[padding:26px] [@media_(max-width:1100px)]:[&.feature-card_h3]:[margin-top:65px] [@media_(max-width:700px)]:[&.feature-card]:[min-height:390px] [@media_(max-width:700px)]:[&.feature-card]:[padding:30px] [@media_(max-width:700px)]:[&.feature-card_h3]:[margin-top:48px] [@media_(max-width:700px)]:[&.feature-card_h3]:[font-size:29px] [@media_(max-width:700px)]:[&.feature-card_>_p]:[font-size:14px] feature-card-feedback [&.feature-card-feedback]:[background:#fffdf8] [&.feature-card-feedback]:[color:#182137]"}>
              <div className={"feature-card-top [&.feature-card-top]:[display:flex] [&.feature-card-top]:[align-items:flex-start] [&.feature-card-top]:[justify-content:space-between]"}><span className={"feature-icon [&.feature-icon]:[display:grid] [&.feature-icon]:[place-items:center] [&.feature-icon]:[width:58px] [&.feature-icon]:[height:58px] [&.feature-icon]:[background:#000000] [&.feature-icon]:[color:white] [&.feature-icon]:[border-radius:18px] [&.feature-icon_svg]:[width:26px] [&.feature-icon_svg]:[height:26px]"}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 20h19M6 20V9m6 11V4m6 16v-7" /></svg></span></div>
              <h3>Know what to improve</h3><p>Get a clear breakdown of communication, correctness, pacing, and problem solving.</p>
              <div className={"feature-score [&.feature-score]:[width:126px] [&.feature-score]:[height:126px] [&.feature-score]:[border-radius:50%] [&.feature-score]:[padding:9px] [&.feature-score]:[background:conic-gradient(from_-30deg,#3054ed_0_87%,#e8e5dd_87%)] [&.feature-score]:[margin-top:auto] [&.feature-score_>_div]:[display:flex] [&.feature-score_>_div]:[flex-direction:column] [&.feature-score_>_div]:[align-items:center] [&.feature-score_>_div]:[justify-content:center] [&.feature-score_>_div]:[height:100%] [&.feature-score_>_div]:[border-radius:50%] [&.feature-score_>_div]:[background:#fffdf8] [&.feature-score_strong]:[font-size:32px] [&.feature-score_strong]:[letter-spacing:-.05em] [&.feature-score_span]:[font:14px_monospace] [&.feature-score_span]:[margin-top:4px]"} aria-label="Example clarity score: 87"><div><strong>87</strong><span>CLARITY</span></div></div><span className={"feature-example [&.feature-example]:[font:14px_monospace] [&.feature-example]:[margin-top:10px] [&.feature-example]:[color:#8b8c91]"}>Illustrative score</span>
            </article>
          </div>
        </section>
<footer className={"ocean-footer relative flex items-center justify-between flex-wrap [gap:20px] [margin:0_7%] [padding:28px_0] [border-top:1px_solid_#ffffff26] [color:#c5def6] [font-size:14px] [&_button]:cursor-pointer [&_button]:text-white"}><span className="font-semibold tracking-tight">CLARIO.</span><span>Find your flow. Get interview ready.</span><button onClick={() => navigate("/signup")}>Take the first step &#8599;</button></footer></div>
      </main>
    </div>
  );
}




