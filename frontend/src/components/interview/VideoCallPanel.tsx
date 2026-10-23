import DuckHead from "../layout/DuckHead";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Conversation } from "@elevenlabs/client";
import { getVoiceSession } from "../../api/voice";
import { Panel, Pill } from "./Panel";

interface VideoCallPanelProps {
  round: string;
  interviewer: string;
  problemSlug: string;
  repoChallengeId?: string;
  speaking?: boolean;
  onEndInterview: () => void;
}

const SignalBars = () => (
  <span className="flex items-end gap-[2px]" aria-hidden>
    {[5, 8, 11].map((h) => (
      <span key={h} className="w-[3px] rounded-sm bg-[#4ade80]" style={{ height: h }} />
    ))}
  </span>
);

function NameTag({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-3 top-3 flex items-center justify-between">
      <span className="theme-panel theme-main-text rounded-full px-3 py-1 text-xs">{children}</span>
      <SignalBars />
    </div>
  );
}

const icon = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const MicOff = () => (<svg {...icon}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M3 3l18 18" /></svg>);
const Cam = ({ off = false }: { off?: boolean }) => (<svg {...icon}><rect x="3" y="6" width="12" height="12" rx="2" /><path d="M15 10l6-3v10l-6-3" />{off && <path d="M3 3l18 18" />}</svg>);
const Screen = () => (<svg {...icon}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>);
const More = () => (<svg {...icon} fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>);
const HangUp = () => (<svg {...icon}><path d="M3 14c5-4 13-4 18 0l-2 3-3-1.5V13c-3-1-7-1-10 0v2.5L5 17z" /></svg>);

type VoiceStatus = "idle" | "starting" | "active" | "error";

function voiceStartupError(error: unknown): string {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Microphone access was blocked. Allow microphone access for this site in your browser settings, then try again.";
  }
  if (error instanceof DOMException && error.name === "NotFoundError") {
    return "No microphone was found. Connect a microphone and try again.";
  }
  if (error instanceof Error && /permission denied|not allowed|microphone/i.test(error.message)) {
    return "Microphone access was blocked. Allow microphone access for this site in your browser settings, then try again.";
  }
  return error instanceof Error ? error.message : "Could not start the interview.";
}

