import { useState } from "react";

// Presentation fixtures only. This hook never opens a mic, calls an API, or saves data.
const samples = [
 { name: "Long pause", monitored: 90, silent: 28, longest: 18, pause: 18, fillers: 1, words: 124, pace: 120,
   transcript: "Um, I will start by checking the input. I am deciding how to find the matching pair efficiently." },
 { name: "Filler words", monitored: 120, silent: 15, longest: 4, pause: 0, fillers: 5, words: 210, pace: 120,
   transcript: "Um, I think, uh, we can use a map. You know, it stores the numbers. I mean, we check the complement, um, before inserting each value." },
 { name: "Steady explanation", monitored: 180, silent: 20, longest: 5, pause: 0, fillers: 0, words: 320, pace: 120,
   transcript: "I will use a hash map to store each number and its index. For each value, I check whether its complement is already present. This takes linear time and linear extra space." },
];
export function useDemoSpeechCoach() {
 const [sampleIndex, setSampleIndex] = useState(0);
 const [active, setActive] = useState(true);
 const sample = samples[sampleIndex];
 return {
  active, starting: false, error: "", transcriptionStatus: "TEST DATA - no microphone or recording",
  metrics: { capture_id: "demo-only", monitored_seconds: sample.monitored, silent_seconds: sample.silent,
   longest_pause_seconds: sample.longest, transcript: sample.transcript, transcription_available: true },
  pause: sample.pause, fillers: sample.fillers, words: sample.words, pace: sample.pace,
  start: async () => { setActive(true); }, finish: async () => { setActive(false); },
  toggle: () => setActive(value => !value),
  sampleName: sample.name, nextSample: () => setSampleIndex(value => (value + 1) % samples.length),
 };
}
