// Fixed-position decorative background — Y2K silvercore motifs.
// Pure SVG with a 1000×1000 viewBox (percentages mapped to 0-1000).
// aria-hidden + pointer-events-none — zero interaction with content.
// Silver/chrome dominant, with a restrained beat of red (cherries, kiss),
// a cool note of blue (puffy star, butterfly) and graphic black (8-ball, bow).

export default function BgDecor() {
  return (
    <div
      aria-hidden="true"
      className="bg-decor fixed inset-0 z-0 overflow-hidden pointer-events-none select-none"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <radialGradient id="cd1" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="45%"  stopColor="#c8ccd2" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7c8088" stopOpacity="0.28" />
          </radialGradient>
          <radialGradient id="cd2" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="50%"  stopColor="#aeb3bb" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#56789f" stopOpacity="0.16" />
          </radialGradient>
          <linearGradient id="spark1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#cfd2d7" />
            <stop offset="55%"  stopColor="#ffffff" />
            <stop offset="100%" stopColor="#7c8088" />
          </linearGradient>
          <linearGradient id="spark2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#ffffff" />
            <stop offset="100%" stopColor="#9aa0aa" />
          </linearGradient>
          <linearGradient id="spark3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#aeb3bb" />
            <stop offset="100%" stopColor="#56789f" />
          </linearGradient>
          <linearGradient id="cherry" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#e0584f" />
            <stop offset="55%"  stopColor="#f2a8a2" />
            <stop offset="100%" stopColor="#b4302b" />
          </linearGradient>
          <linearGradient id="blk" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#3a3d44" />
            <stop offset="45%"  stopColor="#9aa0aa" />
            <stop offset="100%" stopColor="#14151a" />
          </linearGradient>
        </defs>

        {/* ── 4-point chrome sparkles ───────────────────── */}
        <g opacity="0.42" style={{ animation: "sparkle-pulse 7s ease-in-out infinite" }}>
          <SparkleAt cx={60}  cy={80}  size={36} fill="url(#spark1)" />
        </g>
        <g opacity="0.34" style={{ animation: "sparkle-pulse 9s ease-in-out infinite 2s" }}>
          <SparkleAt cx={880} cy={50}  size={28} fill="url(#spark2)" />
        </g>
        <g opacity="0.55" style={{ animation: "sparkle-pulse 11s ease-in-out infinite 1s" }}>
          <SparkleAt cx={30}  cy={420} size={22} fill="url(#spark3)" />
        </g>
        <g opacity="0.40" style={{ animation: "sparkle-pulse 8s ease-in-out infinite 3s" }}>
          <SparkleAt cx={940} cy={380} size={32} fill="url(#spark1)" />
        </g>
        <g opacity="0.36" style={{ animation: "sparkle-pulse 10s ease-in-out infinite 0.5s" }}>
          <SparkleAt cx={70}  cy={720} size={20} fill="url(#spark2)" />
        </g>
        <g opacity="0.34" style={{ animation: "sparkle-pulse 13s ease-in-out infinite 4s" }}>
          <SparkleAt cx={920} cy={680} size={40} fill="url(#spark1)" />
        </g>
        <g opacity="0.30" style={{ animation: "sparkle-pulse 6s ease-in-out infinite 1.5s" }}>
          <SparkleAt cx={520} cy={20}  size={18} fill="url(#spark2)" />
        </g>
        {/* one blue puffy star */}
        <g opacity="0.6" style={{ animation: "sparkle-pulse 12s ease-in-out infinite 2.5s" }}>
          <SparkleAt cx={460} cy={880} size={28} fill="url(#spark3)" />
        </g>
        <g opacity="0.34" style={{ animation: "sparkle-pulse 8s ease-in-out infinite 0.8s" }}>
          <SparkleAt cx={310} cy={540} size={24} fill="url(#spark1)" />
        </g>

        {/* ── 6-point star outlines (steel, one blue) ───── */}
        <g opacity="0.42" style={{ animation: "float 9s ease-in-out infinite" }}>
          <StarAt cx={150} cy={180} size={30} stroke="#7c8088" />
        </g>
        <g opacity="0.4" style={{ animation: "float 12s ease-in-out infinite 2s" }}>
          <StarAt cx={800} cy={220} size={22} stroke="#56789f" />
        </g>
        <g opacity="0.4" style={{ animation: "float 8s ease-in-out infinite 1s" }}>
          <StarAt cx={720} cy={580} size={36} stroke="#7c8088" />
        </g>
        <g opacity="0.36" style={{ animation: "float 14s ease-in-out infinite 3s" }}>
          <StarAt cx={220} cy={600} size={18} stroke="#56789f" />
        </g>
        <g opacity="0.4" style={{ animation: "float 10s ease-in-out infinite 0.5s" }}>
          <StarAt cx={550} cy={780} size={28} stroke="#7c8088" />
        </g>
        <g opacity="0.34" style={{ animation: "float 16s ease-in-out infinite 4s" }}>
          <StarAt cx={420} cy={310} size={16} stroke="#7c8088" />
        </g>

        {/* ── CD / disco discs ──────────────────────────── */}
        <g opacity="0.5" style={{ animation: "slow-spin 180s linear infinite" }}>
          <CDAt cx={840} cy={-30} r={80} fill="url(#cd1)" />
        </g>
        <g opacity="0.42" style={{ animation: "slow-spin 240s linear infinite reverse" }}>
          <CDAt cx={-20} cy={560} r={65} fill="url(#cd2)" />
        </g>
        <g opacity="0.46" style={{ animation: "slow-spin 200s linear infinite 10s" }}>
          <CDAt cx={870} cy={800} r={55} fill="url(#cd1)" />
        </g>
        <g opacity="0.36" style={{ animation: "slow-spin 300s linear infinite 20s" }}>
          <CDAt cx={480} cy={460} r={40} fill="url(#cd2)" />
        </g>

        {/* ── Mini hearts (silver) ──────────────────────── */}
        <g opacity="0.4" style={{ animation: "float 7s ease-in-out infinite" }}>
          <HeartAt cx={300} cy={120} size={22} stroke="#7c8088" />
        </g>
        <g opacity="0.34" style={{ animation: "float 11s ease-in-out infinite 2s" }}>
          <HeartAt cx={650} cy={140} size={18} stroke="#aeb3bb" />
        </g>
        <g opacity="0.36" style={{ animation: "float 9s ease-in-out infinite 1s" }}>
          <HeartAt cx={100} cy={860} size={24} stroke="#7c8088" />
        </g>
        <g opacity="0.34" style={{ animation: "float 13s ease-in-out infinite 3s" }}>
          <HeartAt cx={860} cy={480} size={20} stroke="#aeb3bb" />
        </g>

        {/* ── Butterflies (steel, one blue) ─────────────── */}
        <g opacity="0.34" style={{ animation: "float 15s ease-in-out infinite" }}>
          <ButterflyAt cx={400} cy={40}  w={56} h={36} stroke="#56789f" />
        </g>
        <g opacity="0.3" style={{ animation: "float 18s ease-in-out infinite 5s" }}>
          <ButterflyAt cx={600} cy={820} w={44} h={28} stroke="#7c8088" />
        </g>
        <g opacity="0.3" style={{ animation: "float 20s ease-in-out infinite 8s" }}>
          <ButterflyAt cx={180} cy={340} w={36} h={24} stroke="#7c8088" />
        </g>

        {/* ── Accent motifs — restrained ────────────────── */}
        <g opacity="0.85" style={{ animation: "float 10s ease-in-out infinite 0.5s" }}>
          <CherriesAt cx={210} cy={300} s={34} />
        </g>
        <g opacity="0.8" style={{ animation: "float 12s ease-in-out infinite 3s" }}>
          <KissAt cx={830} cy={160} w={40} />
        </g>
        <g opacity="0.78" style={{ animation: "float 9s ease-in-out infinite 1.5s" }}>
          <EightBallAt cx={120} cy={650} r={22} />
        </g>
        <g opacity="0.7" style={{ animation: "float 14s ease-in-out infinite 6s" }}>
          <BowAt cx={690} cy={760} w={46} />
        </g>

        {/* ── Glitter dots ──────────────────────────────── */}
        {DOTS.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.r}
            fill={d.c}
            opacity={d.o}
            style={{ animation: `sparkle-pulse ${d.dur}s ease-in-out infinite ${d.delay}s` }}
          />
        ))}
      </svg>
    </div>
  );
}

