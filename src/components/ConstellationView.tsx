"use client";

// 星圖 — a force-directed star-map of the user's taste, styled as a silver
// nebula galaxy. The 4 picks are bright anchor-stars (hubs, irregularly placed);
// their most-similar idols orbit them; non-picks also link to each other by
// 4-layer similarity, so it reads as a constellation web rather than 4 spokes.
// Lines are coloured by the dominant similarity layer. Graph data is computed
// server-side (/api/constellation); the catalog never reaches the client.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY,
  type Simulation, type SimulationNodeDatum, type SimulationLinkDatum,
} from "d3-force";
import type { Constellation, ConstellationNode, ScoreLayer } from "@/lib/types";
import { SCORE_LAYERS } from "@/lib/types";
import { layerLabel } from "@/lib/archetypes";
import Thumb from "@/components/Thumb";
import { useCopy, useLocale } from "@/lib/i18n/LocaleProvider";

type SimNode = ConstellationNode & SimulationNodeDatum & { r: number; degree: number };
type SimLink = SimulationLinkDatum<SimNode> & { weight: number; layer: ScoreLayer };

// Layer colours tuned to read on the silver-graphite sky.
const EDGE_COLOR: Record<ScoreLayer, string> = {
  aesthetic: "#e7eaef", personality: "#ef6f68", performance: "#86b6f0", content: "#b8bec9",
};

const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

// Deterministic starfield (client-only; never Math.random at render).
const SKY_STARS = (() => {
  let s = 99;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  return Array.from({ length: 80 }, () => ({
    x: +(rnd() * 100).toFixed(2),
    y: +(rnd() * 100).toFixed(2),
    size: +(0.6 + rnd() * 1.9).toFixed(2),
    op: +(0.18 + rnd() * 0.6).toFixed(2),
    bright: rnd() > 0.85,
  }));
})();

// Silver nebula clouds + the galaxy base.
const GALAXY_BG = [
  "radial-gradient(ellipse 60% 52% at 32% 28%, rgba(206,210,218,0.20), transparent 62%)",
  "radial-gradient(ellipse 55% 60% at 72% 74%, rgba(176,182,194,0.16), transparent 60%)",
  "linear-gradient(122deg, transparent 34%, rgba(212,216,224,0.08) 50%, transparent 66%)",
  "radial-gradient(ellipse at 50% 42%, #5a5f68 0%, #3d4047 54%, #25272c 100%)",
].join(",");

