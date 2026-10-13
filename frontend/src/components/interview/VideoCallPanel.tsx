import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Panel, Pill } from "./Panel";

interface VideoCallPanelProps {
  round: string;
  interviewer: string;
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

const Mic = () => (<svg {...icon}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>);
const MicOff = () => (<svg {...icon}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M3 3l18 18" /></svg>);
const Cam = ({ off = false }: { off?: boolean }) => (<svg {...icon}><rect x="3" y="6" width="12" height="12" rx="2" /><path d="M15 10l6-3v10l-6-3" />{off && <path d="M3 3l18 18" />}</svg>);
const Screen = () => (<svg {...icon}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>);
const More = () => (<svg {...icon} fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>);
const HangUp = () => (<svg {...icon}><path d="M3 14c5-4 13-4 18 0l-2 3-3-1.5V13c-3-1-7-1-10 0v2.5L5 17z" /></svg>);

export function VideoCallPanel({ round, interviewer, speaking = true, onEndInterview }: VideoCallPanelProps) {
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraStatus, setCameraStatus] = useState<"loading" | "on" | "off" | "blocked">("loading");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(speaking);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestRef = useRef(0);

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
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  return (
    <Panel>
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <span className="theme-main-text flex items-center gap-2 text-sm font-semibold">
          <svg {...icon} width={16} height={16} className="theme-muted-text"><rect x="3" y="6" width="12" height="12" rx="2" /><path d="M15 10l6-3v10l-6-3" /></svg>
          Video Call
        </span>
        <Pill className="theme-surface theme-body-text">{round}</Pill>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-2 pb-2">
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
            🦆
          </div>
          <button
            type="button"
            aria-pressed={isSpeaking}
            aria-label={isSpeaking ? "Pause interviewer speaking indicator" : "Resume interviewer speaking indicator"}
            onClick={() => setIsSpeaking((current) => !current)}
            className="mt-2 flex items-center gap-2 text-[11px] font-medium text-[var(--accent-text)]"
          >
            {isSpeaking ? (
              <>
                <span className="flex items-center gap-[3px]" aria-hidden>
                  {[10, 16, 10, 14, 8].map((h, i) => (
                    <span key={i} className="w-[3px] animate-pulse rounded-full bg-[#4a8cf0]" style={{ height: h, animationDelay: `${i * 120}ms` }} />
                  ))}
                </span>
                Speaking…
              </>
            ) : "Not speaking"}
          </button>
        </div>
      </div>

      <div className="theme-border flex shrink-0 items-center justify-center gap-2.5 border-t py-2.5">
        <button
          type="button"
          aria-label={micEnabled ? "Mute microphone" : "Unmute microphone"}
          aria-pressed={micEnabled}
          onClick={() => setMicEnabled((enabled) => !enabled)}
          className={`flex h-[46px] w-[46px] items-center justify-center rounded-full ${micEnabled ? "theme-surface theme-body-text theme-surface-hover" : "bg-[#e2493b] text-white hover:bg-[#ee5b4d]"}`}
        >
          {micEnabled ? <Mic /> : <MicOff />}
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
            if (window.confirm("End interview?")) onEndInterview();
          }}
          className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#e2493b] text-white hover:bg-[#ee5b4d]"
        >
          <HangUp />
        </button>
      </div>
    </Panel>
  );
}