// ── Shape helpers (all use absolute coordinates in 0-1000 space) ──────────

function SparkleAt({ cx, cy, size, fill }: { cx: number; cy: number; size: number; fill: string }) {
  const h = size / 2;
  const q = size / 6;
  const x = cx - h;
  const y = cy - h;
  return (
    <path
      transform={`translate(${x},${y})`}
      d={`M${h},0 Q${h + q},${h - q} ${size},${h} Q${h + q},${h + q} ${h},${size} Q${h - q},${h + q} 0,${h} Q${h - q},${h - q} ${h},0Z`}
      fill={fill}
    />
  );
}

function StarAt({ cx, cy, size, stroke }: { cx: number; cy: number; size: number; stroke: string }) {
  const outer = size / 2;
  const inner = size / 4;
  const pts = Array.from({ length: 12 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 6) * i - Math.PI / 2;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");
  return <polygon points={pts} fill="none" stroke={stroke} strokeWidth="1.5" />;
}

function CDAt({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r}          fill={fill} stroke="rgba(124,128,136,0.22)" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={r * 0.75}   fill="none" stroke="rgba(124,128,136,0.18)" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={r * 0.5}    fill="none" stroke="rgba(124,128,136,0.2)" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={r * 0.28}   fill="none" stroke="rgba(124,128,136,0.16)" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={r * 0.12}   fill="rgba(20,21,26,0.7)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
    </g>
  );
}

