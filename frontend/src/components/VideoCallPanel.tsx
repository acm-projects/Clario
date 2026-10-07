import type { ReactNode } from "react";
import { Panel, Pill } from "./Panel";

interface VideoCallPanelProps {
  round: string;
  interviewer: string;
  speaking?: boolean;
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
const Cam = () => (<svg {...icon}><rect x="3" y="6" width="12" height="12" rx="2" /><path d="M15 10l6-3v10l-6-3" /></svg>);
const Screen = () => (<svg {...icon}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>);
const More = () => (<svg {...icon} fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>);
const HangUp = () => (<svg {...icon}><path d="M3 14c5-4 13-4 18 0l-2 3-3-1.5V13c-3-1-7-1-10 0v2.5L5 17z" /></svg>);

export function VideoCallPanel({ round, interviewer, speaking = true }: VideoCallPanelProps) {
  const controls = [<Mic />, <Cam />, <Screen />, <More />];

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
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#5b6b87" strokeWidth="1.2">
            <circle cx="12" cy="7.5" r="4.5" />
            <path d="M3 22c0-5 4-8 9-8s9 3 9 8" />
          </svg>
          <span className="theme-muted-text absolute bottom-3 text-[10px]">[Your camera feed]</span>
        </div>

        <div className="theme-video-interviewer relative flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-[#2f6fd0] p-3">
          <NameTag>{interviewer}</NameTag>
          <div className="theme-avatar-ring flex h-[112px] w-[112px] items-center justify-center rounded-full bg-[#e8f1fb] text-5xl ring-[7px]">
            🦆
          </div>
          {speaking && (
            <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-[var(--accent-text)]">
              <span className="flex items-center gap-[3px]" aria-hidden>
                {[10, 16, 10, 14, 8].map((h, i) => (
                  <span
                    key={i}
                    className="w-[3px] animate-pulse rounded-full bg-[#4a8cf0]"
                    style={{ height: h, animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </span>
              Speaking…
            </div>
          )}
        </div>
      </div>

      <div className="theme-border flex shrink-0 items-center justify-center gap-2.5 border-t py-2.5">
        {controls.map((c, i) => (
          <button
            key={i}
            className="theme-surface theme-body-text theme-surface-hover flex h-[46px] w-[46px] items-center justify-center rounded-full"
          >
            {c}
          </button>
        ))}
        <button className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#e2493b] text-white hover:bg-[#ee5b4d]">
          <HangUp />
        </button>
      </div>
    </Panel>
  );
}
