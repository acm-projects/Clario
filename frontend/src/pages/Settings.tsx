import NavbarDashboard from "../components/NavbarDashboard";
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

  return <main className="app-sidebar-layout settings-page min-h-svh px-4 pb-10 pt-2 font-sans text-[#191d20] sm:px-6">
    <NavbarDashboard />
    <section className="settings-shell">
      <header className="workspace-page-heading"><p className="workspace-eyebrow">MAKE YOURSELF AT HOME</p><h1>Settings</h1><p>A familiar name. A fresh starting point. Your practice, your way.</p></header>
      <form onSubmit={(event) => void submitName(event)} className="settings-surface" aria-busy={saving}>
        <h2>What should Clario call you?</h2><p>Your display name is how your duck coach greets you.</p>
        <label htmlFor="display-name" className="settings-label">Display name</label>
        <div className="settings-name-row"><input id="display-name" className="library-input" autoComplete="nickname" required maxLength={60} value={displayName} disabled={saving} onChange={(event) => { setDisplayName(event.target.value); setSaved(false); setSaveError(null); }} /><button className="settings-save" disabled={saving || !displayName.trim() || displayName.trim() === (profile.display_name || "").trim()} type="submit">{saving ? "Saving..." : "Save name"}</button></div>
        {saveError && <p role="alert" className="settings-save-error">{saveError}</p>}{saved && <p role="status" className="settings-save-success">Saved. Clario will call you {profile.display_name}.</p>}
      </form>
      <section className="settings-surface" aria-labelledby="practice-settings-title"><h2 id="practice-settings-title">Your practice starting point</h2><p>Retake your assessment whenever you want to refresh your preferences.</p><dl className="settings-profile">{[{ label: "Preferred language", value: profile.preferred_language }, { label: "Current difficulty", value: profile.starting_difficulty }, { label: "Weekly interview goal", value: profile.weekly_interview_goal === 5 ? "5+" : profile.weekly_interview_goal?.toString() }].map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value || "Not set"}</dd></div>)}</dl><button ref={retakeButtonRef} type="button" onClick={() => setConfirming(true)} className="settings-retake">Retake assessment <span aria-hidden="true">&#8599;</span></button></section>
    </section>
    <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); close(); }} onClose={() => setConfirming(false)} aria-labelledby="retake-title" aria-describedby="retake-description" className="fixed inset-0 m-auto w-[calc(100%_-_48px)] max-w-[480px] rounded-2xl border border-[#191d20]/10 bg-[#f6efd9] p-8 text-[#191d20] shadow-xl backdrop:bg-[#191d20]/30"><h2 id="retake-title" className="text-2xl font-semibold tracking-tight">Retake your assessment?</h2><p id="retake-description" className="mt-4 text-sm leading-7 text-[#55595c]">Your new answers will update your practice language, difficulty, and recommendations.</p><div className="mt-8 flex flex-wrap justify-end gap-4"><button type="button" onClick={close} className="rounded-lg px-4 py-3 text-sm">Cancel</button><button type="button" onClick={startRetake} className="rounded-lg bg-[#3b8fe8] px-5 py-3 text-sm font-semibold hover:bg-[#6eaff8]">Retake assessment</button></div></dialog>
  </main>;
}