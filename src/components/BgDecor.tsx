// Fixed-position decorative background — Y2K/K-pop aesthetic motifs.
// Pure SVG with a 1000×1000 viewBox (percentages mapped to 0-1000).
// aria-hidden + pointer-events-none — zero interaction with content.

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
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="30%"  stopColor="#ff00cc" stopOpacity="0.25" />
            <stop offset="60%"  stopColor="#00e5ff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#9933ff" stopOpacity="0.10" />
          </radialGradient>
          <radialGradient id="cd2" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="40%"  stopColor="#ff66cc" stopOpacity="0.20" />
            <stop offset="70%"  stopColor="#cc00ff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.08" />
          </radialGradient>
          <linearGradient id="spark1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#ff00cc" />
            <stop offset="100%" stopColor="#00e5ff" />
          </linearGradient>
          <linearGradient id="spark2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ff00cc" />
          </linearGradient>
          <linearGradient id="spark3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#cc00ff" />
          </linearGradient>
        </defs>

        {/* ── 4-point sparkles ─────────────────────────── */}
        <g opacity="0.22" style={{ animation: "sparkle-pulse 7s ease-in-out infinite" }}>
          <SparkleAt cx={60}  cy={80}  size={36} fill="url(#spark1)" />
        </g>
        <g opacity="0.18" style={{ animation: "sparkle-pulse 9s ease-in-out infinite 2s" }}>
          <SparkleAt cx={880} cy={50}  size={28} fill="url(#spark2)" />
        </g>
        <g opacity="0.19" style={{ animation: "sparkle-pulse 11s ease-in-out infinite 1s" }}>
          <SparkleAt cx={30}  cy={420} size={22} fill="url(#spark3)" />
        </g>
        <g opacity="0.17" style={{ animation: "sparkle-pulse 8s ease-in-out infinite 3s" }}>
          <SparkleAt cx={940} cy={380} size={32} fill="url(#spark1)" />
        </g>
        <g opacity="0.20" style={{ animation: "sparkle-pulse 10s ease-in-out infinite 0.5s" }}>
          <SparkleAt cx={70}  cy={720} size={20} fill="url(#spark2)" />
        </g>
        <g opacity="0.18" style={{ animation: "sparkle-pulse 13s ease-in-out infinite 4s" }}>
          <SparkleAt cx={920} cy={680} size={40} fill="url(#spark3)" />
        </g>
        <g opacity="0.15" style={{ animation: "sparkle-pulse 6s ease-in-out infinite 1.5s" }}>
          <SparkleAt cx={520} cy={20}  size={18} fill="url(#spark1)" />
        </g>
        <g opacity="0.17" style={{ animation: "sparkle-pulse 12s ease-in-out infinite 2.5s" }}>
          <SparkleAt cx={460} cy={880} size={26} fill="url(#spark2)" />
        </g>
        <g opacity="0.16" style={{ animation: "sparkle-pulse 8s ease-in-out infinite 0.8s" }}>
          <SparkleAt cx={310} cy={540} size={24} fill="url(#spark3)" />
        </g>

        {/* ── 6-point stars ────────────────────────────── */}
        <g opacity="0.16" style={{ animation: "float 9s ease-in-out infinite" }}>
          <StarAt cx={150} cy={180} size={30} stroke="#ff00cc" />
        </g>
        <g opacity="0.14" style={{ animation: "float 12s ease-in-out infinite 2s" }}>
          <StarAt cx={800} cy={220} size={22} stroke="#00e5ff" />
        </g>
        <g opacity="0.18" style={{ animation: "float 8s ease-in-out infinite 1s" }}>
          <StarAt cx={720} cy={580} size={36} stroke="#ff66cc" />
        </g>
        <g opacity="0.14" style={{ animation: "float 14s ease-in-out infinite 3s" }}>
          <StarAt cx={220} cy={600} size={18} stroke="#00e5ff" />
        </g>
        <g opacity="0.16" style={{ animation: "float 10s ease-in-out infinite 0.5s" }}>
          <StarAt cx={550} cy={780} size={28} stroke="#cc00ff" />
        </g>
        <g opacity="0.13" style={{ animation: "float 16s ease-in-out infinite 4s" }}>
          <StarAt cx={420} cy={310} size={16} stroke="#ff00cc" />
        </g>

        {/* ── CD disc rings ─────────────────────────────── */}
        <g opacity="0.16" style={{ animation: "slow-spin 180s linear infinite" }}>
          <CDAt cx={840} cy={-30} r={80} fill="url(#cd1)" />
        </g>
        <g opacity="0.13" style={{ animation: "slow-spin 240s linear infinite reverse" }}>
          <CDAt cx={-20} cy={560} r={65} fill="url(#cd2)" />
        </g>
        <g opacity="0.15" style={{ animation: "slow-spin 200s linear infinite 10s" }}>
          <CDAt cx={870} cy={800} r={55} fill="url(#cd1)" />
        </g>
        <g opacity="0.11" style={{ animation: "slow-spin 300s linear infinite 20s" }}>
          <CDAt cx={480} cy={460} r={40} fill="url(#cd2)" />
        </g>

        {/* ── Mini hearts ──────────────────────────────── */}
        <g opacity="0.20" style={{ animation: "float 7s ease-in-out infinite" }}>
          <HeartAt cx={300} cy={120} size={22} stroke="#ff00cc" />
        </g>
        <g opacity="0.16" style={{ animation: "float 11s ease-in-out infinite 2s" }}>
          <HeartAt cx={650} cy={140} size={18} stroke="#ff66cc" />
        </g>
        <g opacity="0.18" style={{ animation: "float 9s ease-in-out infinite 1s" }}>
          <HeartAt cx={100} cy={860} size={24} stroke="#cc00ff" />
        </g>
        <g opacity="0.16" style={{ animation: "float 13s ease-in-out infinite 3s" }}>
          <HeartAt cx={860} cy={480} size={20} stroke="#ff00cc" />
        </g>
        <g opacity="0.14" style={{ animation: "float 15s ease-in-out infinite 1.5s" }}>
          <HeartAt cx={750} cy={360} size={16} stroke="#ff66cc" />
        </g>

        {/* ── Butterflies ───────────────────────────────── */}
        <g opacity="0.16" style={{ animation: "float 15s ease-in-out infinite" }}>
          <ButterflyAt cx={400} cy={40}  w={56} h={36} stroke="#00e5ff" />
        </g>
        <g opacity="0.12" style={{ animation: "float 18s ease-in-out infinite 5s" }}>
          <ButterflyAt cx={600} cy={820} w={44} h={28} stroke="#cc00ff" />
        </g>
        <g opacity="0.13" style={{ animation: "float 20s ease-in-out infinite 8s" }}>
          <ButterflyAt cx={180} cy={340} w={36} h={24} stroke="#ff00cc" />
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
      <circle cx={cx} cy={cy} r={r}          fill={fill} stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={r * 0.75}   fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={r * 0.5}    fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={r * 0.28}   fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={r * 0.12}   fill="rgba(11,7,16,0.85)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
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

