import { useEffect, useRef, useState } from "react";
import { formatInterviewTimer, INTERVIEW_DURATION_SECONDS, remainingInterviewSeconds } from "./interviewLifecycle";

export function useInterviewTimer(startedAt: string | null, enabled: boolean, onExpire: () => Promise<void>) {
  const [remaining, setRemaining] = useState(INTERVIEW_DURATION_SECONDS);
  const callback = useRef(onExpire);
  const expiredFor = useRef<string | null>(null);
  useEffect(() => { callback.current = onExpire; }, [onExpire]);
  useEffect(() => {
    if (!startedAt || !enabled) return;
    const tick = () => {
      const seconds = remainingInterviewSeconds(startedAt);
      setRemaining(seconds);
      if (seconds === 0 && expiredFor.current !== startedAt) {
        expiredFor.current = startedAt;
        void callback.current();
      }
    };
    const timer = window.setInterval(tick, 1000);
    tick();
    return () => window.clearInterval(timer);
  }, [startedAt, enabled]);
  return formatInterviewTimer(remaining);
}
