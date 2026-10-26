'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  FigmaIcon,
  FingerPrintIcon,
  GitBranchIcon,
  GithubIcon,
  Key01Icon,
  NotionIcon,
  SlackIcon,
  SparklesIcon,
  Tick02Icon
} from '@hugeicons/core-free-icons';


const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const THEMES = {
  dark: {
    '--mb-surface': 'linear-gradient(180deg, #1a1820 0%, #121116 100%)',
    '--mb-edge': 'rgba(255, 255, 255, 0.07)',
    '--mb-highlight': 'rgba(255, 255, 255, 0.06)',
    '--mb-shadow': '0 24px 48px -28px rgba(0, 0, 0, 0.85), 0 8px 18px -12px rgba(0, 0, 0, 0.6)',
    '--mb-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
    '--mb-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--mb-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--mb-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--mb-well': 'rgba(255, 255, 255, 0.03)',
    '--mb-well-edge': 'rgba(255, 255, 255, 0.06)',
    '--mb-ink': '#f4f4f5',
    '--mb-muted': 'rgba(244, 244, 245, 0.6)',
    '--mb-faint': 'rgba(244, 244, 245, 0.3)',
    '--mb-line': 'rgba(244, 244, 245, 0.1)',
    '--mb-secondary': '#a1a1aa',
    '--mb-secondary-ink': '#121016',
    '--mb-cursor-stroke': 'rgba(18, 16, 22, 0.9)',
    '--mb-ring': 'rgba(18, 16, 22, 0.85)',
    '--mb-focus': 'rgba(244, 244, 245, 0.5)',
    '--mb-glow-alpha': 0.85,
    '--mb-spot-alpha': 0.07
  },
  light: {
    '--mb-surface': 'linear-gradient(180deg, #ffffff 0%, #f7f7f9 100%)',
    '--mb-edge': 'rgba(24, 24, 27, 0.08)',
    '--mb-highlight': 'rgba(255, 255, 255, 1)',
    '--mb-shadow': '0 24px 48px -30px rgba(24, 24, 27, 0.28), 0 8px 18px -14px rgba(24, 24, 27, 0.16)',
    '--mb-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
    '--mb-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--mb-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--mb-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.22)',
    '--mb-well': 'rgba(24, 24, 27, 0.025)',
    '--mb-well-edge': 'rgba(24, 24, 27, 0.06)',
    '--mb-ink': '#18181b',
    '--mb-muted': 'rgba(24, 24, 27, 0.6)',
    '--mb-faint': 'rgba(24, 24, 27, 0.3)',
    '--mb-line': 'rgba(24, 24, 27, 0.08)',
    '--mb-secondary': '#71717a',
    '--mb-secondary-ink': '#ffffff',
    '--mb-cursor-stroke': '#ffffff',
    '--mb-ring': '#ffffff',
    '--mb-focus': 'rgba(24, 24, 27, 0.4)',
    '--mb-glow-alpha': 0.5,
    '--mb-spot-alpha': 0.035
  }
};

const INK = { dark: [244, 244, 245], light: [24, 24, 27] };
const MIN_CELL = 150;
const MIN_PAIR = 200;
const STAGGER = 80;
const TILT = 6;
const MAGNET = 6;

const DEFAULT_ITEMS = [
  { title: 'Analytics', description: 'Track user behavior', visual: 'analytics' },
  { title: 'Dashboard', description: 'Centralized data view', visual: 'dashboard' },
  {
    title: 'Collaboration',
    description: 'Work together seamlessly',
    visual: 'collaboration',
    colSpan: 2,
    rowSpan: 2
  },
  { title: 'Automation', description: 'Streamline workflows', visual: 'automation', colSpan: 2, rowSpan: 2 },
  { title: 'Integration', description: 'Connect favorite tools', visual: 'integration' },
  { title: 'Security', description: 'Enterprise-grade protection', visual: 'security' }
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const vars = values => values;

const parseRgb = value => {
  if (!value) return null;
  const text = String(value).trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const full = hex[1].length === 3 ? hex[1].replace(/./g, digit => digit + digit) : hex[1];
    return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16));
  }
  const numbers = text.match(/[\d.]+/g);
  if (numbers && numbers.length >= 3 && /^(rgba?\(|[\d.\s,]+$)/i.test(text)) {
    return numbers.slice(0, 3).map(channel => clamp(Math.round(parseFloat(channel)), 0, 255));
  }
  return null;
};

const inkFor = rgb => {
  const [r, g, b] = rgb.map(channel => channel / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? '#121016' : '#ffffff';
};

const CHART = [3.1, 3.8, 3.5, 4.9, 4.4, 5.8, 5.3, 6.9, 6.5, 8.2, 9.4, 12.4];

const curve = (values, width, height) => {
  const top = 6;
  const bottom = 2;
  const low = Math.min(...values) * 0.7;
  const high = Math.max(...values);
  const points = values.map((value, index) => [
    (index / (values.length - 1)) * width,
    top + (1 - (value - low) / (high - low)) * (height - top - bottom)
  ]);
  const count = points.length;
  const slopes = [];
  for (let i = 0; i < count - 1; i++) {
    slopes.push((points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0]));
  }
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === count - 1) return slopes[count - 2];
    return slopes[i - 1] * slopes[i] > 0 ? (slopes[i - 1] + slopes[i]) / 2 : 0;
  });
  for (let i = 0; i < count - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / slopes[i];
    const b = tangents[i + 1] / slopes[i];
    const length = a * a + b * b;
    if (length > 9) {
      const scale = 3 / Math.sqrt(length);
      tangents[i] = scale * a * slopes[i];
      tangents[i + 1] = scale * b * slopes[i];
    }
  }
  let line = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
  const samples = [];
  for (let i = 0; i < count - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const third = (x1 - x0) / 3;
    const c1 = [x0 + third, y0 + tangents[i] * third];
    const c2 = [x1 - third, y1 - tangents[i + 1] * third];
    line += ` C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${x1.toFixed(2)},${y1.toFixed(2)}`;
    for (let step = 0; step < 12; step++) {
      const t = step / 12;
      const u = 1 - t;
      samples.push([
        u * u * u * x0 + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * x1,
        u * u * u * y0 + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * y1
      ]);
    }
  }
  samples.push(points[count - 1]);
  const area = `${line} L${width.toFixed(2)},${height.toFixed(2)} L0,${height.toFixed(2)} Z`;
  return { line, area, samples };
};

const sampleAt = (samples, x) => {
  let index = 1;
  while (index < samples.length - 1 && samples[index][0] < x) index++;
  const [x0, y0] = samples[index - 1];
  const [x1, y1] = samples[index];
  const t = x1 === x0 ? 0 : clamp((x - x0) / (x1 - x0), 0, 1);
  return y0 + (y1 - y0) * t;
};

