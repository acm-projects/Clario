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

const sampleCode = `class Solution {
  public int[] twoSum(int[] nums, int target) {
    for (int i = 0; i < nums.length; i++) {
      for (int j = i + 1; j < nums.length; j++) {
        if (nums[i] + nums[j] == target) {
          return new int[] {i, j};
        }
      }
    }
    return new int[] {};
  }
}`;

const details = [
  { title: "Think out loud", description: "A voice interviewer that follows your reasoning and adapts its questions as you go." },
  { title: "Work through the problem", description: "A built-in coding workspace to develop your solution alongside the conversation." },
  { title: "Know what to practice next", description: "Feedback on code, reasoning, and communication, with a personalized study plan to guide your next session." },
];

function CodingPreview() {
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
      setPosition((current) => current >= sampleCode.length + 56 ? 0 : current + 1);
    }, 45);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  const visibleCode = reducedMotion ? sampleCode : sampleCode.slice(0, position);
  const finished = reducedMotion || position >= sampleCode.length;

  return (
    <figure className="@container m-0 w-full min-w-0 overflow-hidden rounded-xl border border-[#191d20]/15 bg-[#f8fafc] shadow-[0_24px_48px_-24px_rgba(25,29,32,0.22)]" aria-label="Example of a Clario coding interview">
      <div className="flex items-center gap-4 border-b border-[#191d20]/10 bg-[#eef1f4] p-4 font-mono text-[11px] text-[#55595c]">
        <div className="flex gap-2" aria-hidden="true"><i className="h-2.5 w-2.5 rounded-full bg-[#191d20]/30" /><i className="h-2.5 w-2.5 rounded-full bg-[#191d20]/20" /><i className="h-2.5 w-2.5 rounded-full bg-[#191d20]/10" /></div>
        <span>clario / practice room</span><span className="ml-auto text-[9px] tracking-wider">DEMO</span>
      </div>
      <div className="flex items-center justify-between gap-3 border-b border-[#191d20]/10 bg-white/70 px-4 py-3 text-[10px]">
        <span className="font-semibold tracking-wide">CLARIO <span className="ml-2 hidden font-normal tracking-normal text-[#55595c] @[480px]:inline">Problem list</span></span>
        <div className="flex gap-2" aria-hidden="true"><span className="rounded bg-[#191d20]/5 px-3 py-1.5">&#9654; Run</span><span className="rounded bg-[#3b8fe8] px-3 py-1.5 font-semibold">Submit</span></div>
        <span className="flex items-center gap-1.5 text-[#2f7fe2]"><i className="h-1.5 w-1.5 rounded-full bg-[#3b8fe8]" />Session live</span>
      </div>
      <div className="grid gap-2 bg-[#F6EDD1]/45 p-2 @[560px]:grid-cols-[0.85fr_1.65fr_0.8fr]">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex-1 rounded-lg border border-[#191d20]/10 bg-white/85">
            <div className="flex gap-3 border-b border-[#191d20]/8 px-3 py-3 text-[9px]"><span className="font-semibold">Description</span><span className="text-[#55595c]">Editorial</span></div>
            <div className="p-3"><h3 className="text-base font-semibold tracking-tight">1. Two Sum</h3><div className="my-3 flex gap-1.5 text-[8px]"><span className="rounded-full bg-[#dfeaf5] px-2 py-1 text-[#2f7fe2]">Easy</span><span className="rounded-full bg-[#191d20]/5 px-2 py-1">Topics</span><span className="rounded-full bg-[#191d20]/5 px-2 py-1">Hint</span></div><p className="text-[10px] leading-[1.7] text-[#55595c]">Given an array of integers <code>nums</code> and a target, return the indices of the two numbers that add up to it.</p><p className="mt-2 text-[10px] leading-[1.7] text-[#55595c]">Each input has exactly one solution. You may not use the same element twice.</p><h4 className="mb-2 mt-4 text-[10px] font-semibold">Example 1</h4><div className="rounded bg-[#F6EDD1]/45 p-2 font-mono text-[9px] leading-4"><p>nums = [2,7,11,15]</p><p>target = 9</p><p>Output: [0,1]</p></div></div>
          </div>
          <div className="rounded-lg border border-[#191d20]/10 bg-white/85"><div className="border-b border-[#191d20]/8 px-3 py-2 text-[9px] font-semibold">Test result <span className="ml-2 font-normal text-[#454b50]">Testcase</span></div><p className="min-h-12 px-3 py-4 font-mono text-[9px] text-[#55595c]" aria-hidden="true">{finished ? "[0, 1] / example passed" : "Waiting for solution..."}</p></div>
        </div>
        <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-[#191d20]/10 bg-[#191d20]">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-3 text-[10px] text-[#dfeaf5]"><span>Code <span className="ml-2 text-[9px] text-[#89939d]">Solution.java</span></span><span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px]">Java</span></div>
          <pre className="sr-only"><code>{sampleCode}</code></pre>
          <div className="min-h-64 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-3 py-4" aria-hidden="true">
            {sampleCode.split("\n").map((line, index) => (
              <div className={`flex min-w-max gap-3 font-mono text-[10px] leading-6 ${index === 4 ? "bg-[#3b8fe8]/10" : ""}`} key={`${index}-${line}`}>
                <span className="w-3 shrink-0 select-none text-right text-[#89939d]">{index + 1}</span>
                <code className={`whitespace-pre ${index === 0 || index === 4 || index === 5 ? "text-[#6eaff8]" : "text-[#dfeaf5]"}`}>
                  {visibleCode.split("\n")[index] || ""}
                  {!finished && index === visibleCode.split("\n").length - 1 && <span className="ml-0.5 inline-block h-3 w-1 translate-y-0.5 bg-[#6eaff8]" />}
                </code>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-white/10 px-3 py-2 font-mono text-[8px] text-[#89939d]"><span>{finished ? "Saved" : "Editing..."}</span><span>UTF-8</span></div>
        </div>
        <div className="flex min-w-0 flex-col rounded-lg border border-[#191d20]/10 bg-white/85">
          <div className="border-b border-[#191d20]/8 px-3 py-3 text-[10px] font-semibold">Video call</div>
          <div className="grid flex-1 grid-cols-2 gap-2 p-2 @[560px]:grid-cols-1">
            <div className="relative flex min-h-28 flex-col items-center justify-center rounded-md bg-[#F6EDD1]/60 p-3"><span className="absolute left-2 top-2 rounded bg-white/80 px-1.5 py-0.5 text-[8px]">You</span><svg viewBox="0 0 48 48" className="mt-4 h-10 w-10 text-[#55595c]/30" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="24" cy="16" r="8" /><path d="M8 43c0-10 7-16 16-16s16 6 16 16" /></svg><span className="mt-3 text-center text-[8px] text-[#55595c]">Your camera feed</span></div>
            <div className="relative flex min-h-36 flex-col items-center justify-center rounded-md border border-[#3b8fe8]/50 bg-[#dfeaf5] p-3"><span className="absolute left-2 top-2 rounded bg-white/80 px-1.5 py-0.5 text-[8px]">Clario</span><svg viewBox="0 0 80 80" className="mt-5 h-16 w-16" aria-hidden="true"><circle cx="40" cy="40" r="38" fill="#f8fafc" /><path d="M20 49c0-17 8-27 23-27s24 11 23 25c-1 16-12 23-26 20-9-2-17-7-20-18Z" fill="#f5d449" /><path d="m20 47-10 7 14 4Z" fill="#f9a926" /><path d="M40 22c-4-9 3-12 6-7" fill="none" stroke="#f5d449" strokeWidth="4" strokeLinecap="round" /><rect x="26" y="35" width="16" height="10" rx="3" fill="#191d20" /><rect x="47" y="35" width="16" height="10" rx="3" fill="#191d20" /><path d="M24 36h41M41 38h7" stroke="#191d20" strokeWidth="3" /></svg><div className="mt-3 flex items-center gap-1 text-[8px] text-[#2f7fe2]"><span className="flex items-center gap-0.5" aria-hidden="true">{[4, 8, 12, 6].map((height, index) => <i key={index} className={`w-0.5 rounded-sm bg-[#3b8fe8] ${paused ? "" : "animate-pulse motion-reduce:animate-none"}`} style={{ height, animationDelay: `${index * 160}ms` }} />)}</span>Speaking...</div></div>
          </div>
          <div className="flex justify-center gap-2 border-t border-[#191d20]/8 p-2 text-[#55595c]" aria-hidden="true"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#191d20]/5"><svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 10v2a6 6 0 0 0 12 0v-2M12 18v3M9 21h6" /></svg></span><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#191d20]/5"><svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="6" width="12" height="12" rx="2" /><path d="m15 10 6-3v10l-6-3" /></svg></span><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#191d20]/5 text-xs">&#8943;</span></div>
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-[#191d20]/10 px-4 py-3"><span className="font-mono text-[9px] text-[#2f7fe2]">CLARIO</span><p className="text-[10px] leading-4 text-[#55595c]">How could you improve the time complexity of this solution?</p></div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-[#191d20]/10 px-4 py-3 text-[10px] text-[#55595c]"><span>Illustrative preview / no code is executed</span>{!reducedMotion && <button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused} className="cursor-pointer py-1 text-[#191d20] underline underline-offset-4">{paused ? "Resume animation" : "Pause animation"}</button>}</figcaption>
    </figure>
  );
}

const duckVariants = [
  { src: "/smartduck.png", label: "Smart" },
  { src: "/excitedduck.png", label: "Excited" },
  { src: "/confidentduck.png", label: "Confident" },
  { src: "/stressedduck.png", label: "Stressed" },
];

function LandingMascot() {

  const reducedMotion = useReducedMotion();
  return (
    <div className={"landing-mascot relative grid [min-height:560px] [align-items:start] justify-end flex-col isolate [grid-template-columns:minmax(0,_1fr)] [gap:0] [padding-bottom:140px] [@media_(max-width:_1023px)]:[min-height:540px] [@media_(max-width:_1023px)]:[width:min(100%,_600px)] [@media_(max-width:_1023px)]:[margin-inline:auto] [@media_(min-width:_1024px)_and_(max-width:_1279px)]:[min-height:510px] [@media_(max-width:_479px)]:[min-height:470px] [@media_(max-width:_479px)]:[padding-bottom:120px] [&:hover_.landing-computer-display]:[box-shadow:0_26px_48px_-24px_#2378db60,_inset_0_1px_0_white] [&:hover_.landing-duck]:[animation-duration:3s] [&:hover_.landing-duck-frame]:[animation-duration:16s]"} onPointerMove={(event) => {
      if (reducedMotion || event.pointerType === "touch") return;
      const bounds = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty("--duck-react-x", `${((event.clientX - bounds.left) / bounds.width - 0.5) * 16}px`);
      event.currentTarget.style.setProperty("--duck-react-y", `${((event.clientY - bounds.top) / bounds.height - 0.5) * 10}px`);
    }} onPointerLeave={(event) => {
      event.currentTarget.style.setProperty("--duck-react-x", "0px");
      event.currentTarget.style.setProperty("--duck-react-y", "0px");
    }}>
      <div className={"landing-computer relative [top:auto] [left:auto] [width:108%] [max-width:none] [transform:none] [grid-column:1] [grid-row:1] [margin:24px_0_0_0] [@media_(max-width:_1023px)]:[left:0] [@media_(max-width:_1023px)]:w-full [@media_(max-width:_479px)]:w-full [@media_(max-width:_479px)]:[transform:none]"} aria-label="Animated interview demo on a desktop computer">
        <div className={"landing-computer-display relative [padding:16px_12px_0] [border:1px_solid_#b4b8bb] [border-radius:18px] [background:#d9dcde] [box-shadow:0_22px_45px_-24px_#333d4f65,_inset_0_1px_0_#fff] [transition:box-shadow_240ms_ease] [@media_(prefers-reduced-motion:_reduce)]:transition-none"}>
          <span className={"landing-computer-camera absolute [top:6px] [left:50%] [width:4px] [height:4px] rounded-full [background:#414a52]"} aria-hidden="true" />
          <div className={"landing-computer-screen overflow-hidden [border:5px_solid_#252a2e] [border-radius:7px] [background:#f8fafc] [&_figure]:[border:0] [&_figure]:[border-radius:0] [&_figure]:[box-shadow:none] [&_figure_>_div:first-child]:[padding:8px_10px] [&_figure_>_div:first-child]:[font-size:9px] [&_figure_>_div:nth-child(2)]:[padding:7px_10px] [&_figure_>_div:nth-child(3)]:[grid-template-columns:minmax(0,_1.6fr)_minmax(0,_1fr)] [&_figure_>_div:nth-child(3)]:[gap:5px] [&_figure_>_div:nth-child(3)]:[padding:5px] [&_figure_>_div:nth-child(3)_>_div:first-child]:hidden [&_figure_>_div:nth-child(3)_>_div:nth-child(2)_>_div:nth-child(3)]:[min-height:190px] [&_figure_>_div:nth-child(3)_>_div:nth-child(2)_>_div:nth-child(3)]:[padding:8px] [&_figure_pre_+_div_>_div]:[font-size:8px] [&_figure_pre_+_div_>_div]:[line-height:16px] [&_figure_pre_+_div_>_div]:[gap:6px] [&_figure_>_div:nth-child(3)_>_div:last-child_>_div:nth-child(2)]:[grid-template-columns:1fr] [&_figure_>_div:nth-child(3)_>_div:last-child_>_div:nth-child(2)_>_div:first-child]:hidden [&_figure_>_div:nth-child(3)_>_div:last-child_>_div:nth-child(2)_>_div:last-child]:[min-height:150px] [&_figure_>_div:nth-child(4)]:[padding:8px_10px] [&_figure_>_div:nth-child(4)]:[gap:8px] [&_figcaption]:[padding:5px_10px] [&_figcaption]:[font-size:8px] [@media_(max-width:_479px)]:[&_figure_>_div:nth-child(2)_>_span:last-child]:hidden"}><CodingPreview /></div>
          <div className={"landing-computer-chin grid place-items-center [height:38px] [color:#81898f] [&_.brand-mark]:[width:23px] [&_.brand-mark]:[height:23px]"} aria-hidden="true"><BrandMark /></div>
        </div>
        <div className={"landing-computer-stand [width:20%] [height:58px] [margin:0_auto] [background:linear-gradient(90deg,_#b9bec2,_#e6e8e9_50%,_#c4c9cc)] [clip-path:polygon(18%_0,_82%_0,_100%_100%,_0_100%)]"} aria-hidden="true" />
        <div className={"landing-computer-foot [width:38%] [height:9px] [margin:-2px_auto_0] [border-radius:50%_50%_4px_4px] [background:#c4c9cc] [box-shadow:0_10px_16px_#55595c20]"} aria-hidden="true" />
      </div>
      <div className={"landing-duck-reaction absolute [z-index:2] [width:66%] [margin-left:-42px] [margin-top:230px] [transform:translate(var(--duck-react-x,_0px),_var(--duck-react-y,_0px))] [transition:transform_220ms_ease-out] [left:-7%] [bottom:28px] [max-width:400px] [margin:0] [&_.landing-duck]:w-full [&_.landing-duck]:[margin:0] [@media_(min-width:_1024px)_and_(max-width:_1279px)]:w-full [@media_(min-width:_1024px)_and_(max-width:_1279px)]:[max-width:400px] [@media_(min-width:_1024px)_and_(max-width:_1279px)]:[margin-left:-32px] [@media_(max-width:_1023px)]:[width:min(80%,_420px)] [@media_(max-width:_1023px)]:[margin-left:-16px] [@media_(max-width:_1023px)]:[margin-top:220px] [@media_(max-width:_479px)]:[width:70%] [@media_(max-width:_479px)]:[margin-top:250px] [@media_(max-width:_479px)]:[margin-left:-12px] [@media_(max-width:_479px)]:[left:-5%] [@media_(max-width:_479px)]:[bottom:32px] [@media_(prefers-reduced-motion:_reduce)]:[transform:none] [@media_(prefers-reduced-motion:_reduce)]:transition-none [&_.landing-duck-frame]:absolute [&_.landing-duck-frame]:[inset:0] [&_.landing-duck-frame]:w-full [&_.landing-duck-frame]:h-full [&_.landing-duck-frame]:[opacity:0] [&_.landing-duck-frame]:[animation:landing-duck-crossfade_16s_linear_infinite] [@media_(prefers-reduced-motion:_reduce)]:[&_.landing-duck-frame]:animate-none"}>
        <div className={"landing-duck-cycle relative w-full [aspect-ratio:1] [animation:landing-float_6s_ease-in-out_infinite] [@media_(prefers-reduced-motion:_reduce)]:animate-none"} role="img" aria-label="Clario duck mascot in different moods">
          {duckVariants.map((duck, index) => <img key={duck.src} className={"landing-duck relative [width:min(80%,_300px)] [aspect-ratio:1] object-contain block [animation:landing-float_6s_ease-in-out_infinite] [filter:drop-shadow(0_18px_10px_#9679241c)] [@media_(max-width:_1023px)]:[width:240px] [@media_(prefers-reduced-motion:_reduce)]:animate-none landing-duck-frame [&:first-child]:[opacity:1] [@media_(prefers-reduced-motion:_reduce)]:[opacity:0] [@media_(prefers-reduced-motion:_reduce)]:[&:first-child]:[opacity:1]"} src={duck.src} width="500" height="500" alt="" aria-hidden="true" style={{ animationDelay: String(index * 4 - 16) + "s" }} />)}
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
      panorama.to(select('.landing-hero-copy'), { x: desktop ? -40 : -10, y: -35, rotation: -1, ease: 'none' }, 0);
      panorama.to(select('.landing-mascot'), { x: desktop ? 55 : 10, y: -65, ease: 'none' }, 0);

      gsap.fromTo(select('.landing-waves svg'), { xPercent: -3, scaleX: 1.12 }, {
        xPercent: 3, scaleX: 1.12, ease: 'none',
        scrollTrigger: { trigger: ocean, start: 'top bottom', end: 'top top', scrub: 1 },
      });
      gsap.fromTo(select('.landing-underwater figure'), { x: desktop ? 45 : 0, y: 45, rotation: desktop ? 3 : 0 }, {
        x: 0, y: 0, rotation: desktop ? -1 : 0, ease: 'none',
        scrollTrigger: { trigger: select('.landing-underwater')[0], start: 'top 90%', end: 'top 25%', scrub: 0.8 },
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
  const primaryButton = "inline-flex cursor-pointer items-center justify-between gap-6 rounded-full bg-[#2378db] font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#1969c5] motion-reduce:transform-none motion-reduce:transition-none";

  return (
    <div ref={pageRef} className={"relative isolate min-h-screen overflow-hidden bg-[#F7F1D8] landing-page [--font-sans:'DM_Sans',_sans-serif] [--font-detail:'Inter',_sans-serif] [font-family:var(--font-sans)] [background-color:#F7F1D8] [&_#landing-title]:[font-family:var(--font-sans)] [&_#landing-title]:font-semibold [&_#landing-title]:[font-size:clamp(40px,_4.7vw,_76px)] [&_#landing-title]:[line-height:1.2] [&_#landing-title]:[letter-spacing:-0.025em] [&_#landing-title]:[overflow-wrap:anywhere] [&_:where(nav,_p,_dl,_figcaption,_footer,_button)]:[font-family:var(--font-detail)] font-sans text-[#191d20] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[#191d20]"}>
      <header className="relative z-10 px-6 pt-4 md:px-[7%] md:pt-6">
        <nav aria-label="Main navigation" className={"landing-nav [&_button:not(.landing-brand)]:[min-height:44px] mx-auto flex min-h-[64px] max-w-[1440px] items-center justify-between gap-6 border-b border-[#191d20]/10 py-3"}>
          <button onClick={() => navigate("/")} aria-label="Clario home" className={"landing-brand grid place-items-center [width:48px] [height:48px] [border-radius:12px] [color:#2378db] [transition:background_180ms_ease,_color_180ms_ease] [&_.brand-mark]:[width:46px] [&_.brand-mark]:[height:46px] [&:hover]:[color:#175daf] [&:hover]:[background:#e7f0fc] [@media_(prefers-reduced-motion:_reduce)]:transition-none [@media_(prefers-reduced-motion:_reduce)]:animate-none cursor-pointer"}><BrandMark /></button>
          <div className="flex items-center gap-4 sm:gap-6"><button onClick={() => navigate("/login")} className="cursor-pointer py-2 text-sm font-semibold hover:underline hover:underline-offset-4">Log in</button><button onClick={() => navigate("/signup")} className={`${primaryButton} min-h-10 gap-2 px-3 py-2 text-sm sm:gap-6 sm:px-4`}>Sign up <span aria-hidden="true">&#8599;</span></button></div>
        </nav>
      </header>
      <main>
        <div className="landing-hero mx-auto grid max-w-[1672px] items-center gap-8 px-6 pb-4 pt-12 md:px-[7%] lg:grid-cols-[1.35fr_1fr] lg:gap-16 lg:pb-2 lg:pt-14">
          <section className="landing-hero-copy" aria-labelledby="landing-title">
            <div className="mb-8 flex items-center gap-4 font-sans text-xs font-semibold tracking-widest"><span className="h-0.5 w-8 bg-[#3b8fe8]" aria-hidden="true" />AI MOCK INTERVIEWER</div>
            <h1 id="landing-title" aria-label="CRACK THE TECHNICAL INTERVIEW" className="m-0 max-w-[760px] text-balance text-[clamp(44px,4.7vw,76px)] font-sans font-semibold uppercase leading-[1.05] tracking-normal"><DecryptedText key={headlineReversed ? "crack" : "quack"} text={headlineReversed ? "CRACK" : "QUACK"} initialText={headlineReversed ? "QUACK" : "CRACK"} delay={1500} animateOn="view" onComplete={() => setHeadlineReversed((value) => !value)} sequential speed={100} revealDirection="start" characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ" encryptedClassName="text-[#3b8fe8]" /> THE TECHNICAL INTERVIEW</h1>
            <p className="mt-8 max-w-[456px] text-[17px] leading-[1.7] text-[#55595c]">A live AI-powered technical interview coach helping you practice smarter, get real-time feedback, and build confidence.</p>
            <button onClick={() => navigate("/signup")} className={`${primaryButton} mt-8 min-h-14 min-w-[184px] px-6 py-4`}>Join today <span aria-hidden="true" className="text-xl">&#8599;</span></button>
            <div className="mt-12 flex max-w-[520px] flex-wrap gap-x-6 gap-y-4 border-t border-[#191d20]/15 pt-6 font-sans text-xs text-[#55595c]" aria-label="How Clario helps you prepare">{["Practice", "Get feedback", "Build confidence"].map((label, index) => <span key={label}><b className="mr-2 font-sans text-[11px] font-normal">0{index + 1}</b>{label}</span>)}</div>
          </section>
          <LandingMascot />

        </div>
        <div className={"landing-ocean relative isolate [background:linear-gradient(180deg,_#4E90EE_0%,_#4E90EE_24%,_#4486e4_65%,_#397ad5_100%)] [&_button:focus-visible]:[outline-color:white]"}><WaterWaves className={"landing-waves [background:#F7F1D8] relative h-20 overflow-hidden md:h-24"} /><div className={"ocean-light pointer-events-none absolute [z-index:-1] [inset:176px_0_0] [mask-image:linear-gradient(transparent,_black_100px)] overflow-hidden [&::before]:[content:''] [&::before]:absolute [&::before]:[inset:-40%_-20%] [&::before]:[background:repeating-conic-gradient(from_168deg_at_50%_0%,_transparent_0deg_9deg,_#c0efff14_10deg_14deg,_transparent_15deg_26deg)] [&::before]:[filter:blur(14px)] [&::before]:[animation:ocean-sway_18s_ease-in-out_infinite_alternate] [@media_(prefers-reduced-motion:_reduce)]:[&::before]:animate-none"} aria-hidden="true" /><div className={"ocean-bubbles pointer-events-none absolute [z-index:-1] [inset:150px_0_0] overflow-hidden [&_i]:absolute [&_i]:[bottom:-60px] [&_i]:[left:8%] [&_i]:[width:20px] [&_i]:[height:20px] [&_i]:[border:1px_solid_#d8f5ff40] [&_i]:rounded-full [&_i]:[box-shadow:inset_3px_3px_6px_#ffffff12] [&_i]:[animation:ocean-rise_17s_linear_infinite] [&_i:nth-child(2)]:[left:24%] [&_i:nth-child(2)]:[width:10px] [&_i:nth-child(2)]:[height:10px] [&_i:nth-child(2)]:[animation-delay:-8s] [&_i:nth-child(3)]:[left:45%] [&_i:nth-child(3)]:[width:28px] [&_i:nth-child(3)]:[height:28px] [&_i:nth-child(3)]:[animation-delay:-3s] [&_i:nth-child(3)]:[animation-duration:22s] [&_i:nth-child(4)]:[left:68%] [&_i:nth-child(4)]:[width:12px] [&_i:nth-child(4)]:[height:12px] [&_i:nth-child(4)]:[animation-delay:-12s] [&_i:nth-child(5)]:[left:84%] [&_i:nth-child(5)]:[animation-delay:-6s] [&_i:nth-child(5)]:[animation-duration:20s] [&_i:nth-child(6)]:[left:94%] [&_i:nth-child(6)]:[width:9px] [&_i:nth-child(6)]:[height:9px] [&_i:nth-child(6)]:[animation-delay:-14s] [@media_(prefers-reduced-motion:_reduce)]:[&_i]:animate-none [@media_(prefers-reduced-motion:_reduce)]:[&_i]:[bottom:25%]"} aria-hidden="true">{[0, 1, 2, 3, 4, 5].map((bubble) => <i key={bubble} />)}</div>
        <section aria-labelledby="landing-info-title" className={"landing-underwater [color:#fff] [&_>_div_>_div:first-child_p]:[color:#dfedff] [&_dd]:[color:#dfedff] [&_dl_>_div]:[border-color:#ffffff26] [&_dt_span]:[color:#b6d8ff] [&_>_div_>_div:first-child_>_div:first-child]:[color:#d2eaff] [&_>_div_>_div:first-child_>_div:first-child_>_span]:[background:#b6e8ff] [&_>_div_>_div:first-child_>_button]:text-white [&_>_div_>_div:first-child_>_button]:[border-color:#ffffff80] [&_>_div_>_div:first-child_>_button:hover]:[color:#c6eaff] [&_figure]:[color:#191d20] [&_figure]:[box-shadow:0_32px_80px_-24px_#03284c80] [&_figure]:[border-color:#ffffff60] [&_figure]:[transform:rotate(1deg)] [@media_(max-width:_1023px)]:[&_figure]:[transform:none] relative z-10 px-6 py-14 md:px-[7%] md:py-22"}>
          <div className="mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
            <div>
              <div className="mb-6 flex items-center gap-4 font-sans text-[11px] font-semibold tracking-widest"><span className="h-0.5 w-8 bg-[#3b8fe8]" aria-hidden="true" />INSIDE THE PRACTICE ROOM</div>
              <h2 id="landing-info-title" className="text-[clamp(32px,3.1vw,48px)] font-semibold leading-[1.12] tracking-[-0.045em]">Good code is only<br />half the conversation.</h2>
              <p className="mb-8 mt-6 max-w-[456px] text-[15px] leading-[1.8] text-[#454b50]">Clario is designed to help you solve problems while explaining your thinking out loud. Practice the reasoning, follow-ups, and communication that a submitted solution alone cannot capture.</p>
              <dl>{details.map((detail, index) => <div key={detail.title} className="border-t border-[#191d20]/15 py-6"><dt className="text-[15px] font-semibold"><span className="mr-4 font-sans text-[11px] font-normal text-[#454b50]">0{index + 1}</span>{detail.title}</dt><dd className="ml-8 mt-2 max-w-[400px] font-sans text-[13px] leading-[1.7] text-[#454b50]">{detail.description}</dd></div>)}</dl>
              <button onClick={() => navigate("/signup")} className="inline-flex cursor-pointer items-center gap-6 border-b border-[#191d20] py-2 text-sm font-semibold hover:text-[#2f7fe2]">Start practicing <span aria-hidden="true">&#8599;</span></button>
            </div>
            <CodingPreview />
          </div>
        </section>
<footer className={"ocean-footer relative flex items-center justify-between flex-wrap [gap:20px] [margin:0_7%] [padding:28px_0] [border-top:1px_solid_#ffffff26] [color:#c5def6] [font-size:12px] [&_button]:cursor-pointer [&_button]:text-white"}><span className="font-semibold tracking-tight">CLARIO.</span><span>Find your flow. Get interview ready.</span><button onClick={() => navigate("/signup")}>Take the first step &#8599;</button></footer></div>
      </main>
    </div>
  );
}