export function VideoCallPanel({ round, interviewer, problemSlug, repoChallengeId, speaking = true, onEndInterview }: VideoCallPanelProps) {
  const [cameraStatus, setCameraStatus] = useState<"loading" | "on" | "off" | "blocked">("loading");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(speaking);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestRef = useRef(0);
  const conversationRef = useRef<Awaited<ReturnType<typeof Conversation.startSession>> | null>(null);

  const startInterview = useCallback(async () => {
    if (voiceStatus === "starting" || voiceStatus === "active") return;

    setVoiceStatus("starting");
    setVoiceError(null);
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access requires a secure browser context. Open the app at localhost or HTTPS.");
      }

      const microphonePermission = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphonePermission.getTracks().forEach((track) => track.stop());

      const session = await getVoiceSession(problemSlug, repoChallengeId);
      conversationRef.current = await Conversation.startSession({
        signedUrl: session.signed_url,
        dynamicVariables: session.variables,
        onModeChange: ({ mode }) => setIsSpeaking(mode === "speaking"),
        onDisconnect: () => {
          conversationRef.current = null;
          setVoiceStatus("idle");
          setIsSpeaking(false);
        },
        onError: (message) => {
          setVoiceError(voiceStartupError(new Error(message)));
          setVoiceStatus("error");
        },
      });
      setVoiceStatus("active");
    } catch (error) {
      setVoiceError(voiceStartupError(error));
      setVoiceStatus("error");
    }
  }, [problemSlug, repoChallengeId, voiceStatus]);

  const endVoiceSession = useCallback(() => {
    const conversation = conversationRef.current;
    conversationRef.current = null;
    if (conversation) void conversation.endSession();
    setVoiceStatus("idle");
    setIsSpeaking(false);
  }, []);

  const turnCameraOn = useCallback(async () => {
    const requestId = ++cameraRequestRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (requestId !== cameraRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      setCameraStream(stream);
      setCameraStatus("on");
    } catch {
      if (requestId === cameraRequestRef.current) {
        setCameraStream(null);
        setCameraStatus("blocked");
      }
    }
  }, []);

  const turnCameraOff = () => {
    cameraRequestRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraStream(null);
    setCameraStatus("off");
  };

  useEffect(() => {
    const requestId = ++cameraRequestRef.current;
    let disposed = false;

    void Promise.resolve()
      .then(() => navigator.mediaDevices.getUserMedia({ video: true }))
      .then((stream) => {
        if (disposed || requestId !== cameraRequestRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setCameraStream(stream);
        setCameraStatus("on");
      })
      .catch(() => {
        if (!disposed && requestId === cameraRequestRef.current) {
          setCameraStream(null);
          setCameraStatus("blocked");
        }
      });

    return () => {
      disposed = true;
      cameraRequestRef.current += 1;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      const conversation = conversationRef.current;
      conversationRef.current = null;
      if (conversation) void conversation.endSession();
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  return (
    <Panel className={"sandbox-video [&.sandbox-video]:[flex:1] [&.sandbox-video]:[border:0] [&.sandbox-video]:[border-radius:0] [&.sandbox-video_>_div:first-child]:[display:none] [&.sandbox-video_>_div:nth-child(2)]:[padding:0] [&.sandbox-video_>_div:nth-child(2)]:[gap:12px] [&.sandbox-video_.theme-video-self]:[height:auto] [&.sandbox-video_.theme-video-self]:[flex:1] [&.sandbox-video_.theme-video-self]:[min-height:140px] [&.sandbox-video_.theme-video-self_>_svg]:[stroke:#305ed1] [&.sandbox-video_.theme-video-interviewer]:[flex:1.1] [&.sandbox-video_.theme-video-interviewer]:[border:2px_solid_var(--line)] [&.sandbox-video_.theme-video-interviewer_button]:[color:#122b50] [&.sandbox-video_.theme-video-interviewer_button]:[font-size:14px] [&.sandbox-video_.theme-video-interviewer_button]:[margin-top:18px] [&.sandbox-video_.theme-video-interviewer_button_span_span]:[background:#93c5fd] [&.sandbox-video_.theme-avatar-ring]:[box-shadow:none] [&.sandbox-video_.theme-avatar-ring]:[width:118px] [&.sandbox-video_.theme-avatar-ring]:[height:118px] [&.sandbox-video_>_div:last-child]:[border:0] [&.sandbox-video_>_div:last-child]:[padding:14px_0_0] [&.sandbox-video_>_div:last-child]:[justify-content:space-between] [&.sandbox-video_>_div:last-child]:[gap:6px] [&.sandbox-video_>_div:last-child_button]:[border:1px_solid_var(--line)] [&.sandbox-video_>_div:last-child_button]:[flex-shrink:0] [@media_(max-width:_950px)]:[&.sandbox-video_>_div:nth-child(2)]:[flex-direction:row] [@media_(max-width:_950px)]:[&.sandbox-video_.theme-video-self]:[height:auto]"}>
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <span className="theme-main-text flex items-center gap-2 text-sm font-semibold">
          <svg {...icon} width={16} height={16} className="theme-muted-text"><rect x="3" y="6" width="12" height="12" rx="2" /><path d="M15 10l6-3v10l-6-3" /></svg>
          Video Call
        </span>
        <Pill className="theme-surface theme-body-text">{round}</Pill>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        <div className="theme-video-self relative flex h-[170px] shrink-0 flex-col items-center justify-center rounded-xl border">
          <NameTag>You</NameTag>
          {cameraStatus === "on" ? (
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full rounded-xl object-cover" aria-label="Your camera preview" />
          ) : (
            <>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#5b6b87" strokeWidth="1.2" aria-hidden="true">
                <circle cx="12" cy="7.5" r="4.5" />
                <path d="M3 22c0-5 4-8 9-8s9 3 9 8" />
              </svg>
              <span className="theme-muted-text absolute bottom-3 text-[10px]">
                {cameraStatus === "blocked" ? "Camera unavailable" : cameraStatus === "off" ? "Camera off" : "Requesting camera…"}
              </span>
            </>
          )}
        </div>

        <div className="theme-video-interviewer relative flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-[#2f6fd0] p-3">
          <NameTag>{interviewer}</NameTag>
          <div className="theme-avatar-ring flex h-[112px] w-[112px] items-center justify-center rounded-full bg-[#e8f1fb] text-5xl ring-[7px]">
            <DuckHead className="size-[100px]" />
          </div>
          {voiceStatus === "idle" || voiceStatus === "starting" || voiceStatus === "error" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-gray-300/30 px-5 text-center">
              <button
                type="button"
                onClick={() => void startInterview()}
                disabled={voiceStatus === "starting"}
                className="rounded-full bg-[#fac52e] px-5 py-3 text-sm font-semibold text-[#122b50] shadow-lg transition hover:bg-[#ffd75d] disabled:cursor-wait disabled:opacity-70"
              >
                {voiceStatus === "starting" ? "Starting interview…" : voiceStatus === "error" ? "Try again" : "Start interview"}
              </button>
              {voiceError && <p className="mt-3 max-w-[250px] text-xs text-white/90">{voiceError}</p>}
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-[#dbeafe]" aria-live="polite">
              {isSpeaking ? (
                <>
                  <span className="flex items-center gap-[3px]" aria-hidden>
                    {[10, 16, 10, 14, 8].map((h, i) => (
                      <span key={i} className="w-[3px] animate-pulse rounded-full bg-[#4a8cf0]" style={{ height: h, animationDelay: `${i * 120}ms` }} />
                    ))}
                  </span>
                  Speaking…
                </>
              ) : "Listening…"}
            </div>
          )}
        </div>
      </div>

      <div className="theme-border flex shrink-0 items-center justify-center gap-2.5 border-t py-2.5">
        <button
          type="button"
          aria-label="Microphone unavailable"
          title="Microphone is not connected"
          disabled
          className="theme-surface theme-body-text flex h-[46px] w-[46px] cursor-not-allowed items-center justify-center rounded-full opacity-60"
        >
          <MicOff />
        </button>
        <button
          type="button"
          aria-label={cameraStatus === "on" ? "Turn camera off" : cameraStatus === "loading" ? "Cancel camera request" : "Turn camera on"}
          aria-pressed={cameraStatus === "on"}
          onClick={() => {
            if (cameraStatus === "on" || cameraStatus === "loading") {
              turnCameraOff();
            } else {
              setCameraStatus("loading");
              void turnCameraOn();
            }
          }}
          className={`flex h-[46px] w-[46px] items-center justify-center rounded-full ${cameraStatus === "off" || cameraStatus === "blocked" ? "bg-[#e2493b] text-white hover:bg-[#ee5b4d]" : "theme-surface theme-body-text theme-surface-hover"}`}
        >
          <Cam off={cameraStatus !== "on"} />
        </button>
        <button type="button" aria-label="Screen sharing coming soon" title="Screen sharing coming soon" disabled className="theme-surface theme-body-text flex h-[46px] w-[46px] cursor-not-allowed items-center justify-center rounded-full opacity-60">
          <Screen />
        </button>
        <button type="button" aria-label="More call options coming soon" title="More call options coming soon" disabled className="theme-surface theme-body-text flex h-[46px] w-[46px] cursor-not-allowed items-center justify-center rounded-full opacity-60">
          <More />
        </button>
        <button
          type="button"
          aria-label="End interview"
          onClick={() => {
            if (window.confirm("End interview?")) {
              endVoiceSession();
              onEndInterview();
            }
          }}
          className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#e2493b] text-white hover:bg-[#ee5b4d]"
        >
          <HangUp />
        </button>
      </div>
    </Panel>
  );
}
