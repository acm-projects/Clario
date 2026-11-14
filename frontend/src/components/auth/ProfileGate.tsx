import { useEffect, useRef, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import type { ProfileContext, UserProfile } from "../../lib/profile";
import { shouldReloadAuthProfile } from "../../lib/authProfileEvents";
import { createRetakeAccess, getProfileRedirect } from "../../lib/profileRouting";

type LoadedProfile = { key: string; user: User | null; profile: UserProfile | null; error: string | null; retakeAllowed: boolean };

export default function ProfileGate() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState<LoadedProfile | null>(null);
  const [retry, setRetry] = useState(0);
  const [authChange, setAuthChange] = useState(0);
  const retake = useRef(createRetakeAccess());
  const activeUserId = useRef<string | null>(null);
  const lastProfileFetch = useRef({ at: 0, version: "", pathname: "" });
  const requestKey = `${location.key}:${retry}:${authChange}`;

  useEffect(() => {
    // The local development profile is a separate identity from any Supabase
    // browser session. Focus-triggered auth events must not remount its routes.
    if (import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === "true") return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (shouldReloadAuthProfile(false, event, activeUserId.current, session?.user.id ?? null)) {
        // Supabase emits SIGNED_IN again on tab focus. Track identity immediately
        // so duplicate events cannot unload the active interview during profile fetch.
        if (event === "SIGNED_OUT") { retake.current.clear(); activeUserId.current = null; }
        else activeUserId.current = session?.user.id ?? null;
        setAuthChange((current) => current + 1);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    if (location.pathname.toLowerCase() !== "/assessment") retake.current.clear();
    async function load() {
      const version = `${retry}:${authChange}`;
      const fetched = lastProfileFetch.current;
      const editsProfile = (path: string) => ["/assessment", "/settings", "/profile"].includes(path.toLowerCase());
      // Reuse the verified profile across ordinary navigation. Auth events and
      // profile-editing routes still force fresh checks, and reuse expires soon.
      if (loaded?.user && loaded.profile && !loaded.error && fetched.version === version && Date.now() - fetched.at < 30_000 && !editsProfile(location.pathname) && !editsProfile(fetched.pathname)) {
        setLoaded({ ...loaded, key: requestKey, retakeAllowed: retake.current.allows(loaded.user.id, location.state) });
        return;
      }
      function rememberFetch() {
        lastProfileFetch.current = { at: Date.now(), version, pathname: location.pathname };
      }
      try {
        if (import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === "true") {
          const response = await fetch("/__dev/profile");
          if (!response.ok) throw new Error("Could not load the configured dev profile. Check backend/.env.");
          const { user, profile } = await response.json() as { user: User; profile: UserProfile };
          let testProfile = profile;
          try {
            const stored = sessionStorage.getItem(`clario:dev-profile:${user.id}`);
            if (stored) testProfile = { ...profile, ...JSON.parse(stored), id: user.id };
          } catch { /* Ignore an expired or malformed local testing override. */ }
          if (active) activeUserId.current = user.id;
          if (active) rememberFetch();
          if (active) setLoaded({ key: requestKey, user, profile: testProfile, error: null, retakeAllowed: retake.current.allows(user.id, location.state) });
          return;
        }
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError && user) throw authError;
        if (active) activeUserId.current = user?.id ?? null;
        if (!user) {
          if (active) setLoaded({ key: requestKey, user: null, profile: null, error: null, retakeAllowed: false });
          return;
        }
        const { data: profile, error } = await supabase.from("profiles").select("id, display_name, preferred_language, starting_difficulty, weekly_interview_goal, assessment_completed, has_leetcode_experience, has_coding_experience, language_comfort, interview_confidence").eq("id", user.id).single();
        if (error) throw error;
        if (!profile) throw new Error("Your profile is not available. Please try again.");
        if (active) rememberFetch();
        if (active) setLoaded({ key: requestKey, user, profile, error: null, retakeAllowed: retake.current.allows(user.id, location.state) });
      } catch (err) {
        if (import.meta.env.DEV) console.error("Profile loading failed", err);
        if (active) setLoaded({ key: requestKey, user: null, profile: null, error: err instanceof Error ? err.message : "We couldn't load your practice profile. Please try again.", retakeAllowed: false });
      }
    }
    void load();
    return () => { active = false; };
  }, [requestKey, location.pathname, location.state]);

  if (!loaded || loaded.key !== requestKey) return <main className="flex min-h-svh items-center justify-center bg-cream-gradient px-6 text-sm text-[#55595c]" role="status">Loading your practice profile...</main>;
  if (loaded.error) return <main className="flex min-h-svh items-center justify-center bg-cream-gradient px-6 text-[#191d20]"><div className="max-w-md rounded-2xl border border-white/90 bg-white/55 p-8"><h1 className="text-2xl font-semibold tracking-tight">We couldn&apos;t load your profile.</h1><p role="alert" className="mt-4 text-sm leading-6 text-[#55595c]">{loaded.error}</p><div className="mt-6 flex gap-6"><button onClick={() => setRetry((current) => current + 1)} className="cursor-pointer rounded-lg bg-[#3b8fe8] px-5 py-3 text-sm font-semibold">Try again</button><Link to="/login" className="py-3 text-sm underline">Log in</Link></div></div></main>;
  if (!loaded.user || !loaded.profile) return <Navigate to="/login" replace />;
  const devBypass = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === "true";
  const redirect = devBypass ? null : getProfileRedirect(location.pathname, loaded.profile.assessment_completed, loaded.retakeAllowed);
  if (redirect) return <Navigate to={redirect} replace />;
  const context: ProfileContext = {
    user: loaded.user,
    profile: loaded.profile,
    updateDisplayName: (name) => setLoaded((current) => current?.profile ? { ...current, profile: { ...current.profile, display_name: name } } : current),
    startRetake: () => {
      if (!["/settings", "/profile"].includes(location.pathname.toLowerCase())) return;
      const state = retake.current.start(loaded.user!.id);
      navigate("/assessment", { state });
    },
  };
  return <Outlet context={context} />;
}


