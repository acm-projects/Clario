import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DecryptedText from "../components/DecryptedText";
import WaterWaves from "../components/WaterWaves";
import BrandMark from "../components/BrandMark";

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
    <div className="landing-mascot" onPointerMove={(event) => {
      if (reducedMotion || event.pointerType === "touch") return;
      const bounds = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty("--duck-react-x", `${((event.clientX - bounds.left) / bounds.width - 0.5) * 16}px`);
      event.currentTarget.style.setProperty("--duck-react-y", `${((event.clientY - bounds.top) / bounds.height - 0.5) * 10}px`);
    }} onPointerLeave={(event) => {
      event.currentTarget.style.setProperty("--duck-react-x", "0px");
      event.currentTarget.style.setProperty("--duck-react-y", "0px");
    }}>
      <div className="landing-computer" aria-label="Animated interview demo on a desktop computer">
        <div className="landing-computer-display">
          <span className="landing-computer-camera" aria-hidden="true" />
          <div className="landing-computer-screen"><CodingPreview /></div>
          <div className="landing-computer-chin" aria-hidden="true"><BrandMark /></div>
        </div>
        <div className="landing-computer-stand" aria-hidden="true" />
        <div className="landing-computer-foot" aria-hidden="true" />
      </div>
      <div className="landing-duck-reaction">
        <div className="landing-duck-cycle" role="img" aria-label="Clario duck mascot in different moods">
          {duckVariants.map((duck, index) => <img key={duck.src} className="landing-duck landing-duck-frame" src={duck.src} width="500" height="500" alt="" aria-hidden="true" style={{ animationDelay: String(index * 4 - 16) + "s" }} />)}
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
    <div ref={pageRef} className="relative isolate min-h-screen overflow-hidden bg-[#F7F1D8] landing-page font-sans text-[#191d20] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[#191d20]">
      <header className="relative z-10 px-6 pt-4 md:px-[7%] md:pt-6">
        <nav aria-label="Main navigation" className="landing-nav mx-auto flex min-h-[64px] max-w-[1440px] items-center justify-between gap-6 border-b border-[#191d20]/10 py-3">
          <button onClick={() => navigate("/")} aria-label="Clario home" className="landing-brand cursor-pointer"><BrandMark /></button>
          <div className="flex items-center gap-4 sm:gap-6"><button onClick={() => navigate("/login")} className="cursor-pointer py-2 text-sm font-semibold hover:underline hover:underline-offset-4">Log in</button><button onClick={() => navigate("/signup")} className={`${primaryButton} min-h-10 gap-2 px-3 py-2 text-sm sm:gap-6 sm:px-4`}>Sign up <span aria-hidden="true">&#8599;</span></button></div>
        </nav>
      </header>
      <main>
        <div className="landing-hero mx-auto grid max-w-[1672px] items-center gap-12 px-6 py-16 md:px-[7%] lg:min-h-[calc(100svh-224px)] lg:grid-cols-[1.35fr_1fr] lg:gap-16 lg:pb-20 lg:pt-22">
          <section className="landing-hero-copy" aria-labelledby="landing-title">
            <div className="mb-8 flex items-center gap-4 font-sans text-xs font-semibold tracking-widest"><span className="h-0.5 w-8 bg-[#3b8fe8]" aria-hidden="true" />AI MOCK INTERVIEWER</div>
            <h1 id="landing-title" aria-label="CRACK THE TECHNICAL INTERVIEW" className="m-0 max-w-[760px] text-balance text-[clamp(44px,4.7vw,76px)] font-sans font-semibold uppercase leading-[1.05] tracking-normal"><DecryptedText key={headlineReversed ? "crack" : "quack"} text={headlineReversed ? "CRACK" : "QUACK"} initialText={headlineReversed ? "QUACK" : "CRACK"} delay={1500} animateOn="view" onComplete={() => setHeadlineReversed((value) => !value)} sequential speed={100} revealDirection="start" characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ" encryptedClassName="text-[#3b8fe8]" /> THE TECHNICAL INTERVIEW</h1>
            <p className="mt-8 max-w-[456px] text-[17px] leading-[1.7] text-[#55595c]">A live AI-powered technical interview coach helping you practice smarter, get real-time feedback, and build confidence.</p>
            <button onClick={() => navigate("/signup")} className={`${primaryButton} mt-8 min-h-14 min-w-[184px] px-6 py-4`}>Join today <span aria-hidden="true" className="text-xl">&#8599;</span></button>
            <div className="mt-12 flex max-w-[520px] flex-wrap gap-x-6 gap-y-4 border-t border-[#191d20]/15 pt-6 font-sans text-xs text-[#55595c]" aria-label="How Clario helps you prepare">{["Practice", "Get feedback", "Build confidence"].map((label, index) => <span key={label}><b className="mr-2 font-sans text-[11px] font-normal">0{index + 1}</b>{label}</span>)}</div>
          </section>
          <LandingMascot />

        </div>
        <div className="landing-ocean"><WaterWaves className="landing-waves relative h-32 overflow-hidden md:h-44" /><div className="ocean-light" aria-hidden="true" /><div className="ocean-bubbles" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map((bubble) => <i key={bubble} />)}</div>
        <section aria-labelledby="landing-info-title" className="landing-underwater relative z-10 px-6 py-14 md:px-[7%] md:py-22">
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
<footer className="ocean-footer"><span className="font-semibold tracking-tight">CLARIO.</span><span>Find your flow. Get interview ready.</span><button onClick={() => navigate("/signup")}>Take the first step &#8599;</button></footer></div>
      </main>
    </div>
  );
}