function HeartAt({ cx, cy, size, stroke }: { cx: number; cy: number; size: number; stroke: string }) {
  const s = size;
  const x = cx - s / 2;
  const y = cy - s / 2;
  return (
    <path
      transform={`translate(${x},${y})`}
      d={`M${s/2},${s*0.85} C${s*0.05},${s*0.5} -${s*0.08},${s*0.15} ${s/2},${s*0.32} C${s*1.08},${s*0.15} ${s*0.95},${s*0.5} ${s/2},${s*0.85}Z`}
      fill="none"
      stroke={stroke}
      strokeWidth="1.5"
    />
  );
}

function ButterflyAt({ cx, cy, w, h, stroke }: { cx: number; cy: number; w: number; h: number; stroke: string }) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  return (
    <path
      transform={`translate(${x},${y})`}
      d={`M${w/2},${h/2}
        C${w*0.2},${h*0.05} 0,${h*0.35} ${w*0.1},${h*0.72}
        C${w*0.2},${h} ${w*0.44},${h*0.82} ${w/2},${h/2}
        C${w*0.56},${h*0.82} ${w*0.8},${h} ${w*0.9},${h*0.72}
        C${w},${h*0.35} ${w*0.8},${h*0.05} ${w/2},${h/2}Z`}
      fill="none"
      stroke={stroke}
      strokeWidth="1"
    />
  );
}

