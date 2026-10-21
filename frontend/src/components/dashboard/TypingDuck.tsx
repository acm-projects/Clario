import { useEffect, useRef } from "react";
import useReducedMotion from "../../hooks/useReducedMotion";

type Frame = { x: number; y: number; width: number; height: number; anchorX: number; anchorY: number };

// Find the real grid gutters: this sheet includes uneven margins between cells.
function bands(counts: Uint32Array, threshold: number) {
  const result: [number, number][] = [];
  let start = -1;
  for (let i = 0; i <= counts.length; i++) {
    if (i < counts.length && counts[i] >= threshold) {
      if (start < 0) start = i;
    } else if (start >= 0) { result.push([start, i]); start = -1; }
  }
  return result;
}

export default function TypingDuck() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const sheet = new Image();
    let animation = 0;
    let disposed = false;
    sheet.onload = () => {
      if (disposed) return;
      const source = document.createElement("canvas");
      source.width = sheet.naturalWidth;
      source.height = sheet.naturalHeight;
      const buffer = source.getContext("2d", { willReadFrequently: true });
      if (!buffer) return;
      buffer.drawImage(sheet, 0, 0);
      const pixels = buffer.getImageData(0, 0, source.width, source.height).data;
      const opaque = (x: number, y: number) => pixels[(y * source.width + x) * 4 + 3] >= 160;
      const rowCounts = new Uint32Array(source.height);
      for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
        if (opaque(x, y)) rowCounts[y]++;
      }
      const frames: Frame[] = [];
      for (const [top, bottom] of bands(rowCounts, Math.max(6, Math.floor(source.width * .034)))) {
        const columnCounts = new Uint32Array(source.width);
        for (let x = 0; x < source.width; x++) for (let y = top; y < bottom; y++) {
          if (opaque(x, y)) columnCounts[x]++;
        }
        for (const [left, right] of bands(columnCounts, Math.max(3, Math.floor((bottom - top) * .04)))) {
          if (right - left < source.width / 30) continue;
          const x = Math.max(0, left - 3), y = Math.max(0, top - 8);
          const width = Math.min(source.width, right + 3) - x;
          const height = Math.min(source.height, bottom + 3) - y;
          // Anchor the rigid laptop, not the duck's changing head/hand silhouette.
          const darkColumns = new Uint32Array(width), darkRows = new Uint32Array(height);
          for (let yy = top + Math.floor((bottom - top) * .55); yy < bottom; yy++) {
            for (let xx = left; xx < right; xx++) {
              const pixel = (yy * source.width + xx) * 4;
              if (opaque(xx, yy) && pixels[pixel] < 90 && pixels[pixel + 1] < 100 && pixels[pixel + 2] < 110) {
                darkColumns[xx - x]++; darkRows[yy - y]++;
              }
            }
          }
          const laptopColumns = bands(darkColumns, 3), laptopRows = bands(darkRows, 3);
          const anchorX = laptopColumns.length ? x + laptopColumns[laptopColumns.length - 1][1] : right;
          const anchorY = laptopRows.length ? y + laptopRows[laptopRows.length - 1][1] : bottom;
          frames.push({ x, y, width, height, anchorX, anchorY });
        }
      }
      if (!frames.length) return;
      // One fixed scale and laptop position for the complete animation.
      const left = Math.max(...frames.map(f => f.anchorX - f.x));
      const right = Math.max(...frames.map(f => f.x + f.width - f.anchorX));
      const top = Math.max(...frames.map(f => f.anchorY - f.y));
      const bottom = Math.max(...frames.map(f => f.y + f.height - f.anchorY));
      const scale = Math.min(canvas.width * .86 / (left + right), canvas.height * .86 / (top + bottom));
      const anchorX = canvas.width / 2 + (left - right) * scale / 2;
      const anchorY = canvas.height / 2 + (top - bottom) * scale / 2;
      let start: number | null = null, previous = -1;
      const render = (time: number) => {
        if (disposed) return;
        if (start === null) start = time;
        const index = reducedMotion ? 0 : Math.floor((time - start) * 12 / 1000) % frames.length;
        if (index !== previous) {
          const frame = frames[index];
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
          context.drawImage(sheet, frame.x, frame.y, frame.width, frame.height,
            anchorX - (frame.anchorX - frame.x) * scale,
            anchorY - (frame.anchorY - frame.y) * scale, frame.width * scale, frame.height * scale);
          previous = index;
        }
        if (!reducedMotion) animation = requestAnimationFrame(render);
      };
      animation = requestAnimationFrame(render);
    };
    sheet.src = import.meta.env.BASE_URL + "typingduck.png";
    return () => { disposed = true; cancelAnimationFrame(animation); sheet.onload = null; };
  }, [reducedMotion]);
  return <canvas ref={canvasRef} width={600} height={720} aria-hidden="true"
    className="pointer-events-none mx-auto block aspect-[5/6] h-auto w-full" />;
}