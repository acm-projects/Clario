import type { CSSProperties, MouseEvent, ReactNode } from "react";
export interface MagicBentoItem {
  id?: string;
  label?: string;
  title?: string;
  description?: string;
  icon?: ReactNode;
  image?: string;
  visual?: ReactNode;
  content?: ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  colSpan?: number;
  rowSpan?: number;
}
export interface MagicBentoProps {
  items?: MagicBentoItem[];
  columns?: number;
  rowHeight?: number;
  gap?: number;
  radius?: number;
  theme?: "dark" | "light";
  glowColor?: string;
  enableBorderGlow?: boolean;
  enableSpotlight?: boolean;
  spotlightRadius?: number;
  enableStars?: boolean;
  particleCount?: number;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  textAutoHide?: boolean;
  intro?: boolean;
  disableAnimations?: boolean;
  onItemClick?: (item: MagicBentoItem, index: number) => void;
  className?: string;
  style?: CSSProperties;
}
export default function MagicBento(props: MagicBentoProps): ReactNode;
