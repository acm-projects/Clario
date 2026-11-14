import { useCallback, useEffect, useRef, useState } from "react";
import { saveSnapshot } from "./api";
import { createSnapshotWriter, isCompletedSessionError } from "./snapshotWriter";
import { createCodeActivityNotifier, type SavedCode } from "./codeActivity";

/** Serialize autosave, Run, and End so an older save cannot finish last. */
export function useCodeSnapshots(
  sessionId: string | null,
  code: string,
  enabled: boolean,
  /** Called with the newest *saved* snapshot; return true if the update reached the call. */
  onCodeSaved?: (sessionId: string, saved: SavedCode, previous?: string) => boolean,
) {
  const latestCode = useRef(code);
  // Newest snapshot actually stored, with its server-assigned version. Updates only
  // ever describe stored code, so they can never be newer than what get_current_code returns.
  // A plain mutable box (not a ref) so the writer created once below can update it.
  const [lastSaved] = useState<{ current: (SavedCode & { sessionId: string }) | null }>(() => ({ current: null }));
  // Code in the last update the interviewer actually received, to diff the next one against.
  const [lastNotified] = useState<{ current: { sessionId: string; code: string } | null }>(() => ({ current: null }));
  const [write] = useState(() => createSnapshotWriter(async (id: string, source: string) => {
    const response = await saveSnapshot(id, source);
    lastSaved.current = { sessionId: id, code: source, version: response.version ?? null };
    return response;
  }));
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const idleTimerRef = useRef<number | undefined>(undefined);
  const paused = useRef(false);
  const stop = useCallback(() => {
    paused.current = true;
    window.clearInterval(timerRef.current);
    window.clearTimeout(idleTimerRef.current);
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
        // Read when the (possibly delayed) send fires, so it is the newest stored version.
        const saved = lastSaved.current;
        if (!saved || saved.sessionId !== id) return false;
        const previous = lastNotified.current?.sessionId === id ? lastNotified.current.code : undefined;
        const sent = current.onCodeSaved?.(id, { code: saved.code, version: saved.version }, previous) ?? false;
        if (sent) lastNotified.current = { sessionId: id, code: saved.code };
        return sent;
      });
    });
  }, [write, notify, lastSaved, lastNotified]);

  const autosave = useCallback((id: string) => {
    if (paused.current) return;
    void save(id, latestCode.current, false).catch((error: unknown) => {
      if (isCompletedSessionError(error)) {
        stop();
        setError("This interview has already ended. Code autosave has stopped.");
        return;
      }
      setError("Code autosave failed. Your interviewer may see an older version. Retrying in 10 seconds.");
    });
  }, [save, stop]);

  // Save promptly after a short typing pause; the interval below covers continuous typing.
  useEffect(() => {
    if (!sessionId || !enabled || paused.current) return;
    idleTimerRef.current = window.setTimeout(() => autosave(sessionId), 750);
    return () => window.clearTimeout(idleTimerRef.current);
  }, [sessionId, code, enabled, autosave]);

  useEffect(() => {
    if (!sessionId || !enabled || paused.current) return;
    const timer = window.setInterval(() => autosave(sessionId), 10_000);
    timerRef.current = timer;
    return () => window.clearInterval(timer);
  }, [sessionId, enabled, autosave]);
  const latestSaved = useCallback((id: string): SavedCode | null => {
    const saved = lastSaved.current;
    return saved && saved.sessionId === id ? { code: saved.code, version: saved.version } : null;
  }, [lastSaved]);
  return { save, error, stop, latestSaved };
}
