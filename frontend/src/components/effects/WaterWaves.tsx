import { useId } from "react";

// Shared shape, colors, and timing keep the landing and dashboard water consistent.
export default function WaterWaves({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const wave = "clario-wave-" + id;
  const blend = "clario-blend-" + id;
  const layers = [
    { color: "var(--wave-far, #E3EEFF)", offset: 0, duration: "24s", reverse: false },
    { color: "var(--wave-mid, #BDD7FA)", offset: 24, duration: "20s", reverse: true },
    { color: "var(--wave-near, #8FB8F2)", offset: 48, duration: "17s", reverse: false },
  ];
  return <div className={className} aria-hidden="true">
    <svg viewBox="0 0 1440 200" preserveAspectRatio="none" className="block h-full w-full">
      <defs><path id={wave} d="M0 40 Q180 8 360 40 T720 40 T1080 40 T1440 40 V240 H0Z" /><linearGradient id={blend} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--water, #4E90EE)" stopOpacity="0" /><stop offset="100%" stopColor="var(--water, #4E90EE)" /></linearGradient></defs>
      {layers.map(({ color, offset, duration, reverse }) => <g key={color} transform={"translate(0 " + offset + ")"} fill={color}>
        <g className="motion-reduce:hidden"><use href={"#" + wave} /><use href={"#" + wave} x="1440" /><animateTransform attributeName="transform" type="translate" from={reverse ? "-1440 0" : "0 0"} to={reverse ? "0 0" : "-1440 0"} dur={duration} repeatCount="indefinite" /></g><use href={"#" + wave} className="hidden motion-reduce:block" />
      </g>)}<rect x="0" y="126" width="1440" height="74" fill={"url(#" + blend + ")"} />
    </svg>
  </div>;
}
