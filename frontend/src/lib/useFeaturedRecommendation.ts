import { useCallback, useEffect, useState } from "react";
import { getPersonalizedRecommendations } from "./personalizedRecommendations";
import { supabase } from "./supabase";
import type { RecommendedProblem } from "./assessmentContract";
import type { Language } from "../types";

type FeaturedState = {status: "loading"} | {status: "missing"} | {status: "error"; message: string} | {status: "ready"; problem: RecommendedProblem | null};

export function useFeaturedRecommendation(onSavedLanguage: (language: Language) => void): FeaturedState & {refresh: () => void} {
  const [version, setVersion] = useState(0);
  const [loaded, setLoaded] = useState<{version: number; state: FeaturedState} | null>(null);
  const refresh = useCallback(() => setVersion(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const {assessment, recommendations} = await getPersonalizedRecommendations(controller.signal);
        if (controller.signal.aborted) return;
        if (!assessment) { setLoaded({version, state: {status: "missing"}}); return; }
        onSavedLanguage(assessment.answers.language);
        setLoaded({version, state: {status: "ready", problem: recommendations.problems[0] ?? null}});
      } catch (error) {
        if (controller.signal.aborted) return;
        const signedOut = error instanceof Error && "status" in error && error.status === 401;
        setLoaded({version, state: signedOut ? {status: "missing"} : {status: "error", message: error instanceof Error ? error.message : "Could not load your recommendation. Please try again."}});
      }
    }
    void load();
    return () => controller.abort();
  }, [version, onSavedLanguage]);
  useEffect(() => {
    const visibleRefresh = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", visibleRefresh);
    document.addEventListener("visibilitychange", visibleRefresh);
    const timer = window.setInterval(visibleRefresh, 60_000);
    const {data: {subscription}} = supabase.auth.onAuthStateChange(event => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") refresh();
    });
    return () => {
      window.removeEventListener("focus", visibleRefresh);
      document.removeEventListener("visibilitychange", visibleRefresh);
      window.clearInterval(timer);
      subscription.unsubscribe();
    };
  }, [refresh]);
  return { ...(loaded?.version === version ? loaded.state : {status: "loading" as const}), refresh };
}
