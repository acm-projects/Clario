import { useEffect, useRef, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { ProfileContext, UserProfile } from "../lib/profile";
import { createRetakeAccess, getProfileRedirect } from "../lib/profileRouting";

type LoadedProfile = { key: string; user: User | null; profile: UserProfile | null; error: string | null; retakeAllowed: boolean };

export default function ProfileGate() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState<LoadedProfile | null>(null);
  const [retry, setRetry] = useState(0);
  const [authChange, setAuthChange] = useState(0);
  const retake = useRef(createRetakeAccess());
  const activeUserId = useRef<string | null>(null);
  const requestKey = `${location.key}:${retry}:${authChange}`;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || event === "SIGNED_IN" && session?.user.id !== activeUserId.current) {
        if (event === "SIGNED_OUT") { retake.current.clear(); activeUserId.current = null; }
        setAuthChange((current) => current + 1);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    if (location.pathname.toLowerCase() !== "/assessment") retake.current.clear();
    async function load() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError && user) throw authError;
        activeUserId.current = user?.id ?? null;
        if (!user) {
          if (active) setLoaded({ key: requestKey, user: null, profile: null, error: null, retakeAllowed: false });
          return;
        }
        const { data: profile, error } = await supabase.from("profiles").select("id, display_name, preferred_language, starting_difficulty, weekly_interview_goal, assessment_completed, has_leetcode_experience, has_coding_experience, language_comfort, interview_confidence").eq("id", user.id).single();
        if (error) throw error;
        if (!profile) throw new Error("Your profile is not available. Please try again.");
        if (active) setLoaded({ key: requestKey, user, profile, error: null, retakeAllowed: retake.current.allows(user.id, location.state) });
      } catch (err) {
        if (import.meta.env.DEV) console.error("Profile loading failed", err);
        if (active) setLoaded({ key: requestKey, user: null, profile: null, error: err instanceof Error ? err.message : "We couldn't load your practice profile. Please try again.", retakeAllowed: false });
      }
    }
    void load();
    return () => { active = false; };
  }, [requestKey, location.pathname, location.state]);

  if (!loaded || loaded.key !== requestKey) return <main className="flex min-h-svh items-center justify-center bg-[#F6EDD1] px-6 text-sm text-[#55595c]" role="status">Loading your practice profile...</main>;
  if (loaded.error) return <main className="flex min-h-svh items-center justify-center bg-[#F6EDD1] px-6 text-[#191d20]"><div className="max-w-md rounded-2xl border border-white/90 bg-white/55 p-8"><h1 className="text-2xl font-semibold tracking-tight">We couldn&apos;t load your profile.</h1><p role="alert" className="mt-4 text-sm leading-6 text-[#55595c]">{loaded.error}</p><div className="mt-6 flex gap-6"><button onClick={() => setRetry((current) => current + 1)} className="cursor-pointer rounded-lg bg-[#3b8fe8] px-5 py-3 text-sm font-semibold">Try again</button><Link to="/login" className="py-3 text-sm underline">Log in</Link></div></div></main>;
  if (!loaded.user || !loaded.profile) return <Navigate to="/login" replace />;
  const redirect = getProfileRedirect(location.pathname, loaded.profile.assessment_completed, loaded.retakeAllowed);
  if (redirect) return <Navigate to={redirect} replace />;
  const context: ProfileContext = {
    user: loaded.user,
    profile: loaded.profile,
    startRetake: () => {
      if (!["/settings", "/profile"].includes(location.pathname.toLowerCase())) return;
      const state = retake.current.start(loaded.user!.id);
      navigate("/assessment", { state });
    },
  };
  return <Outlet context={context} />;
}


