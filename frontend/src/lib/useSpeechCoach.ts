import { useCallback, useEffect, useRef, useState } from "react";
import { request } from "./api";

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type Recognition = {
 continuous: boolean; interimResults: boolean; lang: string;
 onresult: ((event: { resultIndex: number; results: ArrayLike<RecognitionResult> }) => void) | null;
 onerror: ((event: { error: string }) => void) | null;
 onend: (() => void) | null;
 start(): void; stop(): void; abort(): void;
};
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
type Capture = { capture_id: string; monitored_seconds: number; silent_seconds: number; longest_pause_seconds: number; transcript: string; transcription_available: boolean };
const blank = (): Capture => ({ capture_id: crypto.randomUUID(), monitored_seconds: 0, silent_seconds: 0, longest_pause_seconds: 0, transcript: "", transcription_available: false });
export function fillerCount(text: string) { return (text.match(/\b(?:um+|uh+|erm+|hmm+|you know|i mean|sort of|kind of)\b/gi) ?? []).length; }

export function useSpeechCoach(sessionId: string | null) {
 const [metrics, setMetrics] = useState<Capture>(blank);
 const capture = useRef<Capture>(metrics);
 const [active, setActive] = useState(false);
 const [starting, setStarting] = useState(false);
 const [error, setError] = useState("");
 const [transcriptionStatus, setTranscriptionStatus] = useState("Not started");
 const [pause, setPause] = useState(0);
 const cleanup = useRef<(() => Promise<void>) | null>(null);
 const pendingStart = useRef(false);
 const stopping = useRef<Promise<void> | null>(null);
 const generation = useRef(0);
 const alive = useRef(true);
 const saveChain = useRef<Promise<unknown>>(Promise.resolve());
 const lastSaved = useRef("");
 const publish = useCallback(() => { if (alive.current && capture.current) setMetrics({ ...capture.current }); }, []);
 const save = useCallback(async () => {
  if (!sessionId || !capture.current?.monitored_seconds) return;
  const body = JSON.stringify(capture.current);
  const next = saveChain.current.catch(() => {}).then(async () => {
   if (body === lastSaved.current) return;
   await request("/api/sessions/" + encodeURIComponent(sessionId) + "/communication", {
    method: "POST", headers: { "Content-Type": "application/json" }, body,
   }, true);
   lastSaved.current = body;
  });
  saveChain.current = next;
  await next;
 }, [sessionId]);
 const stop = useCallback(async () => {
  if (stopping.current) return stopping.current;
  generation.current++; pendingStart.current = false;
  if (alive.current) setStarting(true);
  const dispose = cleanup.current; cleanup.current = null;
  const work = (async () => {
   try { if (dispose) await dispose(); }
   finally { if (alive.current) { setActive(false); setPause(0); setStarting(false); } publish(); }
  })();
  stopping.current = work;
  try { await work; } finally { stopping.current = null; }
 }, [publish]);
 const finish = useCallback(async () => { await stop(); await save(); }, [stop, save]);
 const start = useCallback(async () => {
  if (cleanup.current || pendingStart.current || stopping.current) return;
  pendingStart.current = true;
  const token = ++generation.current;
  setStarting(true); setError("");
  let stream: MediaStream | undefined;
  let audio: AudioContext | undefined;
  try {
   stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
   if (token !== generation.current || !alive.current) { stream.getTracks().forEach(t => t.stop()); return; }
   audio = new AudioContext(); await audio.resume();
   if (token !== generation.current || !alive.current) { stream.getTracks().forEach(t => t.stop()); await audio.close(); return; }
   const analyser = audio.createAnalyser(); analyser.fftSize = 1024;
   const source = audio.createMediaStreamSource(stream); source.connect(analyser);
   const samples = new Float32Array(analyser.fftSize);
   let stopped = false, currentPause = 0, last = performance.now(), lastVoice = last;
   let recognition: Recognition | undefined;
   let restartTimer: ReturnType<typeof setTimeout> | undefined;
   const Constructor = (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition;
   if (Constructor) {
    recognition = new Constructor(); recognition.continuous = true; recognition.interimResults = false; recognition.lang = "en-US";
    recognition.onresult = event => {
     if (!capture.current) return;
     for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) capture.current.transcript = (capture.current.transcript + " " + event.results[i][0].transcript).trim().slice(0, 50000);
     }
     capture.current.transcription_available = true; publish();
    };
    let recognitionFailed = false;
    recognition.onerror = event => {
     if (event.error === "no-speech" || event.error === "aborted") return;
     recognitionFailed = true;
     if (alive.current) setTranscriptionStatus("Transcription unavailable; silence tracking continues");
    };
    recognition.onend = () => {
     if (!stopped && !recognitionFailed) restartTimer = setTimeout(() => { try { recognition?.start(); } catch { if (alive.current) setTranscriptionStatus("Transcription stopped; pause and resume to retry"); } }, 500);
    };
    try { recognition.start(); setTranscriptionStatus("Transcribing English speech"); }
    catch { setTranscriptionStatus("Transcription unavailable; silence tracking continues"); }
   } else setTranscriptionStatus("Transcription unsupported; silence tracking only");
   const timer = setInterval(() => {
    const now = performance.now(), dt = (now - last) / 1000; last = now;
    if (document.hidden || audio?.state !== "running" || dt > 1) { currentPause = 0; lastVoice = now; setPause(0); return; }
    analyser.getFloatTimeDomainData(samples);
    const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
    if (rms >= 0.018) lastVoice = now;
    const quiet = now - lastVoice > 300;
    const value = capture.current!;
    value.monitored_seconds += dt;
    if (quiet) { value.silent_seconds += dt; currentPause += dt; }
    else currentPause = 0;
    value.longest_pause_seconds = Math.max(value.longest_pause_seconds, currentPause);
    setPause(currentPause); publish();
   }, 200);
   const autosave = setInterval(() => { void save().then(() => { if (alive.current) setError(""); }).catch(() => { if (alive.current) setError("Speech observations could not be saved. Pause and retry before ending."); }); }, 30000);
   const audioStream = stream, audioContext = audio;
   const ended = () => { void stop().then(save).catch(() => { if (alive.current) setError("Could not save speech observations."); }); };
   const visibility = () => { if (document.hidden) ended(); };
   document.addEventListener("visibilitychange", visibility);
   audioStream.getAudioTracks().forEach(track => track.addEventListener("ended", ended));
   cleanup.current = async () => {
    stopped = true; document.removeEventListener("visibilitychange", visibility); clearInterval(timer); clearInterval(autosave); clearTimeout(restartTimer);
    if (recognition) {
     const speech = recognition;
     await new Promise<void>(resolve => {
      const timeout = setTimeout(() => { speech.onresult = null; speech.abort(); resolve(); }, 1000);
      speech.onend = () => { clearTimeout(timeout); resolve(); };
      try { speech.stop(); } catch { clearTimeout(timeout); resolve(); }
     });
     speech.onresult = null; speech.onerror = null; speech.onend = null;
    }
    audioStream.getAudioTracks().forEach(track => track.removeEventListener("ended", ended));
    audioStream.getTracks().forEach(track => track.stop()); source.disconnect();
    await audioContext.close();
   };
   setActive(true);
  } catch { stream?.getTracks().forEach(t => t.stop()); if (audio && audio.state !== "closed") await audio.close(); if (alive.current) setError("Microphone unavailable. Allow microphone access and try again."); }
  finally { if (token === generation.current) { pendingStart.current = false; if (alive.current) setStarting(false); } }
 }, [publish, save, stop]);
 const invalidateStart = useCallback(() => { generation.current++; pendingStart.current = false; }, []);
 useEffect(() => {
  alive.current = true;
  return () => { alive.current = false; invalidateStart(); const dispose = cleanup.current; cleanup.current = null; if (dispose) void dispose().then(save).catch(() => {}); };
 }, [save, invalidateStart]);
 const fillers = fillerCount(metrics.transcript);
 const words = metrics.transcript.match(/\b[\w']+\b/g)?.length ?? 0;
 const speechSeconds = metrics.monitored_seconds - metrics.silent_seconds;
 return { active, starting, metrics, error, transcriptionStatus, pause, fillers, words,
  pace: words && speechSeconds > 1 ? Math.round(words * 60 / speechSeconds) : null,
  start, finish, toggle: () => { if (active) void finish().catch(() => setError("Could not save speech observations. Try again before ending.")); else void start(); },
 };
}
