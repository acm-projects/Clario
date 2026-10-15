import { useId } from "react";

export default function FooterWaves() {
  const waveId = useId();
  return (
    <div className="pointer-events-none relative mt-auto h-24 shrink-0 overflow-hidden md:h-36" aria-hidden="true">
      <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="block h-full w-full">
        <defs>
          <path id={waveId} d="M0 64 Q180 0 360 64 T720 64 T1080 64 T1440 64 V192 H0Z" />
        </defs>
        {[{ color: "#6eaff8", offset: 0, duration: "22s", reverse: false },
          { color: "#2d82ea", offset: 32, duration: "15s", reverse: true }].map((layer) => (
          <g key={layer.color} fill={layer.color} transform={`translate(0 ${layer.offset})`}>
            <g className="motion-reduce:hidden">
              <use href={"#" + waveId} /><use href={"#" + waveId} x="1440" />
              <animateTransform attributeName="transform" type="translate"
                from={layer.reverse ? "-1440 0" : "0 0"} to={layer.reverse ? "0 0" : "-1440 0"}
                dur={layer.duration} repeatCount="indefinite" />
            </g>
            <use href={"#" + waveId} className="hidden motion-reduce:block" />
          </g>
        ))}
      </svg>
    </div>
  );
}
