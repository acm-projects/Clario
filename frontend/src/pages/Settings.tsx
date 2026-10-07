import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import type { ProfileContext } from "../lib/profile";

export default function Settings() {
  const { profile, startRetake } = useOutletContext<ProfileContext>();
  const [confirming, setConfirming] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const retakeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [confirming]);

  function close() {
    setConfirming(false);
    retakeButtonRef.current?.focus();
  }

  return <main className="min-h-svh bg-[#F6EDD1] px-6 py-6 font-sans text-[#191d20] md:px-[7%] [&_button]:cursor-pointer [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4">
    <header className="mx-auto flex max-w-[1440px] items-center justify-between rounded-2xl border border-white/90 bg-white/55 px-6 py-4 backdrop-blur-xl"><Link to="/dashboard" className="text-2xl font-semibold tracking-[-0.07em]">CLARIO<span className="text-[#3b8fe8]">.</span></Link><Link to="/dashboard" className="text-sm text-[#55595c] hover:underline">Back to dashboard</Link></header>
    <section className="mx-auto mt-16 max-w-[720px]"><p className="font-detail text-[11px] tracking-wider text-[#55595c]">SETTINGS</p><h1 className="mt-6 text-4xl font-semibold tracking-[-0.045em]">Practice Profile</h1><div className="mt-8 rounded-2xl border border-white/90 bg-white/55 p-8 backdrop-blur-xl"><dl className="divide-y divide-[#191d20]/10">{[{ label: "Preferred language", value: profile.preferred_language }, { label: "Starting difficulty", value: profile.starting_difficulty }, { label: "Weekly interview goal", value: profile.weekly_interview_goal === 5 ? "5+" : profile.weekly_interview_goal?.toString() }].map((item) => <div key={item.label} className="flex flex-wrap justify-between gap-4 py-4"><dt className="text-sm text-[#55595c]">{item.label}</dt><dd className="text-sm font-semibold">{item.value || "Not set"}</dd></div>)}</dl><button ref={retakeButtonRef} type="button" onClick={() => setConfirming(true)} className="mt-8 rounded-lg bg-[#3b8fe8] px-6 py-3 text-sm font-semibold transition hover:bg-[#6eaff8] motion-reduce:transition-none">Retake assessment</button></div></section>
    <dialog ref={dialogRef} onCancel={(e) => { e.preventDefault(); close(); }} onClose={() => setConfirming(false)} aria-labelledby="retake-title" aria-describedby="retake-description" className="fixed inset-0 m-auto w-[calc(100%_-_48px)] max-w-[480px] rounded-2xl border border-[#191d20]/10 bg-[#F6EDD1] p-8 text-[#191d20] shadow-xl backdrop:bg-[#191d20]/30"><h2 id="retake-title" className="text-2xl font-semibold tracking-tight">Retake your assessment?</h2><p id="retake-description" className="mt-4 text-sm leading-7 text-[#55595c]">Your new answers will update your practice language, difficulty, and recommendations.</p><div className="mt-8 flex flex-wrap justify-end gap-4"><button type="button" onClick={close} className="rounded-lg px-4 py-3 text-sm">Cancel</button><button type="button" onClick={startRetake} className="rounded-lg bg-[#3b8fe8] px-5 py-3 text-sm font-semibold hover:bg-[#6eaff8]">Retake assessment</button></div></dialog>
  </main>;
}