const AnalyticsVisual = () => {
  const chartRef = useRef(null);
  const plotRef = useRef(null);
  const scrubRef = useRef(null);
  const dotRef = useRef(null);
  const valueRef = useRef(null);
  const noteRef = useRef(null);
  const [size, setSize] = useState(null);

  useIsomorphicLayoutEffect(() => {
    const plot = plotRef.current;
    if (!plot) return;
    const update = () => {
      const next = { width: plot.clientWidth, height: plot.clientHeight };
      setSize(previous =>
        previous && previous.width === next.width && previous.height === next.height ? previous : next
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(plot);
    return () => observer.disconnect();
  }, []);

  const shape = useMemo(
    () => (size && size.width > 4 && size.height > 4 ? curve(CHART, size.width, size.height) : null),
    [size]
  );

  const scrub = event => {
    const plot = plotRef.current;
    const chart = chartRef.current;
    const line = scrubRef.current;
    const dot = dotRef.current;
    const label = valueRef.current;
    const note = noteRef.current;
    if (!shape || !plot || !chart || !line || !dot || !label || !note) return;
    const rect = plot.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = sampleAt(shape.samples, x);
    const position = (x / Math.max(1, rect.width)) * (CHART.length - 1);
    const index = Math.floor(position);
    const next = Math.min(CHART.length - 1, index + 1);
    const value = CHART[index] + (CHART[next] - CHART[index]) * (position - index);
    chart.dataset.scrub = '';
    line.style.transform = `translateX(${x.toFixed(1)}px)`;
    dot.style.transform = `translateY(${y.toFixed(1)}px)`;
    label.textContent = `${value.toFixed(1)}k`;
    note.textContent = `Oct ${Math.round(position) + 1}`;
  };

  const rest = () => {
    if (chartRef.current) delete chartRef.current.dataset.scrub;
    if (valueRef.current) valueRef.current.textContent = `${CHART[CHART.length - 1].toFixed(1)}k`;
    if (noteRef.current) noteRef.current.textContent = '+18%';
  };

  return (
    <div
      ref={chartRef}
      className={"magic-bento__chart flex min-h-0 flex-1 flex-col [touch-action:pan-y] [&[data-scrub]_.magic-bento\\_\\_scrub]:[opacity:1] [@container_(max-height:_38px)]:invisible"}
      onPointerMove={scrub}
      onPointerDown={scrub}
      onPointerLeave={rest}
    >
      <div className="magic-bento__figure flex min-w-0 [align-items:baseline] [gap:6px] whitespace-nowrap">
        <span ref={valueRef} className="magic-bento__figure-value [color:var(--mb-ink)] [font-size:15px] [font-variant-numeric:tabular-nums] font-semibold [letter-spacing:-0.02em] [line-height:18px]">
          {CHART[CHART.length - 1].toFixed(1)}k
        </span>
        <span ref={noteRef} className="magic-bento__figure-note min-w-0 overflow-hidden [color:var(--mb-muted)] text-ellipsis [font-size:11.5px] [font-variant-numeric:tabular-nums] [line-height:14px]">
          +18%
        </span>
      </div>
      <div ref={plotRef} className={"magic-bento__plot relative min-h-0 flex-1 [margin-top:6px] [&_svg]:absolute [&_svg]:[inset:0] [&_svg]:block [&_svg]:w-full [&_svg]:h-full [&_svg]:overflow-visible"}>
        {shape && size && (
          <svg viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
            <path className="magic-bento__chart-area [fill:rgba(var(--mb-accent-rgb),_0.14)]" d={shape.area} />
            <path className="magic-bento__chart-line [fill:none] [stroke:rgb(var(--mb-accent-rgb))] [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.6]" d={shape.line} pathLength="1" />
          </svg>
        )}
        <span ref={scrubRef} className="magic-bento__scrub absolute [top:0] [bottom:0] [left:0] [width:1px] [background:linear-gradient(to_bottom,_rgba(var(--mb-accent-rgb),_0),_rgba(var(--mb-accent-rgb),_0.35))] [opacity:0] pointer-events-none [transition:opacity_180ms_ease]">
          <span ref={dotRef} className="magic-bento__scrub-dot absolute [top:0] [left:0] [width:7px] [height:7px] [margin:-3.5px_0_0_-3px] rounded-full [background:rgb(var(--mb-accent-rgb))] [box-shadow:0_0_0_3px_var(--mb-ring)]" />
        </span>
      </div>
    </div>
  );
};

const BARS = [42, 58, 49, 71, 63, 88, 76];

const DashboardVisual = () => (
  <div className="magic-bento__bars flex min-h-0 flex-1 flex-col [@container_(max-height:_38px)]:invisible">
    <div className="magic-bento__figure flex min-w-0 [align-items:baseline] [gap:6px] whitespace-nowrap">
      <span className="magic-bento__figure-value [color:var(--mb-ink)] [font-size:15px] [font-variant-numeric:tabular-nums] font-semibold [letter-spacing:-0.02em] [line-height:18px]">$48.2k</span>
      <span className="magic-bento__figure-note min-w-0 overflow-hidden [color:var(--mb-muted)] text-ellipsis [font-size:11.5px] [font-variant-numeric:tabular-nums] [line-height:14px]">Weekly</span>
    </div>
    <div className="magic-bento__bars-plot flex min-h-0 flex-1 items-end [gap:5px] [margin-top:8px]">
      {BARS.map((height, index) => (
        <span
          key={index}
          className={"magic-bento__bar relative [height:calc(var(--h)_*_100%)] [min-height:3px] flex-1 [border-radius:3px_3px_2px_2px] [background:rgba(var(--mb-accent-rgb),_0.18)] [transform-origin:50%_100%] [transition:background-color_200ms_ease,_filter_200ms_ease] [&[data-peak]]:[background:rgb(var(--mb-accent-rgb))] [@media_(hover:_hover)]:[&:hover]:[background:rgba(var(--mb-accent-rgb),_0.42)] [@media_(hover:_hover)]:[&[data-peak]:hover]:[background:rgb(var(--mb-accent-rgb))] [@media_(hover:_hover)]:[&[data-peak]:hover]:[filter:brightness(1.1)]"}
          data-peak={height === Math.max(...BARS) ? '' : undefined}
          style={vars({ '--h': height / 100, '--i': index })}
        />
      ))}
    </div>
  </div>
);

const ARROW = (
  <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true">
    <path
      d="M2.2 1.6 13.4 9.9c.5.4.3 1.2-.4 1.3l-4.6.6-2.2 4.2c-.3.6-1.2.5-1.4-.1L1.2 2.4c-.2-.6.5-1.1 1-.8Z"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

const CollaborationVisual = () => (
  <div className="magic-bento__collab relative flex min-h-0 flex-col overflow-hidden [padding:16px_16px_22px] magic-bento__well relative box-border [border-radius:var(--mb-inner-radius)] [background:var(--mb-well)] [box-shadow:inset_0_0_0_1px_var(--mb-well-edge)]">
    <span className="magic-bento__doc-title [color:var(--mb-ink)] [font-size:14px] font-semibold [line-height:18px]">Launch plan</span>
    <div className="magic-bento__lines flex flex-col [gap:10px] [margin-top:18px]">
      <span className="magic-bento__line relative [width:var(--w)] [height:6px] [border-radius:3px] [background:var(--mb-line)]" style={vars({ '--w': '92%' })} />
      <span className="magic-bento__line relative [width:var(--w)] [height:6px] [border-radius:3px] [background:var(--mb-line)]" style={vars({ '--w': '78%' })} />
      <span className="magic-bento__line relative [width:var(--w)] [height:6px] [border-radius:3px] [background:var(--mb-line)]" style={vars({ '--w': '86%' })} />
      <span className="magic-bento__line relative [width:var(--w)] [height:6px] [border-radius:3px] [background:var(--mb-line)]" style={vars({ '--w': '44%' })} />
      <span className="magic-bento__line relative [width:var(--w)] [height:6px] [border-radius:3px] [background:var(--mb-line)] magic-bento__line--gap [margin-top:8px]" style={vars({ '--w': '88%' })} />
      <span className="magic-bento__line relative [width:var(--w)] [height:6px] [border-radius:3px] [background:var(--mb-line)]" style={vars({ '--w': '70%' })}>
        <span className="magic-bento__selection absolute [top:-4px] [bottom:-4px] [left:var(--from)] [width:var(--span)] [border-radius:3px] [background:rgba(var(--mb-accent-rgb),_0.16)]" style={vars({ '--from': '18%', '--span': '58%' })}>
          <span className="magic-bento__caret absolute [top:-5px] [right:-1px] [bottom:-5px] [width:1.5px] [border-radius:1px] [background:rgb(var(--mb-accent-rgb))]" />
        </span>
      </span>
      <span className="magic-bento__line relative [width:var(--w)] [height:6px] [border-radius:3px] [background:var(--mb-line)]" style={vars({ '--w': '82%' })} />
    </div>
    <span
      className={"magic-bento__cursor absolute [top:var(--y)] [left:var(--x)] [z-index:2] flex items-start pointer-events-none [&_svg]:block [&_svg]:[flex:none] [&_svg]:[filter:drop-shadow(0_1px_1.5px_rgba(0,_0,_0,_0.35))] magic-bento__cursor--primary [&_svg_path]:[fill:rgb(var(--mb-accent-rgb))] [&_svg_path]:[stroke:var(--mb-cursor-stroke)] [&_.magic-bento\\_\\_cursor-name]:[background:rgb(var(--mb-accent-rgb))] [&_.magic-bento\\_\\_cursor-name]:[color:var(--mb-accent-ink)]"}
      style={vars({ '--x': '58%', '--y': '52%', '--i': 0, '--path': 'magic-bento-path-a' })}
    >
      {ARROW}
      <span className="magic-bento__cursor-name [margin:13px_0_0_-2px] [padding:2px_7px] [border-radius:7px] [font-size:10.5px] font-semibold [line-height:14px] whitespace-nowrap">Maya</span>
    </span>
    <span
      className={"magic-bento__cursor absolute [top:var(--y)] [left:var(--x)] [z-index:2] flex items-start pointer-events-none [&_svg]:block [&_svg]:[flex:none] [&_svg]:[filter:drop-shadow(0_1px_1.5px_rgba(0,_0,_0,_0.35))] magic-bento__cursor--secondary [&_svg_path]:[fill:var(--mb-secondary)] [&_svg_path]:[stroke:var(--mb-cursor-stroke)] [&_.magic-bento\\_\\_cursor-name]:[background:var(--mb-secondary)] [&_.magic-bento\\_\\_cursor-name]:[color:var(--mb-secondary-ink)]"}
      style={vars({ '--x': '30%', '--y': '24%', '--i': 1, '--path': 'magic-bento-path-b' })}
    >
      {ARROW}
      <span className="magic-bento__cursor-name [margin:13px_0_0_-2px] [padding:2px_7px] [border-radius:7px] [font-size:10.5px] font-semibold [line-height:14px] whitespace-nowrap">Leo</span>
    </span>
  </div>
);

const STEPS = [
  { label: 'Install', time: '8s' },
  { label: 'Build', time: '12s' },
  { label: 'Test', time: '48s' },
  { label: 'Deploy', time: '9s' }
];

const AutomationVisual = () => (
  <div className="magic-bento__flow relative flex min-h-0 flex-col [gap:8px]" style={vars({ '--n': STEPS.length })}>
    <div className={"magic-bento__flow-trigger flex items-center [gap:10px] [padding:8px_12px_8px_8px] magic-bento__tile relative box-border [border-radius:var(--mb-inner-radius)] [background:var(--mb-tile)] [box-shadow:var(--mb-tile-shadow)] [&::after]:[content:''] [&::after]:absolute [&::after]:[inset:0] [&::after]:[border-radius:inherit] [&::after]:[box-shadow:inset_0_0_0_1px_var(--mb-tile-edge),_inset_0_1px_0_var(--mb-tile-highlight)] [&::after]:pointer-events-none"}>
      <span className="magic-bento__flow-glyph grid [width:28px] [height:28px] [flex:none] place-items-center [border-radius:calc(var(--mb-inner-radius)_-_2px)] [background:var(--mb-well)] [color:var(--mb-ink)]">
        <HugeiconsIcon icon={GitBranchIcon} size={15} strokeWidth={1.8} />
      </span>
      <span className="magic-bento__flow-copy flex min-w-0 flex-col">
        <span className="magic-bento__flow-name overflow-hidden [color:var(--mb-ink)] [font-size:14px] font-semibold [line-height:17px] text-ellipsis whitespace-nowrap">Push to main</span>
        <span className="magic-bento__flow-meta overflow-hidden [color:var(--mb-muted)] [font-size:11.5px] [line-height:15px] text-ellipsis whitespace-nowrap magic-bento__flow-hash [font-family:ui-monospace,_SFMono-Regular,_Menlo,_Consolas,_monospace] [font-size:14px]">a1c9f3e</span>
      </span>
    </div>
    <ol className="magic-bento__steps relative flex flex-col [gap:2px] [margin:0] [padding:2px_0_0] [list-style:none] magic-bento__well relative box-border [border-radius:var(--mb-inner-radius)] [background:var(--mb-well)] [box-shadow:inset_0_0_0_1px_var(--mb-well-edge)]">
      <span className="magic-bento__rail absolute [top:16px] [bottom:16px] [left:21px] [width:1px] [background:var(--mb-line)]" aria-hidden="true">
        <span className="magic-bento__rail-fill absolute [inset:0] [background:rgba(var(--mb-accent-rgb),_0.55)] [transform-origin:50%_0]" />
      </span>
      {STEPS.map((step, index) => (
        <li key={step.label} className="magic-bento__step relative flex [height:33px] items-center [gap:10px] [padding:0_12px_0_14px] [color:var(--mb-ink)] [font-size:14px] [line-height:16px]" style={vars({ '--i': index })}>
          <span className={"magic-bento__status relative grid [width:16px] [height:16px] [flex:none] place-items-center [&_>_*]:[grid-area:1_/_1]"}>
            <span className="magic-bento__pending [width:12px] [height:12px] box-border [border:1.5px_dashed_var(--mb-faint)] rounded-full [opacity:0]" />
            <span className="magic-bento__spinner [width:14px] [height:14px] box-border [border:1.5px_solid_rgba(var(--mb-accent-rgb),_0.22)] [border-top-color:rgb(var(--mb-accent-rgb))] rounded-full [opacity:0]" />
            <span className="magic-bento__done grid [width:16px] [height:16px] place-items-center rounded-full [background:rgb(var(--mb-accent-rgb))] [color:var(--mb-accent-ink)]">
              <HugeiconsIcon icon={Tick02Icon} size={11} strokeWidth={2.6} />
            </span>
          </span>
          {step.label}
          <span className="magic-bento__step-time [margin-left:auto] [color:var(--mb-muted)] [font-size:14px] [font-variant-numeric:tabular-nums]">{step.time}</span>
        </li>
      ))}
    </ol>
  </div>
);

const APPS = [
  { icon: SlackIcon, x: '17%', y: '24%' },
  { icon: GithubIcon, x: '83%', y: '24%' },
  { icon: FigmaIcon, x: '17%', y: '78%' },
  { icon: NotionIcon, x: '83%', y: '78%' }
];

const IntegrationVisual = () => (
  <div className="magic-bento__hub relative w-full [max-width:240px] min-h-0 flex-1 [margin:0_auto] [@container_(max-height:_60px)]:hidden">
    <svg className={"magic-bento__hub-links absolute [inset:0] w-full h-full overflow-visible [&_line]:[stroke:var(--mb-line)] [&_line]:[stroke-width:1] [&_line]:[vector-effect:non-scaling-stroke]"} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {APPS.map(app => (
        <line key={app.x + app.y} x1={parseFloat(app.x)} y1={parseFloat(app.y)} x2="50" y2="51" pathLength="1" />
      ))}
    </svg>
    {APPS.map((app, index) => (
      <span
        key={`packet-${index}`}
        className="magic-bento__packet absolute [top:var(--y)] [left:var(--x)] [width:4px] [height:4px] [margin:-2px_0_0_-2px] rounded-full [background:rgb(var(--mb-accent-rgb))] [opacity:0]"
        style={vars({ '--x': app.x, '--y': app.y, '--i': index })}
      />
    ))}
    {APPS.map((app, index) => (
      <span
        key={app.x + app.y}
        className={"magic-bento__hub-node [--size:min(var(--s),_30cqh)] absolute [top:var(--y)] [left:var(--x)] grid [width:var(--size)] [height:var(--size)] place-items-center [margin:calc(var(--size)_*_-0.5)_0_0_calc(var(--size)_*_-0.5)] [color:var(--mb-ink)] [&.magic-bento\\_\\_tile]:[border-radius:calc(var(--size)_*_0.3)] magic-bento__tile relative box-border [border-radius:var(--mb-inner-radius)] [background:var(--mb-tile)] [box-shadow:var(--mb-tile-shadow)] [&::after]:[content:''] [&::after]:absolute [&::after]:[inset:0] [&::after]:[border-radius:inherit] [&::after]:[box-shadow:inset_0_0_0_1px_var(--mb-tile-edge),_inset_0_1px_0_var(--mb-tile-highlight)] [&::after]:pointer-events-none"}
        style={vars({ '--x': app.x, '--y': app.y, '--s': '26px', '--i': index + 1 })}
      >
        <HugeiconsIcon icon={app.icon} size={14} strokeWidth={1.8} />
      </span>
    ))}
    <span
      className={"magic-bento__hub-node [--size:min(var(--s),_30cqh)] absolute [top:var(--y)] [left:var(--x)] grid [width:var(--size)] [height:var(--size)] place-items-center [margin:calc(var(--size)_*_-0.5)_0_0_calc(var(--size)_*_-0.5)] [color:var(--mb-ink)] [&.magic-bento\\_\\_tile]:[border-radius:calc(var(--size)_*_0.3)] magic-bento__tile relative box-border [border-radius:var(--mb-inner-radius)] [background:var(--mb-tile)] [box-shadow:var(--mb-tile-shadow)] [&::after]:[content:''] [&::after]:absolute [&::after]:[inset:0] [&::after]:[border-radius:inherit] [&::after]:[box-shadow:inset_0_0_0_1px_var(--mb-tile-edge),_inset_0_1px_0_var(--mb-tile-highlight)] [&::after]:pointer-events-none"}
      style={vars({ '--x': '50%', '--y': '51%', '--s': '34px', '--i': 0 })}
    >
      <HugeiconsIcon icon={SparklesIcon} size={17} strokeWidth={1.8} />
    </span>
  </div>
);

const SETTINGS = [
  { icon: Key01Icon, label: 'SSO' },
  { icon: FingerPrintIcon, label: '2FA' }
];

const SecurityVisual = () => (
  <div className="magic-bento__shield flex w-full [max-width:320px] min-h-0 flex-1 flex-col justify-center [gap:8px] [@container_(max-height:_38px)]:invisible">
    {SETTINGS.map((setting, index) => (
      <div key={setting.label} className={"magic-bento__setting flex [height:32px] [flex:none] items-center [gap:8px] [padding:0_8px_0_10px] [color:var(--mb-ink)] [font-size:12.5px] font-medium [line-height:16px] [@container_(max-height:_78px)]:[&_~_.magic-bento\\_\\_setting]:hidden magic-bento__tile relative box-border [border-radius:var(--mb-inner-radius)] [background:var(--mb-tile)] [box-shadow:var(--mb-tile-shadow)] [&::after]:[content:''] [&::after]:absolute [&::after]:[inset:0] [&::after]:[border-radius:inherit] [&::after]:[box-shadow:inset_0_0_0_1px_var(--mb-tile-edge),_inset_0_1px_0_var(--mb-tile-highlight)] [&::after]:pointer-events-none"}>
        <HugeiconsIcon icon={setting.icon} size={14} strokeWidth={1.8} />
        <span className="magic-bento__setting-label overflow-hidden text-ellipsis whitespace-nowrap">{setting.label}</span>
        <span className={"magic-bento__switch relative [width:26px] [height:16px] [flex:none] [margin-left:auto] [border-radius:8px] [background:rgb(var(--mb-accent-rgb))] [transition:background-color_220ms_ease] [&::after]:[content:''] [&::after]:absolute [&::after]:[top:2px] [&::after]:[left:2px] [&::after]:[width:12px] [&::after]:[height:12px] [&::after]:rounded-full [&::after]:[background:var(--mb-accent-ink)] [&::after]:[box-shadow:0_1px_2px_rgba(0,_0,_0,_0.3)] [&::after]:[transform:translateX(10px)] [&::after]:[transition:transform_320ms_var(--mb-spring)] [&[data-off]]:[background:var(--mb-line)] [&[data-off]::after]:[background:var(--mb-ink)] [&[data-off]::after]:[transform:none]"} style={vars({ '--i': index })} />
      </div>
    ))}
  </div>
);

const VISUALS = {
  analytics: AnalyticsVisual,
  dashboard: DashboardVisual,
  collaboration: CollaborationVisual,
  automation: AutomationVisual,
  integration: IntegrationVisual,
  security: SecurityVisual
};

const REPLAY = new Set([
  'magic-bento-draw',
  'magic-bento-fade',
  'magic-bento-grow',
  'magic-bento-pop',
  'magic-bento-select',
  'magic-bento-wait',
  'magic-bento-run',
  'magic-bento-check',
  'magic-bento-rail',
  'magic-bento-switch-track',
  'magic-bento-switch-knob'
]);

const FLOW = new Set([
  'magic-bento-wait',
  'magic-bento-run',
  'magic-bento-check',
  'magic-bento-rail',
  'magic-bento-fade'
]);

const finite = animation => {
  const timing = animation.effect?.getTiming?.();
  return timing ? timing.iterations !== Infinity : false;
};

const nameOf = animation => animation.animationName || '';

const subscribeMotion = listener => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  preference.addEventListener('change', listener);
  return () => preference.removeEventListener('change', listener);
};
const motionSnapshot = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const serverMotionSnapshot = () => true;
const MagicBento = ({
  items = DEFAULT_ITEMS,
  columns = 4,
  rowHeight = 200,
  gap = 12,
  radius = 20,
  theme = 'dark',
  glowColor,
  textAutoHide = true,
  enableBorderGlow = true,
  enableSpotlight = true,
  spotlightRadius = 300,
  enableStars = false,
  particleCount = 24,
  enableTilt = false,
  enableMagnetism = false,
  clickEffect = true,
  intro = true,
  disableAnimations = false,
  onItemClick,
  className = '',
  style
}) => {
  const reducedMotion = useSyncExternalStore(subscribeMotion, motionSnapshot, serverMotionSnapshot);
  const rootRef = useRef(null);
  const cellRefs = useRef([]);
  const cardRefs = useRef([]);
  const starRefs = useRef([]);
  const engineRef = useRef(null);
  const [cols, setCols] = useState(Math.max(1, Math.round(columns)));

  const palette = theme === 'light' ? 'light' : 'dark';
  const glow = parseRgb(glowColor) ?? INK[palette];
  const settings = {
    items,
    columns: Math.max(1, Math.round(columns)),
    gap: Math.max(0, gap),
    enableBorderGlow,
    enableSpotlight,
    spotlightRadius: Math.max(40, spotlightRadius),
    enableStars,
    particleCount: clamp(Math.round(particleCount), 0, 120),
    enableTilt,
    enableMagnetism,
    clickEffect,
    intro,
    disableAnimations,
    onItemClick,
    glow
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = reducedMotion;
    const motion = !settingsRef.current.disableAnimations && !reduced;
    const playIntro = motion && settingsRef.current.intro;
    if (motion) root.dataset.motion = '';
    else delete root.dataset.motion;
    if (playIntro) root.dataset.intro = '';
    else delete root.dataset.intro;

    const pointer = { x: -1e5, y: -1e5, inside: false, down: -1 };
    const light = { x: -1e5, y: -1e5, near: 0, ready: false };
    const states = [];
    const wave = { x: 0, y: 0, t: -1, duration: 1.1, reach: 800 };
    let rects = [];
    let bounds = null;
    let dirty = true;
    let raf = 0;
    let last = 0;
    let visible = true;
    let entered = !playIntro;
    let settleTimer = 0;
    let introTimer = 0;
    const lastFlow = [];

    const stateFor = index => {
      if (!states[index]) {
        states[index] = {
          hot: 0,
          rx: 0,
          ry: 0,
          tx: 0,
          ty: 0,
          vrx: 0,
          vry: 0,
          vtx: 0,
          vty: 0,
          press: 1,
          vpress: 0,
          stars: 0,
          particles: null,
          active: false,
          written: {}
        };
      }
      return states[index];
    };

    const write = (element, state, name, value) => {
      if (state.written[name] === value) return;
      state.written[name] = value;
      element.style.setProperty(name, value);
    };

    const measure = () => {
      dirty = false;
      bounds = root.getBoundingClientRect();
      rects = cellRefs.current.map(cell => (cell ? cell.getBoundingClientRect() : null));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      starRefs.current.forEach((canvas, index) => {
        const rect = rects[index];
        if (!canvas || !rect) return;
        const width = Math.max(1, Math.round(rect.width * ratio));
        const height = Math.max(1, Math.round(rect.height * ratio));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
      });
    };

    const seed = (index, rect) => {
      const count = settingsRef.current.particleCount;
      const state = stateFor(index);
      if (state.particles && state.particles.length === count) return state.particles;
      state.particles = Array.from({ length: count }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 6,
        vy: -4 - Math.random() * 10,
        size: 0.6 + Math.random() * 1.1,
        phase: Math.random() * Math.PI * 2,
        rate: 1.2 + Math.random() * 2.4
      }));
      return state.particles;
    };

    const drawStars = (index, rect, state, lx, ly, dt, now) => {
      const canvas = starRefs.current[index];
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;
      const ratio = canvas.width / Math.max(1, rect.width);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (state.stars < 0.004) return;
      const s = settingsRef.current;
      const particles = seed(index, rect);
      const reach = s.spotlightRadius * 0.75;
      const [r, g, b] = s.glow;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      for (const particle of particles) {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        if (particle.y < -4) {
          particle.y = rect.height + 4;
          particle.x = Math.random() * rect.width;
        }
        if (particle.x < -4) particle.x = rect.width + 4;
        if (particle.x > rect.width + 4) particle.x = -4;
        const distance = Math.hypot(particle.x - lx, particle.y - ly) / reach;
        if (distance >= 1) continue;
        const falloff = 1 - distance * distance * (3 - 2 * distance);
        const twinkle = 0.55 + 0.45 * Math.sin(now * 0.001 * particle.rate + particle.phase);
        const alpha = state.stars * falloff * twinkle;
        if (alpha < 0.01) continue;
        context.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      }
    };

    const replay = (card, filter) => {
      if (!motion || !card.getAnimations) return;
      for (const animation of card.getAnimations({ subtree: true })) {
        if (!filter.has(nameOf(animation)) || !finite(animation)) continue;
        const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
        if (target instanceof Element && target.classList.contains('magic-bento__cursor')) continue;
        animation.currentTime = 0;
        animation.play();
      }
    };

    const startWave = (x, y, duration) => {
      if (!motion || !bounds) return;
      wave.x = x;
      wave.y = y;
      wave.t = 0;
      wave.duration = duration;
      wave.reach =
        Math.max(
          Math.hypot(x - bounds.left, y - bounds.top),
          Math.hypot(x - bounds.right, y - bounds.top),
          Math.hypot(x - bounds.left, y - bounds.bottom),
          Math.hypot(x - bounds.right, y - bounds.bottom)
        ) + 140;
    };

    const frame = now => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      if (dirty) measure();
      const s = settingsRef.current;
      const cards = cardRefs.current;
      let busy = false;

      const margin = s.spotlightRadius * 0.5;
      const near =
        pointer.inside &&
        bounds &&
        pointer.x > bounds.left - margin &&
        pointer.x < bounds.right + margin &&
        pointer.y > bounds.top - margin &&
        pointer.y < bounds.bottom + margin
          ? 1
          : 0;
      if (!light.ready && near) {
        light.x = pointer.x;
        light.y = pointer.y;
        light.ready = true;
      }
      const follow = 1 - Math.exp(-dt / 0.05);
      light.x += (pointer.x - light.x) * follow;
      light.y += (pointer.y - light.y) * follow;
      const fade = 1 - Math.exp(-dt / (near > light.near ? 0.12 : 0.4));
      light.near += (near - light.near) * fade;
      if (Math.abs(near - light.near) < 0.002) light.near = near;
      else busy = true;
      if (Math.abs(pointer.x - light.x) + Math.abs(pointer.y - light.y) > 0.3) busy = true;

      let waveRadius = 0;
      let waveAlpha = 0;
      if (wave.t >= 0) {
        wave.t += dt;
        const progress = Math.min(1, wave.t / wave.duration);
        waveRadius = wave.reach * (1 - Math.pow(1 - progress, 2.2));
        waveAlpha = Math.pow(1 - progress, 1.3);
        if (progress >= 1) {
          wave.t = -1;
          waveAlpha = 0;
        } else busy = true;
      }

      cards.forEach((card, index) => {
        const rect = rects[index];
        if (!card || !rect) return;
        const state = stateFor(index);
        const lx = light.x - rect.left;
        const ly = light.y - rect.top;
        const px = pointer.x - rect.left;
        const py = pointer.y - rect.top;
        const inside = pointer.inside && entered && px >= 0 && py >= 0 && px <= rect.width && py <= rect.height;

        if (inside !== state.active) {
          state.active = inside;
          if (inside) {
            card.dataset.active = '';
            if (now - (lastFlow[index] || -1e9) > 3200 && card.querySelector('.magic-bento__steps')) {
              lastFlow[index] = now;
              replay(card, FLOW);
            }
          } else delete card.dataset.active;
        }

        const hotTarget = inside && s.enableSpotlight && motion ? 1 : 0;
        state.hot += (hotTarget - state.hot) * (1 - Math.exp(-dt / (hotTarget > state.hot ? 0.14 : 0.32)));
        if (Math.abs(hotTarget - state.hot) < 0.002) state.hot = hotTarget;
        else busy = true;

        const u = clamp(px / Math.max(1, rect.width), 0, 1) - 0.5;
        const v = clamp(py / Math.max(1, rect.height), 0, 1) - 0.5;
        const tilt = inside && s.enableTilt && motion;
        const magnet = inside && s.enableMagnetism && motion;
        const targets = [
          tilt ? -v * 2 * TILT : 0,
          tilt ? u * 2 * TILT : 0,
          magnet ? u * 2 * MAGNET : 0,
          magnet ? v * 2 * MAGNET : 0
        ];
        const keys = [
          ['rx', 'vrx'],
          ['ry', 'vry'],
          ['tx', 'vtx'],
          ['ty', 'vty']
        ];
        const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
        const h = dt / steps;
        keys.forEach(([key, velocity], k) => {
          for (let step = 0; step < steps; step++) {
            state[velocity] += (170 * (targets[k] - state[key]) - 20 * state[velocity]) * h;
            state[key] += state[velocity] * h;
          }
          if (Math.abs(targets[k] - state[key]) < 0.002 && Math.abs(state[velocity]) < 0.01) {
            state[key] = targets[k];
            state[velocity] = 0;
          } else busy = true;
        });
        const pressTarget = pointer.down === index && s.clickEffect && motion ? 0.985 : 1;
        for (let step = 0; step < steps; step++) {
          state.vpress += (420 * (pressTarget - state.press) - 28 * state.vpress) * h;
          state.press += state.vpress * h;
        }
        if (Math.abs(pressTarget - state.press) < 0.0002 && Math.abs(state.vpress) < 0.001) {
          state.press = pressTarget;
          state.vpress = 0;
        } else busy = true;

        write(card, state, '--mb-x', `${lx.toFixed(1)}px`);
        write(card, state, '--mb-y', `${ly.toFixed(1)}px`);
        write(card, state, '--mb-near', (s.enableBorderGlow && motion ? light.near : 0).toFixed(3));
        write(card, state, '--mb-hot', state.hot.toFixed(3));
        write(card, state, '--mb-rx', `${state.rx.toFixed(3)}deg`);
        write(card, state, '--mb-ry', `${state.ry.toFixed(3)}deg`);
        write(card, state, '--mb-tx', `${state.tx.toFixed(2)}px`);
        write(card, state, '--mb-ty', `${state.ty.toFixed(2)}px`);
        write(card, state, '--mb-press', state.press.toFixed(4));
        write(card, state, '--mb-wx', `${(wave.x - rect.left).toFixed(1)}px`);
        write(card, state, '--mb-wy', `${(wave.y - rect.top).toFixed(1)}px`);
        write(card, state, '--mb-wr', `${waveRadius.toFixed(1)}px`);
        write(card, state, '--mb-wa', waveAlpha.toFixed(3));

        if (s.enableStars && starRefs.current[index]) {
          const starTarget = inside && motion ? 1 : 0;
          state.stars += (starTarget - state.stars) * (1 - Math.exp(-dt / (starTarget ? 0.3 : 0.5)));
          if (state.stars < 0.004 && !starTarget) state.stars = 0;
          if (state.stars > 0 || starTarget) {
            drawStars(index, rect, state, lx, ly, dt, now);
            state.drawn = true;
            busy = true;
          } else if (state.drawn) {
            drawStars(index, rect, state, lx, ly, dt, now);
            state.drawn = false;
          }
        }
      });

      if (busy && visible) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const cardIndex = target => {
      if (!(target instanceof Element)) return -1;
      const card = target.closest('.magic-bento__card');
      return card instanceof HTMLElement ? cardRefs.current.indexOf(card) : -1;
    };

    const onPointerMove = event => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
      wake();
    };

    const onPointerOut = event => {
      if (event.relatedTarget) return;
      pointer.inside = false;
      pointer.down = -1;
      wake();
    };

    const onPointerDown = event => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
      pointer.down = cardIndex(event.target);
      wake();
    };

    const release = () => {
      if (pointer.down < 0) return;
      pointer.down = -1;
      wake();
    };

    const activate = (index, x, y) => {
      const s = settingsRef.current;
      const card = cardRefs.current[index];
      if (!card) return;
      if (s.clickEffect) {
        if (dirty) measure();
        startWave(x, y, 1.1);
        replay(card, REPLAY);
        lastFlow[index] = performance.now();
      }
      wake();
    };

    const onClick = event => {
      const index = cardIndex(event.target);
      const card = cardRefs.current[index];
      if (!card) return;
      if (event.detail === 0) {
        const rect = card.getBoundingClientRect();
        activate(index, rect.left + rect.width / 2, rect.top + rect.height / 2);
      } else activate(index, event.clientX, event.clientY);
    };

    const onKeyDown = event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = cardRefs.current[cardIndex(event.target)];
      if (!card || event.target !== card || card.tagName === 'A') return;
      event.preventDefault();
      card.click();
    };

    const onScroll = () => {
      dirty = true;
      wake();
    };

    const resizeObserver = new ResizeObserver(() => {
      const s = settingsRef.current;
      const width = root.clientWidth;
      const cell = count => (width - s.gap * (count - 1)) / count;
      const next = cell(s.columns) >= MIN_CELL ? s.columns : s.columns >= 2 && cell(2) >= MIN_PAIR ? 2 : 1;
      setCols(next);
      dirty = true;
      wake();
    });
    resizeObserver.observe(root);

    const enter = () => {
      entered = true;
      let order = 0;
      cellRefs.current.forEach(cell => {
        if (!cell) return;
        cell.style.setProperty('--mb-delay', `${order++ * STAGGER}ms`);
        cell.dataset.state = 'in';
      });
      if (dirty) measure();
      introTimer = window.setTimeout(() => {
        if (bounds) startWave(bounds.left, bounds.top, 1.7);
        wake();
      }, 260);
      settleTimer = window.setTimeout(
        () => {
          cellRefs.current.forEach(cell => cell?.style.setProperty('--mb-delay', '0ms'));
        },
        order * STAGGER + 2600
      );
      wake();
    };

    let gate = null;
    if (playIntro && typeof IntersectionObserver !== 'undefined') {
      gate = new IntersectionObserver(
        (entries, observer) => {
          if (!entries.some(entry => entry.isIntersecting)) return;
          observer.disconnect();
          enter();
        },
        { threshold: 0.15 }
      );
      gate.observe(root);
    } else {
      cellRefs.current.forEach(cell => {
        if (!cell) return;
        cell.style.setProperty('--mb-delay', '0ms');
        cell.dataset.state = 'in';
      });
      if (motion) {
        for (const animation of root.getAnimations ? root.getAnimations({ subtree: true }) : []) {
          if (REPLAY.has(nameOf(animation)) && finite(animation)) animation.finish();
        }
      }
    }

    const visibility = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) {
        dirty = true;
        wake();
      }
    });
    visibility.observe(root);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', release, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll, { passive: true });
    document.addEventListener('pointerout', onPointerOut);
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKeyDown);

    engineRef.current = {
      sync: () => {
        cellRefs.current.forEach(cell => {
          if (!cell || (!entered && playIntro)) return;
          if (cell.dataset.state !== 'in') {
            cell.style.setProperty('--mb-delay', '0ms');
            cell.dataset.state = 'in';
          }
        });
        dirty = true;
        wake();
      }
    };

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settleTimer);
      window.clearTimeout(introTimer);
      gate?.disconnect();
      visibility.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('pointerout', onPointerOut);
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKeyDown);
      engineRef.current = null;
    };
  }, [reducedMotion, disableAnimations]);

  useIsomorphicLayoutEffect(() => {
    engineRef.current?.sync();
  }, [items, cols, rowHeight, gap, radius, enableStars, enableSpotlight, enableBorderGlow]);

  const ink = INK[palette];
  const accent = parseRgb(glowColor) ?? ink;
  const corner = Math.max(0, radius);
  const span = Math.max(1, cols);

  cellRefs.current.length = items.length;
  cardRefs.current.length = items.length;
  starRefs.current.length = items.length;

  return (
    <div
      ref={rootRef}
      className={`magic-bento [--mb-spring:cubic-bezier(0.34,_1.4,_0.64,_1)] relative box-border grid [grid-auto-flow:row_dense] w-full [color:var(--mb-ink)] [font-feature-settings:'tnum'_0] [-webkit-tap-highlight-color:transparent] [@supports_(transition-timing-function:_linear(0,_1))]:[--mb-spring:linear(_0,_0.0603,_0.2033,_0.3821,_0.5633,_0.7258,_0.8584,_0.9574,_1.0242,_1.0634,_1.0809,_1.0828,_1.0747,_1.0613,_1.046,_1.0313,_1.0186,_1.0085,_1.0012,_0.9965,_0.994,_0.9931,_0.9933,_0.9941,_0.9953,_0.9966,_0.9978,_0.9988,_1_)] [&[data-intro]_.magic-bento\\_\\_cell]:[opacity:0] [&[data-intro]_.magic-bento\\_\\_cell]:[transform:translate3d(0,_16px,_0)_scale(0.97)] [&[data-intro]_.magic-bento\\_\\_cell[data-state='in']]:[opacity:1] [&[data-intro]_.magic-bento\\_\\_cell[data-state='in']]:[transform:none] [&[data-intro]_.magic-bento\\_\\_cell[data-state='in']]:[transition:opacity_420ms_cubic-bezier(0.22,_1,_0.36,_1)_var(--mb-delay),_transform_760ms_var(--mb-spring)_var(--mb-delay)] [&[data-autohide]_.magic-bento\\_\\_title]:[display:-webkit-box] [&[data-autohide]_.magic-bento\\_\\_title]:overflow-hidden [&[data-autohide]_.magic-bento\\_\\_title]:[-webkit-box-orient:vertical] [&[data-autohide]_.magic-bento\\_\\_title]:[-webkit-line-clamp:1] [&[data-autohide]_.magic-bento\\_\\_title]:[line-clamp:1] [&[data-autohide]_.magic-bento\\_\\_description]:[display:-webkit-box] [&[data-autohide]_.magic-bento\\_\\_description]:overflow-hidden [&[data-autohide]_.magic-bento\\_\\_description]:[-webkit-box-orient:vertical] [&[data-autohide]_.magic-bento\\_\\_description]:[-webkit-line-clamp:2] [&[data-autohide]_.magic-bento\\_\\_description]:[line-clamp:2] [&[data-motion]_.magic-bento\\_\\_chart-line]:[stroke-dasharray:1] [&[data-motion]_.magic-bento\\_\\_chart-line]:[animation:magic-bento-draw_1100ms_cubic-bezier(0.65,_0,_0.35,_1)_calc(var(--mb-delay)_+_220ms)_both_paused] [&[data-motion]_.magic-bento\\_\\_chart-area]:[animation:magic-bento-fade_700ms_ease_calc(var(--mb-delay)_+_700ms)_both_paused] [&[data-motion]_.magic-bento\\_\\_bar]:[animation:magic-bento-grow_760ms_var(--mb-spring)_calc(var(--mb-delay)_+_200ms_+_var(--i)_*_55ms)_both_paused] [&[data-motion]_.magic-bento\\_\\_cursor]:[animation:magic-bento-pop_420ms_var(--mb-spring)_calc(var(--mb-delay)_+_600ms_+_var(--i)_*_160ms)_both_paused,_var(--path)_9s_ease-in-out_calc(var(--i)_*_-3s)_infinite_paused] [&[data-motion]_.magic-bento\\_\\_selection]:[animation:magic-bento-select_900ms_cubic-bezier(0.65,_0,_0.35,_1)_calc(var(--mb-delay)_+_760ms)_both_paused] [&[data-motion]_.magic-bento\\_\\_caret]:[animation:magic-bento-blink_1.1s_steps(1)_infinite_paused] [&[data-motion]_.magic-bento\\_\\_pending]:[animation:magic-bento-wait_1ms_linear_calc(var(--mb-delay)_+_360ms_+_var(--i)_*_520ms)_both_paused] [&[data-motion]_.magic-bento\\_\\_spinner]:[animation:magic-bento-run_520ms_linear_calc(var(--mb-delay)_+_360ms_+_var(--i)_*_520ms)_both_paused,_magic-bento-spin_700ms_linear_infinite_paused] [&[data-motion]_.magic-bento\\_\\_done]:[animation:magic-bento-check_420ms_var(--mb-spring)_calc(var(--mb-delay)_+_880ms_+_var(--i)_*_520ms)_both_paused] [&[data-motion]_.magic-bento\\_\\_step-time]:[animation:magic-bento-fade_300ms_ease_calc(var(--mb-delay)_+_880ms_+_var(--i)_*_520ms)_both_paused] [&[data-motion]_.magic-bento\\_\\_rail-fill]:[animation:magic-bento-rail_calc(var(--n)_*_520ms)_linear_calc(var(--mb-delay)_+_360ms)_both_paused] [&[data-motion]_.magic-bento\\_\\_hub-node]:[animation:magic-bento-pop_520ms_var(--mb-spring)_calc(var(--mb-delay)_+_200ms_+_var(--i)_*_70ms)_both_paused] [&[data-motion]_.magic-bento\\_\\_hub-links_line]:[stroke-dasharray:1] [&[data-motion]_.magic-bento\\_\\_hub-links_line]:[animation:magic-bento-draw_700ms_cubic-bezier(0.65,_0,_0.35,_1)_calc(var(--mb-delay)_+_360ms)_both_paused] [&[data-motion]_.magic-bento\\_\\_card[data-active]_.magic-bento\\_\\_packet]:[animation:magic-bento-packet_1.8s_cubic-bezier(0.45,_0,_0.55,_1)_calc(var(--i)_*_0.45s)_infinite] [&[data-motion]_.magic-bento\\_\\_switch]:[animation:magic-bento-switch-track_420ms_ease_calc(var(--mb-delay)_+_520ms_+_var(--i)_*_200ms)_both_paused] [&[data-motion]_.magic-bento\\_\\_switch::after]:[animation:magic-bento-switch-knob_520ms_var(--mb-spring)_calc(var(--mb-delay)_+_520ms_+_var(--i)_*_200ms)_both_paused] [&[data-motion]_.magic-bento\\_\\_switch[data-off]]:animate-none [&[data-motion]_.magic-bento\\_\\_switch[data-off]::after]:animate-none [&[data-motion]_.magic-bento\\_\\_cell[data-state='in']_:is(_.magic-bento\\_\\_chart-line,_.magic-bento\\_\\_chart-area,_.magic-bento\\_\\_bar,_.magic-bento\\_\\_selection,_.magic-bento\\_\\_pending,_.magic-bento\\_\\_spinner,_.magic-bento\\_\\_done,_.magic-bento\\_\\_step-time,_.magic-bento\\_\\_rail-fill,_.magic-bento\\_\\_hub-node,_.magic-bento\\_\\_hub-links_line,_.magic-bento\\_\\_switch_)]:[animation-play-state:running] [&[data-motion]_.magic-bento\\_\\_cell[data-state='in']_.magic-bento\\_\\_switch::after]:[animation-play-state:running] [&[data-motion]_.magic-bento\\_\\_cell[data-state='in']_.magic-bento\\_\\_cursor]:[animation-play-state:running,_paused] [&[data-motion]_.magic-bento\\_\\_cell[data-state='in']_.magic-bento\\_\\_card[data-active]_.magic-bento\\_\\_cursor]:[animation-play-state:running,_running] [&[data-motion]_.magic-bento\\_\\_card[data-active]_.magic-bento\\_\\_caret]:[animation-play-state:running] [&[data-motion]_.magic-bento\\_\\_cell[data-state='in']_.magic-bento\\_\\_spinner]:[animation-play-state:running,_running] [@media_(prefers-reduced-motion:_reduce)]:[&[data-intro]_.magic-bento\\_\\_cell]:[opacity:1] [@media_(prefers-reduced-motion:_reduce)]:[&[data-intro]_.magic-bento\\_\\_cell]:[transform:none] [@media_(prefers-reduced-motion:_reduce)]:[&_.magic-bento\\_\\_cell]:transition-none [@media_(prefers-reduced-motion:_reduce)]:[&_.magic-bento\\_\\_cell]:[transform:none] [@media_(prefers-reduced-motion:_reduce)]:[&_.magic-bento\\_\\_card]:transition-none [@media_(prefers-reduced-motion:_reduce)]:[&_.magic-bento\\_\\_card]:[transform:none] [@media_(prefers-reduced-motion:_reduce)]:[&_.magic-bento\\_\\_light]:hidden [@media_(prefers-reduced-motion:_reduce)]:[&_.magic-bento\\_\\_border]:hidden [@media_(prefers-reduced-motion:_reduce)]:[&_.magic-bento\\_\\_stars]:hidden [@media_(prefers-reduced-motion:_reduce)]:[&_.magic-bento\\_\\_content_*]:animate-none! [@media_(prefers-reduced-motion:_reduce)]:[&_.magic-bento\\_\\_content_*::after]:animate-none! ${className}`.trim()}
      data-autohide={textAutoHide ? '' : undefined}
      data-motion={disableAnimations ? undefined : ''}
      data-intro={intro && !disableAnimations ? '' : undefined}
      style={{
        ...vars({
          ...THEMES[palette],
          '--mb-glow-rgb': glow.join(', '),
          '--mb-accent-rgb': accent.join(', '),
          '--mb-accent-ink': inkFor(accent),
          '--mb-radius': `${corner}px`,
          '--mb-inner-radius': `${Math.round(clamp(corner * 0.5, 6, 12))}px`,
          '--mb-pad': `${Math.round(clamp(corner * 0.85, 14, 20))}px`,
          '--mb-spot-size': `${Math.max(40, spotlightRadius)}px`,
          '--mb-border-size': `${Math.round(Math.max(40, spotlightRadius) * 0.75)}px`
        }),
        gridTemplateColumns: `repeat(${span}, minmax(0, 1fr))`,
        gridAutoRows: span === 1 ? `minmax(${rowHeight}px, auto)` : `${rowHeight}px`,
        gap: `${Math.max(0, gap)}px`,
        ...style
      }}
    >
      {items.map((item, index) => {
        const entry = item ?? {};
        const Visual = typeof entry.visual === 'string' ? VISUALS[entry.visual] : null;
        const visual = Visual ? <Visual /> : typeof entry.visual === 'string' ? null : entry.visual;
        const clickable = Boolean(entry.href || entry.onClick || onItemClick);
        const handleClick = event => {
          entry.onClick?.(event);
          onItemClick?.(entry, index);
        };
        const cardProps = {
          ref: element => {
            cardRefs.current[index] = element;
          },
          className: "magic-bento__card relative box-border flex w-full h-full flex-col overflow-hidden [border-radius:var(--mb-radius)] [background:var(--mb-surface)] [box-shadow:var(--mb-shadow)] [color:var(--mb-ink)] [text-decoration:none] isolate [outline:none] [transform:perspective(900px)_translate3d(var(--mb-tx,_0px),_var(--mb-ty,_0px),_0)_rotateX(var(--mb-rx,_0deg))_rotateY(var(--mb-ry,_0deg))_scale(var(--mb-press,_1))] select-none [-webkit-user-select:none] [&[data-clickable]]:cursor-pointer [&:focus-visible]:[box-shadow:var(--mb-shadow),_0_0_0_2px_var(--mb-focus)] [&[data-image]_.magic-bento\\_\\_header]:[color:rgba(244,_244,_245,_0.72)] [&[data-image]_.magic-bento\\_\\_description]:[color:rgba(244,_244,_245,_0.72)] [&[data-image]_.magic-bento\\_\\_title]:[color:#f4f4f5] [&[data-image]_.magic-bento\\_\\_icon]:[color:#f4f4f5]",
          'data-clickable': clickable ? '' : undefined,
          'data-image': entry.image ? '' : undefined,
          onClick: clickable ? handleClick : undefined
        };
        const body = (
          <>
            {entry.image && <img className="magic-bento__image absolute [inset:0] [z-index:0] w-full h-full object-cover pointer-events-none" src={entry.image} alt="" draggable={false} />}
            {entry.image && <span className="magic-bento__scrim absolute [inset:0] [z-index:0] [background:linear-gradient(_to_top,_rgba(10,_9,_13,_0.82)_0%,_rgba(10,_9,_13,_0.7)_14%,_rgba(10,_9,_13,_0.46)_30%,_rgba(10,_9,_13,_0.2)_46%,_rgba(10,_9,_13,_0.05)_60%,_rgba(10,_9,_13,_0)_72%_)] pointer-events-none" />}
            {enableSpotlight && <span className="magic-bento__light absolute [inset:0] [z-index:1] [border-radius:inherit] [background:radial-gradient(_var(--mb-spot-size)_circle_at_var(--mb-x,_-999px)_var(--mb-y,_-999px),_rgba(var(--mb-glow-rgb),_calc(var(--mb-spot-alpha)_*_var(--mb-hot,_0)_*_1))_0%,_rgba(var(--mb-glow-rgb),_calc(var(--mb-spot-alpha)_*_var(--mb-hot,_0)_*_0.973))_15%,_rgba(var(--mb-glow-rgb),_calc(var(--mb-spot-alpha)_*_var(--mb-hot,_0)_*_0.837))_30%,_rgba(var(--mb-glow-rgb),_calc(var(--mb-spot-alpha)_*_var(--mb-hot,_0)_*_0.593))_45%,_rgba(var(--mb-glow-rgb),_calc(var(--mb-spot-alpha)_*_var(--mb-hot,_0)_*_0.317))_60%,_rgba(var(--mb-glow-rgb),_calc(var(--mb-spot-alpha)_*_var(--mb-hot,_0)_*_0.104))_75%,_rgba(var(--mb-glow-rgb),_calc(var(--mb-spot-alpha)_*_var(--mb-hot,_0)_*_0.009))_90%,_rgba(var(--mb-glow-rgb),_0)_100%_)] pointer-events-none" />}
            {enableStars && (
              <canvas
                ref={element => {
                  starRefs.current[index] = element;
                }}
                className="magic-bento__stars absolute [inset:0] [z-index:1] block w-full h-full pointer-events-none"
                aria-hidden="true"
              />
            )}
            <div className="magic-bento__content relative [z-index:2] box-border flex min-h-0 flex-1 flex-col [gap:12px] [padding:var(--mb-pad)]">
              {entry.content ?? (
                <>
                  {(entry.icon || entry.label) && (
                    <div className="magic-bento__header flex min-w-0 items-center [gap:8px] [color:var(--mb-muted)] [font-size:14px] font-medium [line-height:16px]">
                      {entry.icon && <span className="magic-bento__icon grid [width:16px] [height:16px] [flex:none] place-items-center [color:var(--mb-ink)]">{entry.icon}</span>}
                      {entry.label && <span className="magic-bento__label overflow-hidden text-ellipsis whitespace-nowrap">{entry.label}</span>}
                    </div>
                  )}
                  {visual && (
                    <div className="magic-bento__visual relative flex min-h-0 flex-1 flex-col justify-center [container-type:size]" aria-hidden="true">
                      {visual}
                    </div>
                  )}
                  {(entry.title || entry.description) && (
                    <div className="magic-bento__text flex flex-col [gap:4px] [margin-top:auto]">
                      {entry.title && <h3 className="magic-bento__title [margin:0] [color:var(--mb-ink)] [font-size:15px] font-semibold [letter-spacing:-0.01em] [line-height:20px]">{entry.title}</h3>}
                      {entry.description && <p className="magic-bento__description [margin:0] [color:var(--mb-muted)] [font-size:14px] [line-height:1.45]">{entry.description}</p>}
                    </div>
                  )}
                </>
              )}
            </div>
            <span className="magic-bento__rim absolute [inset:0] [z-index:3] [border-radius:inherit] [box-shadow:inset_0_0_0_1px_var(--mb-edge),_inset_0_1px_0_var(--mb-highlight)] pointer-events-none" />
            <span className="magic-bento__border absolute [inset:0] [z-index:4] box-border [padding:1px] [border-radius:inherit] [background:radial-gradient(_var(--mb-border-size)_circle_at_var(--mb-x,_-999px)_var(--mb-y,_-999px),_rgba(var(--mb-glow-rgb),_calc(var(--mb-glow-alpha)_*_var(--mb-near,_0)_*_1))_0%,_rgba(var(--mb-glow-rgb),_calc(var(--mb-glow-alpha)_*_var(--mb-near,_0)_*_0.973))_15%,_rgba(var(--mb-glow-rgb),_calc(var(--mb-glow-alpha)_*_var(--mb-near,_0)_*_0.837))_30%,_rgba(var(--mb-glow-rgb),_calc(var(--mb-glow-alpha)_*_var(--mb-near,_0)_*_0.593))_45%,_rgba(var(--mb-glow-rgb),_calc(var(--mb-glow-alpha)_*_var(--mb-near,_0)_*_0.317))_60%,_rgba(var(--mb-glow-rgb),_calc(var(--mb-glow-alpha)_*_var(--mb-near,_0)_*_0.104))_75%,_rgba(var(--mb-glow-rgb),_calc(var(--mb-glow-alpha)_*_var(--mb-near,_0)_*_0.009))_90%,_rgba(var(--mb-glow-rgb),_0)_100%_),_radial-gradient(_circle_at_var(--mb-wx,_-999px)_var(--mb-wy,_-999px),_rgba(var(--mb-glow-rgb),_0)_calc(var(--mb-wr,_0px)_-_110px),_rgba(var(--mb-glow-rgb),_calc(var(--mb-glow-alpha)_*_var(--mb-wa,_0)_*_0.1))_calc(var(--mb-wr,_0px)_-_80px),_rgba(var(--mb-glow-rgb),_calc(var(--mb-glow-alpha)_*_var(--mb-wa,_0)_*_0.32))_calc(var(--mb-wr,_0px)_-_52px),_rgba(var(--mb-glow-rgb),_calc(var(--mb-glow-alpha)_*_var(--mb-wa,_0)_*_0.68))_calc(var(--mb-wr,_0px)_-_28px),_rgba(var(--mb-glow-rgb),_calc(var(--mb-glow-alpha)_*_var(--mb-wa,_0)_*_0.94))_calc(var(--mb-wr,_0px)_-_10px),_rgba(var(--mb-glow-rgb),_calc(var(--mb-glow-alpha)_*_var(--mb-wa,_0)))_calc(var(--mb-wr,_0px)_-_3px),_rgba(var(--mb-glow-rgb),_0)_var(--mb-wr,_0px)_)] [-webkit-mask:linear-gradient(#000_0_0)_content-box,_linear-gradient(#000_0_0)] [-webkit-mask-composite:xor] [mask:linear-gradient(#000_0_0)_content-box_exclude,_linear-gradient(#000_0_0)] pointer-events-none" />
          </>
        );

        return (
          <div
            key={entry.id ?? index}
            ref={element => {
              cellRefs.current[index] = element;
            }}
            className="magic-bento__cell relative min-w-0 min-h-0 [--mb-delay:0ms]"
            style={{
              gridColumn: `span ${Math.min(span, Math.max(1, Math.round(entry.colSpan ?? 1)))}`,
              gridRow: `span ${Math.max(1, Math.round(entry.rowSpan ?? 1))}`
            }}
          >
            {entry.href ? (
              <a {...cardProps} href={entry.href} target={entry.target} rel={entry.rel}>
                {body}
              </a>
            ) : (
              <div
                {...cardProps}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                aria-label={clickable ? entry.title : undefined}
              >
                {body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MagicBento;


