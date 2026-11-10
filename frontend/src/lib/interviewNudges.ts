/** Wall-clock cadence survives timer throttling without replaying missed nudges. */
export class InterviewNudges {
  private lastSlot = 0;
  due(elapsedSeconds: number, ready: boolean): boolean {
    const slot = Math.floor(Math.max(0, elapsedSeconds) / 30);
    if (!ready || slot <= this.lastSlot) return false;
    this.lastSlot = slot;
    return true;
  }
}
export const NUDGE_PREFIX = "[Interview time check]";
export function interviewNudge(elapsedSeconds: number, submitted: boolean): string {
  return `${NUDGE_PREFIX} ${Math.floor(elapsedSeconds)} seconds have elapsed in this ongoing interview. Give one brief, supportive nudge relevant to the latest candidate explanation and code. ${submitted ? "Ask one short follow-up about their submitted approach." : "Ask them to briefly explain their current progress or next step."} Do not restart or reintroduce the interview, reveal solutions, give scores, or assume silence means failure. This is a timer cue, not candidate speech.`;
}

/** Provider silence prompts and client timers share a minimum speaking gap. */
export function canNudge(now: number, lastAgentTurn: number, speaking: boolean): boolean {
  return !speaking && now - lastAgentTurn >= 30_000;
}
