"use client";

// Generalised version of the 追星證 card frame: the same code-drawn silver metal
// band (identical gradient stops, accent sheen, bevel and rivets), but it measures
// its own box so the rounded corners stay perfectly circular and the band stays a
// uniform width at ANY aspect ratio — the four-cut strip, a small idol card, etc.
// Pass rivets={false} for a clean band on small cards.
import { useLayoutEffect, useRef, useState } from "react";

function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M${x + rad} ${y} L${x + w - rad} ${y} A${rad} ${rad} 0 0 1 ${x + w} ${y + rad}`
    + ` L${x + w} ${y + h - rad} A${rad} ${rad} 0 0 1 ${x + w - rad} ${y + h}`
    + ` L${x + rad} ${y + h} A${rad} ${rad} 0 0 1 ${x} ${y + h - rad}`
    + ` L${x} ${y + rad} A${rad} ${rad} 0 0 1 ${x + rad} ${y} Z`;
}

export default function MetalFrame({
  accent,
  band = 11,
  radius = 26,
  rivets = true,
}: {
  accent: string;
  band?: number;
  radius?: number;
  rivets?: boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.clientWidth);
      const h = Math.round(el.clientHeight);
      if (w > 0 && h > 0) setDims((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const key = `${accent.replace(/[^a-zA-Z0-9]/g, "") || "d"}-${band}-${rivets ? "r" : "n"}`;
  const metalId = `mf-metal-${key}`;
  const tintId = `mf-tint-${key}`;
  const rivetId = `mf-rivet-${key}`;

  const base = (
    <>
      <defs>
        <linearGradient id={metalId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="16%" stopColor="#f2f4f7" />
          <stop offset="34%" stopColor="#c8ccd2" />
          <stop offset="50%" stopColor="#9aa0aa" />
          <stop offset="66%" stopColor="#c8ccd2" />
          <stop offset="84%" stopColor="#eef0f3" />
          <stop offset="100%" stopColor="#aeb3bb" />
        </linearGradient>
        <linearGradient id={tintId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
          <stop offset="22%" stopColor={accent} stopOpacity="0.12" />
          <stop offset="45%" stopColor={accent} stopOpacity="0.5" />
          <stop offset="62%" stopColor={accent} stopOpacity="0.14" />
          <stop offset="84%" stopColor={accent} stopOpacity="0.45" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id={rivetId} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="42%" stopColor="#d3d7dd" />
          <stop offset="100%" stopColor="#7c8088" />
        </radialGradient>
      </defs>
      {dims && (() => {
        const { w, h } = dims;
        const outer = roundedRect(0, 0, w, h, radius);
        const inner = roundedRect(band, band, w - 2 * band, h - 2 * band, Math.max(3, radius - band * 0.6));
        const cInset = Math.max(band * 0.9, radius * 0.46);
        const rr = Math.max(1.6, band * 0.29);
        const rivetPts: [number, number][] = rivets
          ? [
              [cInset, cInset], [w - cInset, cInset], [cInset, h - cInset], [w - cInset, h - cInset],
              [band / 2, h / 2], [w - band / 2, h / 2], [w / 2, h - band / 2],
            ]
          : [];
        return (
          <>
            <path d={`${outer} ${inner}`} fillRule="evenodd" fill={`url(#${metalId})`} />
            <path d={`${outer} ${inner}`} fillRule="evenodd" fill={`url(#${tintId})`} />
            <path d={outer} fill="none" stroke="#5f636b" strokeOpacity="0.8" strokeWidth="1.4" />
            <path d={outer} fill="none" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="0.8" transform="translate(0 1)" />
            <path d={inner} fill="none" stroke="#3a3d43" strokeOpacity="0.5" strokeWidth="1.4" />
            <path d={inner} fill="none" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="0.8" transform="translate(0 -1)" />
            {rivetPts.map(([cx, cy]) => (
              <g key={`${cx}-${cy}`}>
                <circle cx={cx} cy={cy} r={rr} fill={`url(#${rivetId})`} />
                <circle cx={cx} cy={cy} r={rr} fill="none" stroke="#5f636b" strokeOpacity="0.75" strokeWidth="0.7" />
                <circle cx={cx - rr * 0.28} cy={cy - rr * 0.28} r={rr * 0.25} fill="#ffffff" fillOpacity="0.85" />
              </g>
            ))}
          </>
        );
      })()}
    </>
  );

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      data-metal-frame="true"
      viewBox={dims ? `0 0 ${dims.w} ${dims.h}` : undefined}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
    >
      {base}
    </svg>
  );
}
