import NavbarDashboard from "../components/layout/NavbarDashboard";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { saveDisplayName, validateDisplayName, type ProfileContext } from "../lib/profile";
import { supabase } from "../lib/supabase";

export default function Settings() {
  const { user, profile, startRetake, updateDisplayName } = useOutletContext<ProfileContext>();
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

  return <main className={"app-sidebar-layout [--sidebar-width:224px] [&:has(.sidebar-collapsed)]:[--sidebar-width:80px] [@media_(min-width:_1024px)]:[padding-left:calc(var(--sidebar-width)_+_48px)] [@media_(min-width:_1024px)]:[padding-right:24px] [@media_(min-width:_1024px)]:[padding-top:24px] settings-page [background:#f7f1d8] [&_:is(a,_button,_input):focus-visible]:[outline:2px_solid_#2378db] [&_:is(a,_button,_input):focus-visible]:[outline-offset:4px] [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_button:disabled]:[opacity:.5] min-h-svh px-4 pb-10 pt-2 font-sans text-[#191d20] sm:px-6"}>
    <NavbarDashboard />
    <section className={"settings-shell [max-width:800px] [margin-inline:auto] [padding-block:40px] [@media_(min-width:_768px)]:[padding-block:56px]"}>
      <header className={"workspace-page-heading [margin-bottom:32px] [&_h1]:[margin-top:12px] [&_h1]:[font-size:clamp(32px,_3.5vw,_48px)] [&_h1]:[line-height:1.15] [&_h1]:font-semibold [&_h1]:[letter-spacing:-.045em] [&_>_p:last-child]:[margin-top:14px] [&_>_p:last-child]:[font-size:14px] [&_>_p:last-child]:[line-height:1.8] [&_>_p:last-child]:[color:#657077]"}><p className={"workspace-eyebrow [font-size:10px] font-semibold [letter-spacing:.13em] [color:#2565b4]"}>MAKE YOURSELF AT HOME</p><h1>Settings</h1><p>A familiar name. A fresh starting point. Your practice, your way.</p></header>
      <form onSubmit={(event) => void submitName(event)} className={"settings-surface [margin-top:24px] [padding:clamp(24px,_3vw,_32px)] [border:1px_solid_#dce5ed] [border-radius:18px] [background:#fffdf8] [box-shadow:0_10px_28px_-24px_#12354c40] [&_h2]:[font-size:20px] [&_h2]:font-semibold [&_h2]:[letter-spacing:-.03em] [&_>_p]:[margin-top:10px] [&_>_p]:[font-size:13px] [&_>_p]:[line-height:1.8] [&_>_p]:[color:#657077] [&_.settings-save-error]:[color:#a33b3b] [&_.settings-save-success]:[color:#3a6d48]"} aria-busy={saving}>
        <h2>What should Clario call you?</h2><p>Your display name is how your duck coach greets you.</p>
        <label htmlFor="display-name" className={"settings-label block [margin-block:24px_10px] [font-size:12px] font-medium"}>Display name</label>
        <div className={"settings-name-row flex [gap:12px] [&_input]:flex-1 [&_input]:min-w-0 [@media_(max-width:_479px)]:flex-col"}><input id="display-name" className={"library-input [min-height:44px] w-full [border:1px_solid_#191d2018] [border-radius:10px] [background:white] [padding:10px_12px] [color:#191d20] [font-size:13px] [&:focus-visible]:[outline:2px_solid_#2378db] [&:focus-visible]:[outline-offset:2px]"} autoComplete="nickname" required maxLength={60} value={displayName} disabled={saving} onChange={(event) => { setDisplayName(event.target.value); setSaved(false); setSaveError(null); }} /><button className={"settings-save shrink-0 [min-height:44px] [padding:10px_18px] [border-radius:10px] [background:#2378db] text-white [font-size:12px] font-semibold [&:hover:not(:disabled)]:[background:#1969c5]"} disabled={saving || !displayName.trim() || displayName.trim() === (profile.display_name || "").trim()} type="submit">{saving ? "Saving..." : "Save name"}</button></div>
        {saveError && <p role="alert" className="settings-save-error">{saveError}</p>}{saved && <p role="status" className="settings-save-success">Saved. Clario will call you {profile.display_name}.</p>}
      </form>
      <section className={"settings-surface [margin-top:24px] [padding:clamp(24px,_3vw,_32px)] [border:1px_solid_#dce5ed] [border-radius:18px] [background:#fffdf8] [box-shadow:0_10px_28px_-24px_#12354c40] [&_h2]:[font-size:20px] [&_h2]:font-semibold [&_h2]:[letter-spacing:-.03em] [&_>_p]:[margin-top:10px] [&_>_p]:[font-size:13px] [&_>_p]:[line-height:1.8] [&_>_p]:[color:#657077] [&_.settings-save-error]:[color:#a33b3b] [&_.settings-save-success]:[color:#3a6d48]"} aria-labelledby="practice-settings-title"><h2 id="practice-settings-title">Your practice starting point</h2><p>Retake your assessment whenever you want to refresh your preferences.</p><dl className={"settings-profile [margin-top:20px] [&_>_div]:flex [&_>_div]:justify-between [&_>_div]:flex-wrap [&_>_div]:[gap:12px] [&_>_div]:[padding-block:14px] [&_>_div]:[border-bottom:1px_solid_#191d2010] [&_>_div]:[font-size:13px] [&_dt]:[color:#657077] [&_dd]:font-medium"}>{[{ label: "Preferred language", value: profile.preferred_language }, { label: "Current difficulty", value: profile.starting_difficulty }, { label: "Weekly interview goal", value: profile.weekly_interview_goal === 5 ? "5+" : profile.weekly_interview_goal?.toString() }].map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value || "Not set"}</dd></div>)}</dl><button ref={retakeButtonRef} type="button" onClick={() => setConfirming(true)} className={"settings-retake flex items-center justify-between [gap:24px] [min-height:44px] [margin-top:24px] [color:#2378db] [font-size:13px] font-semibold [&:hover]:[text-decoration:underline] [&:hover]:[text-underline-offset:4px]"}>Retake assessment <span aria-hidden="true">&#8599;</span></button></section>
    </section>
    <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); close(); }} onClose={() => setConfirming(false)} aria-labelledby="retake-title" aria-describedby="retake-description" className="fixed inset-0 m-auto w-[calc(100%_-_48px)] max-w-[480px] rounded-2xl border border-[#191d20]/10 bg-[#f6efd9] p-8 text-[#191d20] shadow-xl backdrop:bg-[#191d20]/30"><h2 id="retake-title" className="text-2xl font-semibold tracking-tight">Retake your assessment?</h2><p id="retake-description" className="mt-4 text-sm leading-7 text-[#55595c]">Your new answers will update your practice language, difficulty, and recommendations.</p><div className="mt-8 flex flex-wrap justify-end gap-4"><button type="button" onClick={close} className="rounded-lg px-4 py-3 text-sm">Cancel</button><button type="button" onClick={startRetake} className="rounded-lg bg-[#3b8fe8] px-5 py-3 text-sm font-semibold hover:bg-[#6eaff8]">Retake assessment</button></div></dialog>
  </main>;
}