// Y2K Silvercore layer — floating chrome ✦ sparkles that sit on top of the
// pink/cyan BgDecor world. Pure SVG + CSS (server component, no hooks).
// Positions are a DETERMINISTIC precomputed list (never Math.random at render)
// to avoid SSR/client hydration mismatch — same pattern as BgDecor's DOTS.

type Density = "low" | "medium" | "high";
type Zone = "background" | "foreground";

type Star = { x: number; y: number; size: number; opacity: number; delay: number; dur: number };

// 24 deterministic stars; density slices the first N (low 8 / medium 16 / high 24).
// x/y are viewport percentages; size is px.
const STARS: Star[] = [
  { x: 6,  y: 12, size: 22, opacity: 0.5,  delay: 0.0, dur: 9 },
  { x: 88, y: 8,  size: 14, opacity: 0.35, delay: 1.4, dur: 11 },
  { x: 18, y: 72, size: 28, opacity: 0.45, delay: 0.8, dur: 10 },
  { x: 73, y: 84, size: 12, opacity: 0.3,  delay: 2.1, dur: 12 },
  { x: 47, y: 28, size: 16, opacity: 0.4,  delay: 0.5, dur: 8 },
  { x: 94, y: 56, size: 20, opacity: 0.5,  delay: 1.8, dur: 13 },
  { x: 32, y: 44, size: 10, opacity: 0.25, delay: 3.0, dur: 10 },
  { x: 60, y: 64, size: 26, opacity: 0.55, delay: 0.3, dur: 11 },
  { x: 9,  y: 40, size: 13, opacity: 0.3,  delay: 2.6, dur: 9 },
  { x: 80, y: 32, size: 18, opacity: 0.45, delay: 1.1, dur: 12 },
  { x: 40, y: 90, size: 15, opacity: 0.35, delay: 0.7, dur: 10 },
  { x: 66, y: 14, size: 24, opacity: 0.5,  delay: 2.3, dur: 13 },
  { x: 24, y: 22, size: 11, opacity: 0.25, delay: 1.6, dur: 8 },
  { x: 54, y: 50, size: 19, opacity: 0.4,  delay: 0.2, dur: 11 },
  { x: 13, y: 88, size: 16, opacity: 0.35, delay: 2.9, dur: 12 },
  { x: 91, y: 78, size: 30, opacity: 0.45, delay: 0.9, dur: 14 },
  { x: 36, y: 6,  size: 12, opacity: 0.3,  delay: 1.3, dur: 9 },
  { x: 70, y: 40, size: 9,  opacity: 0.2,  delay: 2.4, dur: 10 },
  { x: 50, y: 76, size: 21, opacity: 0.5,  delay: 0.6, dur: 12 },
  { x: 4,  y: 60, size: 14, opacity: 0.35, delay: 1.9, dur: 11 },
  { x: 84, y: 22, size: 17, opacity: 0.4,  delay: 3.1, dur: 13 },
  { x: 28, y: 56, size: 23, opacity: 0.45, delay: 0.4, dur: 10 },
  { x: 62, y: 92, size: 10, opacity: 0.25, delay: 2.0, dur: 9 },
  { x: 96, y: 44, size: 15, opacity: 0.35, delay: 1.2, dur: 12 },
];

const COUNT: Record<Density, number> = { low: 8, medium: 16, high: 24 };

// concave 4-point sparkle in a 24×24 box centred at (12,12)
const STAR_PATH =
  "M12,0 C13.4,9.2 14.8,10.6 24,12 C14.8,13.4 13.4,14.8 12,24 C10.6,14.8 9.2,13.4 0,12 C9.2,10.6 10.6,9.2 12,0 Z";

export default function ChromeSparkle({
  density = "low",
  zone = "background",
}: {
  density?: Density;
  zone?: Zone;
}) {
  const stars = STARS.slice(0, COUNT[density]);
  const wrap =
    zone === "background"
      ? "fixed inset-0 z-0 overflow-hidden pointer-events-none select-none"
      : "absolute inset-0 z-0 overflow-hidden pointer-events-none select-none";

  return (
    <div aria-hidden="true" className={wrap}>
      {/* shared silver gradient (referenced document-wide by url(#chromeStar)) */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="chromeStar" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#888888" />
            <stop offset="40%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#aaaaaa" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>
      </svg>
      {stars.map((s, i) => (
        <svg
          key={i}
          className="chrome-sparkle-star absolute"
          viewBox="0 0 24 24"
          width={s.size}
          height={s.size}
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        >
          <path d={STAR_PATH} fill="url(#chromeStar)" />
        </svg>
      ))}
    </div>
  );
}