export default function ConstellationView() {
  const copy = useCopy();
  const locale = useLocale();
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);

  const [picksLen, setPicksLen] = useState<number | null>(null);
  const [graph, setGraph] = useState<Constellation | null>(null);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [, setTick] = useState(0);
  const [hover, setHover] = useState<string | null>(null);

  // ── Load picks → fetch graph ──────────────────────────────────────────
  useEffect(() => {
    let pickIds: string[] = [];
    try {
      const raw = localStorage.getItem("kstar:prefs");
      if (raw) {
        const p = JSON.parse(raw) as { topIdols?: string[] };
        if (Array.isArray(p.topIdols)) pickIds = p.topIdols;
      }
    } catch { /* ignore */ }
    setPicksLen(pickIds.length);
    if (pickIds.length !== 4) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch("/api/constellation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pickIds }),
        });
        setGraph((await res.json()) as Constellation);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  // ── Measure container (retry until laid out) ──────────────────────────
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let raf = 0;
    let tries = 0;
    const apply = (w: number) => {
      const h = Math.round(Math.max(420, Math.min(580, w * 0.82)));
      setSize((prev) => (Math.abs(prev.w - w) > 8 || prev.h !== h ? { w, h } : prev));
    };
    const measure = () => {
      const w = el.clientWidth;
      if (w >= 120) apply(w);
      else if (tries++ < 60) raf = requestAnimationFrame(measure);
    };
    measure();
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0]?.contentRect.width ?? 0);
      if (w >= 120) apply(w);
    });
    ro.observe(el);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [graph]);

  // ── Simulation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!graph || !graph.nodes.length || !size.w) return;
    const { w, h } = size;
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * 0.27;
    const mobile = w < 480;
    const anchorR = mobile ? 24 : 32;
    const satR = mobile ? 14 : 19;
    const maxSat = mobile ? 12 : 21;
    const PAD = mobile ? 18 : 30;
    const clampX = (x: number, r: number) => Math.max(r + PAD, Math.min(w - r - PAD, x));
    const clampY = (y: number, r: number) => Math.max(r + PAD, Math.min(h - r - PAD, y));

    // Trim satellites on small screens (graph is already ranked best-first).
    const anchorsRaw = graph.nodes.filter((n) => n.anchor);
    const satsRaw = graph.nodes.filter((n) => !n.anchor).slice(0, maxSat);
    const baseNodes = [...anchorsRaw, ...satsRaw];
    const keptIds = new Set(baseNodes.map((n) => n.id));
    const anchorSet = new Set(anchorsRaw.map((n) => n.id));

    // bridge weighting = how many ANCHORS a node links to (not total degree).
    const anchorDeg: Record<string, number> = {};
    for (const e of graph.edges) {
      if (!keptIds.has(e.source) || !keptIds.has(e.target)) continue;
      if (anchorSet.has(e.target)) anchorDeg[e.source] = (anchorDeg[e.source] ?? 0) + 1;
      if (anchorSet.has(e.source)) anchorDeg[e.target] = (anchorDeg[e.target] ?? 0) + 1;
    }

    const nodes: SimNode[] = baseNodes.map((n) => ({
      ...n, r: n.anchor ? anchorR : satR, degree: anchorDeg[n.id] ?? 0,
    }));
    const byId = new Map(nodes.map((n) => [n.id, n]));

    // Anchors pinned, but jittered off a perfect ring so it looks natural.
    const anchorNodes = nodes.filter((n) => n.anchor);
    anchorNodes.forEach((node, i) => {
      const jA = ((hash(node.id) % 1000) / 1000 - 0.5) * 0.8;       // ±0.4 rad
      const jR = 0.82 + (hash(node.id + "r") % 1000) / 1000 * 0.34; // 0.82..1.16
      const ang = (i / anchorNodes.length) * 2 * Math.PI - Math.PI / 2 + jA;
      node.fx = clampX(cx + Math.cos(ang) * R * jR, node.r);
      node.fy = clampY(cy + Math.sin(ang) * R * jR, node.r);
    });
    nodes.filter((n) => !n.anchor).forEach((n, i) => {
      n.x = cx + Math.cos(i * 1.3 + hash(n.id) % 7) * (R * 0.55);
      n.y = cy + Math.sin(i * 1.3 + hash(n.id) % 5) * (R * 0.55);
    });

    const links: SimLink[] = graph.edges
      .filter((e) => byId.has(e.source) && byId.has(e.target))
      .map((e) => ({ source: e.source, target: e.target, weight: e.weight, layer: e.layer }));

    const sim = forceSimulation<SimNode>(nodes)
      .force("link", forceLink<SimNode, SimLink>(links).id((d) => d.id)
        .distance((d) => 48 + (1 - d.weight) * 130).strength((d) => 0.12 + d.weight * 0.45))
      .force("charge", forceManyBody<SimNode>().strength(mobile ? -150 : -220))
      .force("collide", forceCollide<SimNode>((d) => d.r + 8))
      .force("x", forceX<SimNode>(cx).strength((d) => (d.anchor ? 0 : d.degree >= 2 ? 0.08 : 0.025)))
      .force("y", forceY<SimNode>(cy).strength((d) => (d.anchor ? 0 : d.degree >= 2 ? 0.08 : 0.025)));

    sim.on("tick", () => {
      for (const n of nodes) {
        if (n.anchor) continue;
        n.x = clampX(n.x ?? cx, n.r);
        n.y = clampY(n.y ?? cy, n.r);
      }
      setTick((t) => t + 1);
    });

    simRef.current = sim;
    nodesRef.current = nodes;
    linksRef.current = links;
    return () => { sim.stop(); };
  }, [graph, size.w, size.h]);

  // ── States ────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="flex h-72 items-center justify-center text-sm text-[#9aa0aa]">{copy.constelLoading}</div>;
  }
  if (picksLen !== 4 || !graph || !graph.nodes.length) {
    return (
      <div className="flex h-60 flex-col items-center justify-center gap-3 rounded-2xl border border-[#c8ccd2]/30 bg-[#7c8088]/5 text-center">
        <p className="text-sm text-[#5e636d]">{copy.constelNeedPicks}</p>
        <button
          onClick={() => window.dispatchEvent(new Event("kstar:open-onboarding"))}
          className="rounded-full bg-[#b4302b] px-4 py-1.5 text-xs font-bold text-white hover:brightness-110"
        >
          {copy.constelStart}
        </button>
      </div>
    );
  }

  const { w, h } = size;
  return (
    <div
      ref={wrapRef}
      className="constel-enter relative overflow-hidden rounded-2xl"
      style={{
        height: h || 460,
        background: GALAXY_BG,
        border: "1px solid rgba(200,204,210,0.3)",
        boxShadow: "inset 0 0 70px rgba(20,22,28,0.6)",
      }}
    >
      {/* starfield */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {SKY_STARS.map((st, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${st.x}%`, top: `${st.y}%`, width: st.size, height: st.size, opacity: st.op,
              boxShadow: st.bright ? "0 0 6px 1px rgba(225,230,238,0.9)" : undefined,
            }}
          />
        ))}
      </div>

      {/* edges */}
      <svg className="constel-edges-in absolute inset-0 z-10" width={w} height={h} aria-hidden="true">
        <defs>
          <filter id="edgeGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>
        {(["glow", "crisp"] as const).map((pass) => (
          <g key={pass} filter={pass === "glow" ? "url(#edgeGlow)" : undefined} opacity={pass === "glow" ? 0.4 : 1}>
            {linksRef.current.map((e, i) => {
              const s = e.source as SimNode;
              const t = e.target as SimNode;
              if (typeof s !== "object" || typeof t !== "object") return null;
              return (
                <line
                  key={i}
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke={EDGE_COLOR[e.layer]}
                  strokeOpacity={pass === "glow" ? 0.5 : 0.3 + e.weight * 0.55}
                  strokeWidth={pass === "glow" ? 2.5 + e.weight * 2 : 0.7 + e.weight * 1.4}
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        ))}
      </svg>

      {/* nodes (idol-stars) */}
      {nodesRef.current.map((n, i) => (
        <button
          key={n.id}
          onClick={() => router.push(`/artist/${n.id}`)}
          onMouseEnter={() => setHover(n.id)}
          onMouseLeave={() => setHover(null)}
          onFocus={() => setHover(n.id)}
          onBlur={() => setHover(null)}
          aria-label={n.name}
          className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-150 hover:scale-110 focus:scale-110 focus:outline-none"
          style={{ left: n.x ?? 0, top: n.y ?? 0, width: n.r * 2, height: n.r * 2 }}
        >
          <div
            className="cstar-in h-full w-full overflow-hidden rounded-full"
            style={{
              animationDelay: `${(i % 12) * 0.05}s`,
              boxShadow: n.anchor
                ? "0 0 0 2px rgba(255,255,255,0.95), 0 0 0 4px rgba(180,48,43,0.45), 0 0 22px 6px rgba(225,130,100,0.42)"
                : "0 0 0 1.5px rgba(255,255,255,0.85), 0 0 11px 2px rgba(205,218,245,0.5), 0 0 22px 6px rgba(150,175,220,0.3)",
            }}
          >
            <Thumb src={n.image_url} seed={n.id} label={n.name} rounded="rounded-full" focusY={n.image_focus} />
          </div>
          {(n.anchor || hover === n.id) && (
            <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
              {n.name}
              {n.group && <span className="text-white/55"> · {n.group}</span>}
            </div>
          )}
        </button>
      ))}

      {/* legend + title */}
      <div className="absolute bottom-2 left-2 z-30 flex flex-wrap gap-x-2.5 gap-y-1 rounded-lg bg-black/35 px-2 py-1 text-[9px] text-white/80 backdrop-blur-sm">
        {SCORE_LAYERS.map((L) => (
          <span key={L} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: EDGE_COLOR[L], boxShadow: `0 0 5px ${EDGE_COLOR[L]}` }} />
            {layerLabel(locale, L)}
          </span>
        ))}
      </div>
      <div className="absolute right-2 top-2 z-30 rounded-lg bg-black/35 px-2 py-1 font-orbitron text-[9px] font-bold tracking-wider text-white/80 backdrop-blur-sm">
        {copy.constelTitle}
      </div>
    </div>
  );
}
