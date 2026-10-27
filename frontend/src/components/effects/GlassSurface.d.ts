import type { CSSProperties, ReactNode, RefObject } from 'react';
export interface GlassSurfaceProps {
  children?: ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: 'R' | 'G' | 'B';
  yChannel?: 'R' | 'G' | 'B';
  mixBlendMode?: CSSProperties['mixBlendMode'];
  refraction?: boolean;
  renderer?: 'auto' | 'svg' | 'webgl';
  backdrop?: RefObject<HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | null>;
  shape?: string;
  className?: string;
  style?: CSSProperties;
}
export default function GlassSurface(props: GlassSurfaceProps): ReactNode;
