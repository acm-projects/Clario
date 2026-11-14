import PageClouds from "../components/effects/PageClouds";
import DuckHead from "../components/layout/DuckHead";
import { useAppearance, setAppearance } from "../lib/appearance";
import PageHeading from "../components/ui/PageHeading";
import NavbarDashboard from "../components/layout/NavbarDashboard";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { saveDisplayName, validateDisplayName, type ProfileContext } from "../lib/profile";
import { supabase } from "../lib/supabase";

export default function Settings() {
  const { user, profile, startRetake, updateDisplayName } = useOutletContext<ProfileContext>();
  const appearance = useAppearance();
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
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

  async function submitName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true); setSaveError(null); setSaved(false);
    try {
      let name: string;
      if (import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === "true") {
        name = validateDisplayName(displayName);
        const key = `clario:dev-profile:${user.id}`;
        const previous = JSON.parse(sessionStorage.getItem(key) || "{}");
        sessionStorage.setItem(key, JSON.stringify({ ...previous, display_name: name }));
      } else {
        name = await saveDisplayName(supabase, displayName, user.id);
      }
      updateDisplayName(name); setDisplayName(name); setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "We couldn't save your display name. Please try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const card = "rounded-[28px] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[0_16px_48px_-32px_#18213735] sm:p-8";
  return <main className={"app-sidebar-layout [&.app-sidebar-layout:has(.sidebar-collapsed)]:[--sidebar-width:var(--sidebar-compact)] [--sidebar-width:224px] [&:has(.sidebar-collapsed)]:[--sidebar-width:80px] [@media_(min-width:_1024px)]:[padding-left:calc(var(--sidebar-width)_+_48px)] [@media_(min-width:_1024px)]:[padding-right:24px] [@media_(min-width:_1024px)]:[padding-top:24px] settings-page [background:var(--page-background)] [&_:is(a,_button,_input):focus-visible]:[outline:2px_solid_#3054ed] [&_:is(a,_button,_input):focus-visible]:[outline-offset:4px] [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_button:disabled]:[opacity:.5] min-h-svh px-4 pb-10 pt-2 font-sans text-[#182137] sm:px-6"}>
    <PageClouds />
    <NavbarDashboard />
    <section className="mx-auto max-w-[1120px] py-8 sm:py-12">
      <PageHeading eyebrow="YOUR CORNER OF CLARIO" title="Settings" subtitle="Manage your profile, appearance, and practice preferences." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,1fr)]">
        <form onSubmit={event => void submitName(event)} className={`${card} relative overflow-hidden`} aria-busy={saving}>
          <div className="relative flex items-center gap-4">

            <div><p className="text-[10px] font-semibold tracking-[.18em] text-[var(--text-muted)]">PROFILE</p><h2 className="mt-1 text-xl font-semibold tracking-tight">Your profile</h2></div>
          </div>
          <label htmlFor="display-name" className="mb-2 mt-8 block text-sm font-medium">Display name</label>
          <input id="display-name" className="min-h-14 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-base text-[var(--text)] transition-colors focus:border-[#8195ed]" placeholder="Your display name" autoComplete="nickname" required maxLength={60} value={displayName} disabled={saving} aria-describedby="display-name-help name-feedback" aria-invalid={Boolean(saveError)} onChange={event => { setDisplayName(event.target.value); setSaved(false); setSaveError(null); }} />
          <div id="display-name-help" className="mt-2 flex justify-between gap-3 text-xs text-[var(--text-muted)]"><span>Your duck coach will greet you by this name.</span><span className="shrink-0 tabular-nums">{displayName.length}/60</span></div>
          <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-[10px] font-medium tracking-widest text-[var(--text-muted)]">PREVIEW</p><p className="mt-2 text-lg font-medium tracking-tight">Welcome back, <span data-name-preview>{displayName.trim() || "your name"}</span>.</p>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4"><div className="min-w-0"><p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Signed in as</p><p className="mt-1 break-all text-xs text-[var(--text-muted)]">{user.email || "Local practice account"}</p></div><button type="submit" className="min-h-11 rounded-xl bg-[#4566ed] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#3655d8]" disabled={saving || !displayName.trim() || displayName.trim() === (profile.display_name || "").trim()}>{saving ? "Saving..." : "Save changes ↗"}</button></div>
          <div id="name-feedback" aria-live="polite">{saveError && <p role="alert" className="mt-4 text-sm text-[#de6675]">{saveError}</p>}{saved && <p role="status" className="mt-4 text-sm text-[var(--success)]">Saved. Looking good, {profile.display_name}.</p>}</div>
        </form>
        <section className={card} aria-labelledby="appearance-title">
          <p className="text-[10px] font-semibold tracking-[.18em] text-[var(--text-muted)]">SET THE SCENE</p><h2 id="appearance-title" className="mt-2 text-xl font-semibold tracking-tight">Appearance</h2><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Light is the default. Choose dark for a dimmer workspace.</p>
          <fieldset className="mt-6 grid grid-cols-2 gap-3"><legend className="sr-only">Workspace appearance</legend>{(["light", "dark"] as const).map(mode => <label key={mode} className={`relative cursor-pointer rounded-[20px] border-2 p-2.5 transition-colors ${appearance === mode ? "border-[#8195ed] bg-[#4566ed]/10" : "border-[var(--border)] hover:border-[#8195ed]/60"}`}>
            <input type="radio" name="appearance" value={mode} checked={appearance === mode} onChange={() => setAppearance(mode)} className="peer sr-only" />
            <span aria-hidden="true" className={`flex h-24 overflow-hidden rounded-xl border border-black/10 ${mode === "dark" ? "bg-[#10192c]" : "bg-[#fbf4df]"}`}><span className="flex w-6 flex-col gap-2 bg-[#182137] p-1.5"><i className="size-2 rounded-full bg-[#ffdf4f]" /><i className="h-1 rounded bg-white/40" /><i className="h-1 rounded bg-white/20" /></span><span className="flex flex-1 flex-col gap-2 p-2"><i className={`h-1.5 w-10 rounded ${mode === "dark" ? "bg-white/50" : "bg-[#182137]/30"}`} /><span className="grid flex-1 grid-cols-[1.3fr_1fr] gap-1"><i className="rounded-md bg-[#4566ed]" /><i className="rounded-md bg-[#ffdf4f]" /></span><i className={`h-4 rounded-md ${mode === "dark" ? "bg-[#25334d]" : "bg-white"}`} /></span></span>
            <span className="mt-3 flex items-center justify-between gap-1 px-1 text-xs font-semibold capitalize peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[#8195ed]"><span>{mode === "light" ? "☀ Light" : "☾ Dark"}</span><span aria-hidden="true" className={`grid size-4 place-items-center rounded-full border ${appearance === mode ? "border-[#4566ed] bg-[#4566ed] text-white" : "border-[var(--border)]"}`}>{appearance === mode ? "✓" : ""}</span></span>
          </label>)}</fieldset>
          <p role="status" className="mt-4 text-xs leading-5 text-[var(--text-muted)]">{appearance === "dark" ? "Night owl mode is on." : "A little sunshine for your workspace."} Saved on this browser and shared with your interview room.</p>
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#ffdf4f] p-4 text-[#182137]"><DuckHead className="size-11" /><p className="text-xs leading-5">Same duck. Different lighting.<br /><strong>Still rooting for you.</strong></p></div>
        </section>
        <section className={`${card} lg:col-span-2`} aria-labelledby="practice-settings-title">
          <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-[10px] font-semibold tracking-[.18em] text-[var(--text-muted)]">YOUR STARTING LINE</p><h2 id="practice-settings-title" className="mt-2 text-xl font-semibold tracking-tight">Practice preferences</h2><p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Your assessment shapes your recommendations. Refresh it as you grow.</p></div><button ref={retakeButtonRef} type="button" onClick={() => setConfirming(true)} className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold hover:border-[#8195ed]">Retake assessment ↗</button></div>
          <dl className="mt-7 grid gap-3 sm:grid-cols-3">{[{ label: "Your coding language", value: profile.preferred_language, symbol: "</>" }, { label: "Starting difficulty", value: profile.starting_difficulty, symbol: "↗" }, { label: "Weekly interview goal", value: profile.weekly_interview_goal === 5 ? "5+ sessions" : profile.weekly_interview_goal ? `${profile.weekly_interview_goal} sessions` : null, symbol: "↗" }].map(item => <div key={item.label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><span aria-hidden="true" className="font-mono text-xl text-[#8195ed]">{item.symbol}</span><dt className="mt-4 text-xs text-[var(--text-muted)]">{item.label}</dt><dd className="mt-1 text-lg font-semibold capitalize">{item.value || "Not set yet"}</dd></div>)}</dl>
        </section>
      </div>
      <p className="mt-7 text-center text-xs text-[var(--text-muted)]">Your preferences are ready for your next session.</p>
    </section>
    <dialog ref={dialogRef} onCancel={event => { event.preventDefault(); close(); }} onClose={() => setConfirming(false)} aria-labelledby="retake-title" aria-describedby="retake-description" className="fixed inset-0 m-auto w-[calc(100%_-_48px)] max-w-[480px] rounded-[28px] border border-[var(--border)] bg-[var(--surface-raised)] p-8 text-[var(--text)] shadow-xl backdrop:bg-[#101a35]/65"><h2 id="retake-title" className="text-2xl font-semibold tracking-tight">Ready for a fresh starting point?</h2><p id="retake-description" className="mt-4 text-sm leading-7 text-[var(--text-muted)]">Your new answers will update your practice language, difficulty, and recommendations.</p><div className="mt-8 flex flex-wrap justify-end gap-3"><button type="button" onClick={close} className="min-h-11 rounded-xl px-4 text-sm">Keep practicing</button><button type="button" onClick={startRetake} className="min-h-11 rounded-xl bg-[#4566ed] px-5 text-sm font-semibold text-white hover:bg-[#3655d8]">Let's recalibrate ↗</button></div></dialog>
  </main>;
}
