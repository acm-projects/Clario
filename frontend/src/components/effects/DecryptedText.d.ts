import type { HTMLAttributes, ReactElement } from 'react';

interface DecryptedTextProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  text: string;
  initialText?: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  useOriginalCharsOnly?: boolean;
  characters?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: 'view' | 'hover' | 'inViewHover' | 'click';
  clickMode?: 'once' | 'toggle';
}

export default function DecryptedText(props: DecryptedTextProps): ReactElement;
