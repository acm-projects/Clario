import type { ReactNode } from "react";
export interface LightRaysProps {
  raysOrigin?: "top-center" | "top-left" | "top-right" | "right" | "left" | "bottom-center" | "bottom-right" | "bottom-left";
  raysColor?: string;
  raysSpeed?: number;
  lightSpread?: number;
  rayLength?: number;
  pulsating?: boolean;
  fadeDistance?: number;
  saturation?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noiseAmount?: number;
  distortion?: number;
  lightMode?: boolean;
  className?: string;
}
export default function LightRays(props: LightRaysProps): ReactNode;
