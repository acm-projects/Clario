import { useCallback, useEffect, useRef, useState } from "react";
import { saveSnapshot } from "./api";
import { createSnapshotWriter, isCompletedSessionError } from "./snapshotWriter";
import { createCodeActivityNotifier } from "./codeActivity";

/** Serialize autosave, Run, and End so an older save cannot finish last. */
export function useCodeSnapshots(
  sessionId: string | null,
  code: string,
  enabled: boolean,
  onCodeSaved?: (sessionId: string) => boolean,
) {
  const latestCode = useRef(code);
  const [write] = useState(() => createSnapshotWriter(saveSnapshot));
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const paused = useRef(false);
  const stop = useCallback(() => {
    paused.current = true;
    window.clearInterval(timerRef.current);
  }, []);
  const activity = useRef({ sessionId, enabled, onCodeSaved });
  useEffect(() => { activity.current = { sessionId, enabled, onCodeSaved }; }, [sessionId, enabled, onCodeSaved]);
  const [notify] = useState(() => createCodeActivityNotifier());
  useEffect(() => () => { activity.current.enabled = false; }, []);
  useEffect(() => { latestCode.current = code; }, [code]);

  const save = useCallback((id: string, source: string, force = true) => {
    return write(id, source, force).then((didSave) => {
      setError(null);
      if (didSave && !force) notify(id, () => {
        const current = activity.current;
        if (paused.current || !current.enabled || current.sessionId !== id) return false;
        return current.onCodeSaved?.(id) ?? false;
      });
    });
  }, [write, notify]);

  useEffect(() => {
    if (!sessionId || !enabled || paused.current) return;
    const timer = window.setInterval(() => {
      if (paused.current) return;
      void save(sessionId, latestCode.current, false).catch((error: unknown) => {
        if (isCompletedSessionError(error)) {
          stop();
          setError("This interview has already ended. Code autosave has stopped.");
          return;
        }
        setError("Code autosave failed. Your interviewer may see an older version. Retrying in 10 seconds.");
      });
    }, 10_000);
    timerRef.current = timer;
    return () => window.clearInterval(timer);
  }, [sessionId, enabled, save, stop]);
  return { save, error, stop };
}
