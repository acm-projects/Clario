// One duration for the room; derive remaining time from a deadline to avoid timer drift.
export const INTERVIEW_DURATION_SECONDS = 30 * 60;

export function remainingInterviewSeconds(startedAt: string, now = Date.now()) {
  const start = Date.parse(startedAt);
  if (!Number.isFinite(start)) throw new Error("Interview start time is invalid.");
  return Math.max(0, Math.min(INTERVIEW_DURATION_SECONDS,
    Math.ceil((start + INTERVIEW_DURATION_SECONDS * 1000 - now) / 1000)));
}

export function formatInterviewTimer(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export async function completeInterview(actions: {
  stopVoice: () => Promise<void>;
  waitForRun: () => Promise<void>;
  saveFinal: () => Promise<unknown>;
  endSession: () => Promise<unknown>;
  isAlreadyCompleted: (error: unknown) => boolean;
  showReport: () => void;
}) {
  await actions.stopVoice();
  await actions.waitForRun();
  try {
    await actions.saveFinal();
    await actions.endSession();
  } catch (error) {
    if (!actions.isAlreadyCompleted(error)) throw error;
  }
  actions.showReport();
}
