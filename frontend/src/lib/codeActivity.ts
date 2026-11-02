export const CODE_ACTIVITY_UPDATE =
  "Code activity: the candidate changed their implementation and a new snapshot was saved. " +
  "At your next natural turn, call get_current_code and use the code to ask one relevant " +
  "implementation question, unless the candidate has a more immediate question. " +
  "Do not interrupt them or wait for them to request a code review.";

/** Throttle successful notifications, not saves; inactive calls consume no allowance. */
export function createCodeActivityNotifier(
  now: () => number = Date.now,
) {
  const lastSent = new Map<string, number>();
  return (sessionId: string, send: () => boolean) => {
    const time = now();
    const last = lastSent.get(sessionId);
    if (last !== undefined && time - last < 30_000) return false;
    if (!send()) return false;
    lastSent.set(sessionId, time);
    return true;
  };
}