function CherriesAt({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const r = s * 0.18;
  return (
    <g transform={`translate(${cx - s / 2},${cy - s / 2})`}>
      <path d={`M${s*0.33},${s*0.62} C${s*0.4},${s*0.2} ${s*0.62},${s*0.12} ${s*0.82},${s*0.16}`} fill="none" stroke="#5f6a4f" strokeWidth="2" />
      <path d={`M${s*0.68},${s*0.5} C${s*0.7},${s*0.25} ${s*0.76},${s*0.18} ${s*0.82},${s*0.16}`} fill="none" stroke="#5f6a4f" strokeWidth="2" />
      <circle cx={s*0.33} cy={s*0.74} r={r} fill="url(#cherry)" />
      <circle cx={s*0.68} cy={s*0.66} r={r} fill="url(#cherry)" />
    </g>
  );
}

function KissAt({ cx, cy, w }: { cx: number; cy: number; w: number }) {
  const u = w / 24;
  return (
    <g transform={`translate(${cx - w / 2},${cy - (w * 0.75) / 2}) scale(${u})`}>
      <path
        d="M2,7 C5,4.4 8.6,5 12,7.4 C15.4,5 19,4.4 22,7 C19,13.2 15,15.6 12,15.6 C9,15.6 5,13.2 2,7 Z"
        fill="url(#cherry)"
      />
    </g>
  );
}

function EightBallAt({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="url(#blk)" />
      <circle cx={cx} cy={cy - r * 0.18} r={r * 0.42} fill="#fff" />
      <text x={cx} y={cy - r * 0.02} textAnchor="middle" fontSize={r * 0.5} fontFamily="monospace" fill="#14151a">8</text>
    </g>
  );
}

function BowAt({ cx, cy, w }: { cx: number; cy: number; w: number }) {
  const h = w * 0.6;
  return (
    <g transform={`translate(${cx - w / 2},${cy - h / 2})`}>
      <path d={`M${w/2},${h/2} L0,${h*0.16} L0,${h*0.84} Z`} fill="url(#blk)" />
      <path d={`M${w/2},${h/2} L${w},${h*0.16} L${w},${h*0.84} Z`} fill="url(#blk)" />
      <circle cx={w/2} cy={h/2} r={w*0.1} fill="#14151a" />
    </g>
  );
}

// Deterministic scatter — no Math.random in server components.
// Silver/steel dominant, with a few accent dots (cherry red, steel blue, black).
const DOTS = [
  { x: 180, y:  80, r: 2.5, c: "#7c8088", o: 0.4,  dur: 5,  delay: 0   },
  { x: 350, y:  50, r: 2,   c: "#56789f", o: 0.4,  dur: 7,  delay: 1   },
  { x: 620, y:  70, r: 2.5, c: "#aeb3bb", o: 0.45, dur: 6,  delay: 2   },
  { x: 760, y: 120, r: 2,   c: "#b4302b", o: 0.55, dur: 9,  delay: 0.5 },
  { x:  50, y: 280, r: 2.5, c: "#7c8088", o: 0.4,  dur: 8,  delay: 3   },
  { x: 960, y: 250, r: 2,   c: "#56789f", o: 0.42, dur: 6,  delay: 1.5 },
  { x: 250, y: 350, r: 2.5, c: "#9aa0aa", o: 0.4,  dur: 10, delay: 0   },
  { x: 850, y: 420, r: 2.5, c: "#7c8088", o: 0.42, dur: 7,  delay: 2.5 },
  { x: 490, y: 490, r: 2,   c: "#56789f", o: 0.38, dur: 11, delay: 1   },
  { x: 120, y: 550, r: 2.5, c: "#14151a", o: 0.4,  dur: 8,  delay: 0.5 },
  { x: 700, y: 620, r: 2.5, c: "#7c8088", o: 0.4,  dur: 9,  delay: 3.5 },
  { x: 910, y: 580, r: 2,   c: "#aeb3bb", o: 0.4,  dur: 6,  delay: 2   },
  { x: 400, y: 680, r: 2.5, c: "#b4302b", o: 0.5,  dur: 12, delay: 0   },
  { x: 200, y: 750, r: 2,   c: "#56789f", o: 0.4,  dur: 7,  delay: 1   },
  { x: 580, y: 720, r: 2.5, c: "#7c8088", o: 0.42, dur: 8,  delay: 4   },
  { x: 820, y: 800, r: 2.5, c: "#9aa0aa", o: 0.4,  dur: 10, delay: 0.5 },
  { x: 300, y: 900, r: 2,   c: "#7c8088", o: 0.42, dur: 6,  delay: 2   },
  { x: 660, y: 920, r: 2.5, c: "#56789f", o: 0.4,  dur: 9,  delay: 1.5 },
  { x:  80, y: 950, r: 2,   c: "#14151a", o: 0.38, dur: 7,  delay: 3   },
  { x: 930, y: 940, r: 2.5, c: "#7c8088", o: 0.42, dur: 11, delay: 0   },
  { x: 680, y: 190, r: 2,   c: "#aeb3bb", o: 0.4,  dur: 8,  delay: 2.5 },
  { x: 830, y: 650, r: 2.5, c: "#56789f", o: 0.4,  dur: 9,  delay: 0.5 },
  { x: 140, y: 440, r: 2,   c: "#7c8088", o: 0.4,  dur: 7,  delay: 3.5 },
  { x: 560, y: 160, r: 2.5, c: "#7c8088", o: 0.42, dur: 10, delay: 1   },
] as const;
