import { useEffect, useState } from "react";
import { earnedMilestone, streakMilestones } from "../../lib/calendarRewards";
import "./calendar-celebration.css";

export default function StreakCelebration({ userId, longest, ready }: {userId: string; longest: number; ready: boolean}) {
  const storageKey = `clario:streak-milestones:v1:${userId}`;
  const [observed, setObserved] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === null) return null;
      const value = Number(stored);
      return [0, ...streakMilestones].includes(value) ? value : null;
    } catch { return null; }
  });
  const [achievement, setAchievement] = useState<number | null>(null);
  const earned = earnedMilestone(longest);
  // Observe only loaded real activity. First observation establishes a baseline,
  // so an old achievement does not celebrate on every mount or account switch.
  if (ready && (observed === null || earned > observed)) {
    setObserved(earned);
    if (observed !== null && earned > observed) setAchievement(earned);
  }
  useEffect(() => {
    if (observed === null) return;
    try { localStorage.setItem(storageKey, String(observed)); } catch { /* Celebration still works for this visit. */ }
  }, [observed, storageKey]);
  useEffect(() => {
    if (achievement === null) return;
    const timer = window.setTimeout(() => setAchievement(null), 4_000);
    return () => window.clearTimeout(timer);
  }, [achievement]);
  if (!ready || achievement === null) return null;
  return <div role="status" data-streak-milestone={achievement} className="calendar-milestone-celebration mt-3 flex items-center gap-2 rounded-xl border border-[#ffdf4f] bg-[#fff1cb] px-3 py-2 text-sm font-medium [color:#182137]"><span aria-hidden="true">&#10022;</span>{achievement}-day milestone earned. Ducky is cheering you on!</div>;
}