// Deterministic scatter — no Math.random in server components
const DOTS = [
  { x: 180, y:  80, r: 2.5, c: "#ff00cc", o: 0.22, dur: 5,  delay: 0   },
  { x: 350, y:  50, r: 2,   c: "#00e5ff", o: 0.18, dur: 7,  delay: 1   },
  { x: 620, y:  70, r: 2.5, c: "#ffffff", o: 0.20, dur: 6,  delay: 2   },
  { x: 760, y: 120, r: 2,   c: "#ff66cc", o: 0.17, dur: 9,  delay: 0.5 },
  { x:  50, y: 280, r: 2.5, c: "#00e5ff", o: 0.19, dur: 8,  delay: 3   },
  { x: 960, y: 250, r: 2,   c: "#cc00ff", o: 0.16, dur: 6,  delay: 1.5 },
  { x: 250, y: 350, r: 2.5, c: "#ffffff", o: 0.18, dur: 10, delay: 0   },
  { x: 850, y: 420, r: 2.5, c: "#ff00cc", o: 0.19, dur: 7,  delay: 2.5 },
  { x: 490, y: 490, r: 2,   c: "#00e5ff", o: 0.15, dur: 11, delay: 1   },
  { x: 120, y: 550, r: 2.5, c: "#ff66cc", o: 0.17, dur: 8,  delay: 0.5 },
  { x: 700, y: 620, r: 2.5, c: "#cc00ff", o: 0.18, dur: 9,  delay: 3.5 },
  { x: 910, y: 580, r: 2,   c: "#ffffff", o: 0.16, dur: 6,  delay: 2   },
  { x: 400, y: 680, r: 2.5, c: "#ff00cc", o: 0.20, dur: 12, delay: 0   },
  { x: 200, y: 750, r: 2,   c: "#00e5ff", o: 0.17, dur: 7,  delay: 1   },
  { x: 580, y: 720, r: 2.5, c: "#ff66cc", o: 0.20, dur: 8,  delay: 4   },
  { x: 820, y: 800, r: 2.5, c: "#ffffff", o: 0.16, dur: 10, delay: 0.5 },
  { x: 300, y: 900, r: 2,   c: "#ff00cc", o: 0.18, dur: 6,  delay: 2   },
  { x: 660, y: 920, r: 2.5, c: "#00e5ff", o: 0.19, dur: 9,  delay: 1.5 },
  { x:  80, y: 950, r: 2,   c: "#cc00ff", o: 0.17, dur: 7,  delay: 3   },
  { x: 930, y: 940, r: 2.5, c: "#ff00cc", o: 0.18, dur: 11, delay: 0   },
  { x: 680, y: 190, r: 2,   c: "#ff66cc", o: 0.16, dur: 8,  delay: 2.5 },
  { x: 830, y: 650, r: 2.5, c: "#00e5ff", o: 0.17, dur: 9,  delay: 0.5 },
  { x: 140, y: 440, r: 2,   c: "#ff66cc", o: 0.18, dur: 7,  delay: 3.5 },
  { x: 560, y: 160, r: 2.5, c: "#cc00ff", o: 0.19, dur: 10, delay: 1   },
] as const;
