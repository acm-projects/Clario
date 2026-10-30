export type TranscriptTurn = { source: string; message: string };
export type SilenceInterval = { start_seconds: number; end_seconds: number; duration_seconds: number };
export type CommunicationCapture = {
  capture_id: string; monitored_seconds: number; silent_seconds: number; longest_pause_seconds: number;
  transcript: string; transcription_available: boolean; silence_intervals: SilenceInterval[];
};
export type InterviewEvidence = { transcript: TranscriptTurn[]; communication: CommunicationCapture | null };
export type VoiceControls = { reviewCode(code: string): Promise<void>; finish(): Promise<InterviewEvidence> };
export const CODE_REVIEW_CUE = "The candidate clicked Submit to request a code review. Check the submitted snapshot and continue the interview with one relevant follow-up question. Do not give hints, a solution, or scores.";

/** Candidate-channel volume only, excluding interviewer speech and hidden-tab time. */
export class SilenceTracker {
  readonly capture: CommunicationCapture = { capture_id: crypto.randomUUID(), monitored_seconds: 0, silent_seconds: 0, longest_pause_seconds: 0, transcript: "", transcription_available: false, silence_intervals: [] };
  private quietStart: number | null = null;
  private quietDuration = 0;
  sample(elapsed: number, duration: number, volume: number, eligible: boolean) {
    if (!eligible || duration <= 0 || duration > 1 || !Number.isFinite(volume)) { this.close(); return; }
    this.capture.monitored_seconds += duration;
    if (volume < 0.02) {
      this.quietStart ??= Math.max(0, elapsed - duration);
      this.quietDuration += duration;
      this.capture.silent_seconds += duration;
      this.capture.longest_pause_seconds = Math.max(this.capture.longest_pause_seconds, this.quietDuration);
    } else this.close();
  }
  close() {
    if (this.quietStart !== null && this.quietDuration >= 1) {
      this.capture.silence_intervals.push({ start_seconds: this.quietStart, end_seconds: this.quietStart + this.quietDuration, duration_seconds: this.quietDuration });
      this.capture.silence_intervals = this.capture.silence_intervals.slice(-500);
    }
    this.quietStart = null; this.quietDuration = 0;
  }
}
