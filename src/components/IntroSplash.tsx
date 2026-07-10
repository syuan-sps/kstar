"use client";

// First-visit brand moment: candy-chrome SOULCUTS / KSTAR intro.
// Flash = shutter + ambient on; calm = hex radar + static ambient.
// Styles/timeline live in globals.css (".soul-intro" / ".ib-*" block).

import { useEffect, useRef, useState } from "react";
import { setAmbientMode } from "@/components/AmbientMotion";
import LiquidChromeMark from "@/components/LiquidChromeMark";

type Phase = "idle" | "gate" | "play" | "out";
type Variant = "flash" | "calm";

const HANDOFF_MS = 5200;
const UNMOUNT_MS = 5700;

export default function IntroSplash() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [variant, setVariant] = useState<Variant>("flash");
  const timersRef = useRef<{ t1?: ReturnType<typeof setTimeout>; t2?: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    let run = false;
    let seen: string | null = null;
    let force = false;
    try {
      force = new URLSearchParams(window.location.search).has("intro");
      seen = localStorage.getItem("kstar:seenIntro");
      const done = localStorage.getItem("kstar:onboarding") === "done";
      run = force || (!seen && !done);
    } catch { /* ignore */ }
    if (!run) return;
    try { if (!seen) localStorage.setItem("kstar:seenIntro", "1"); } catch { /* ignore */ }

    (window as unknown as { __kstarIntroPlaying?: boolean }).__kstarIntroPlaying = true;

    const stored = (() => { try { return localStorage.getItem("kstar:flashChoice"); } catch { return null; } })();
    if (!force && (stored === "flash" || stored === "calm")) {
      setVariant(stored as Variant);
      setAmbientMode(stored as Variant);
      setPhase("play");
    } else {
      setPhase("gate");
    }
  }, []);

  useEffect(() => {
    if (phase !== "play") return;
    const t1 = setTimeout(() => {
      setPhase("out");
      window.dispatchEvent(new Event("kstar:intro-done"));
    }, HANDOFF_MS);
    const t2 = setTimeout(() => {
      (window as unknown as { __kstarIntroPlaying?: boolean }).__kstarIntroPlaying = false;
      setPhase("idle");
    }, UNMOUNT_MS);
    timersRef.current = { t1, t2 };
    return () => { clearTimeout(t1); clearTimeout(t2); timersRef.current = {}; };
  }, [phase]);

  function handleSkip() {
    clearTimeout(timersRef.current.t1);
    clearTimeout(timersRef.current.t2);
    timersRef.current = {};
    window.dispatchEvent(new Event("kstar:intro-done"));
    (window as unknown as { __kstarIntroPlaying?: boolean }).__kstarIntroPlaying = false;
    setPhase("out");
    setTimeout(() => setPhase("idle"), UNMOUNT_MS - HANDOFF_MS);
  }

  function choose(v: Variant) {
    setAmbientMode(v);
    setVariant(v);
    setPhase("play");
  }

  if (phase === "idle") return null;

  if (phase === "gate") {
    return (
      <div className="soul-intro-overlay" role="dialog" aria-modal="true" aria-label="Flash warning">
        <div className="window-frame w-full max-w-sm">
          <div className="title-bar">
            <span className="flex-1 truncate text-xs font-bold tracking-wide">⚠ 動畫含閃光 · FLASH WARNING</span>
          </div>
          <div className="window-body space-y-3 p-5 text-center">
            <LiquidChromeMark mark="kstar" className="lcm-nav lcm-live mx-auto" />
            <p className="font-soft text-sm font-bold text-[#1c1e24]">開場動畫包含閃爍效果</p>
            <p className="text-xs text-[#5e636d] leading-relaxed">
              選「播放」開啟糖果鉻動態光澤；選「平靜」保持靜態貼紙世界。
            </p>
            <p className="text-[11px] text-[#9aa0aa]">Flash enables bubbly ambient motion site-wide.</p>
            <div className="flex flex-col gap-2.5 pt-1">
              <button onClick={() => choose("flash")} className="bubble-pill candy w-full px-5 py-2.5 text-xs font-bold">
                播放動畫 · Play with effects
              </button>
              <button onClick={() => choose("calm")} className="bubble-pill w-full px-5 py-2.5 text-xs font-bold text-[#1c1e24]">
                平靜版本 · Use the calm version
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dir = variant === "flash" ? "ibD" : "ibE";
  const playing = phase === "play";
  return (
    <div className={`soul-intro${phase === "out" ? " is-out" : ""}`} aria-hidden="true">
      <button className="ib-skip" onClick={handleSkip} aria-label="Skip intro">SKIP ✕</button>
      <div className={`ib-stage ${dir}${playing ? " ib-play" : ""}`}>
        {variant === "flash" ? (
          <>
            <div className="ib-strip">
              <span className="ib-frame f0" style={{"--tx":"-72px","--ty":"-46px","--rot":"-8deg"} as React.CSSProperties}><i /></span>
              <span className="ib-frame f1" style={{"--tx":"66px","--ty":"-52px","--rot":"7deg"} as React.CSSProperties}><i /></span>
              <span className="ib-frame f2" style={{"--tx":"-60px","--ty":"48px","--rot":"6deg"} as React.CSSProperties}><i /></span>
              <span className="ib-frame f3" style={{"--tx":"74px","--ty":"42px","--rot":"-6deg"} as React.CSSProperties}><i /></span>
            </div>
            <div className="ib-reticle" /><div className="ib-flash" />
          </>
        ) : (
          <div className="ib-hex" dangerouslySetInnerHTML={{ __html: HEX_SVG }} />
        )}
        <div className="ib-scene">
          <div className="ib-wordmark ib-candy-marks">
            <LiquidChromeMark mark="kstar" className="lcm-intro lcm-live" starHole />
            <LiquidChromeMark mark="soulcuts" className="lcm-hero-sub lcm-live mt-1" />
            <span className="ib-mark-zh">靈魂四格</span>
          </div>
          <div className="ib-slogan">
            <div className="ib-en">FOUR PICKS · ONE SOUL</div>
            <div className="ib-zh">四格定格，靈魂顯影</div>
          </div>
          <div className="ib-soulcard" dangerouslySetInnerHTML={{ __html: SOULCARD_HTML }} />
        </div>
      </div>
    </div>
  );
}

const HEX_SVG = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><polygon class="ring r0" points="50.0,10.0 84.6,30.0 84.6,70.0 50.0,90.0 15.4,70.0 15.4,30.0" pathLength="1"/><polygon class="ring r1" points="50.0,23.0 73.4,36.5 73.4,63.5 50.0,77.0 26.6,63.5 26.6,36.5" pathLength="1"/><polygon class="ring r2" points="50.0,36.0 62.1,43.0 62.1,57.0 50.0,64.0 37.9,57.0 37.9,43.0" pathLength="1"/><line class="spoke" x1="50" y1="50" x2="50.0" y2="10.0" pathLength="1"/><line class="spoke" x1="50" y1="50" x2="84.6" y2="30.0" pathLength="1"/><line class="spoke" x1="50" y1="50" x2="84.6" y2="70.0" pathLength="1"/><line class="spoke" x1="50" y1="50" x2="50.0" y2="90.0" pathLength="1"/><line class="spoke" x1="50" y1="50" x2="15.4" y2="70.0" pathLength="1"/><line class="spoke" x1="50" y1="50" x2="15.4" y2="30.0" pathLength="1"/><polygon class="poly" points="50.0,10.0 78.6,33.5 82.9,69.0 50.0,78.0 18.8,68.0 24.0,35.0"/><circle class="dot d0" cx="50.0" cy="10.0" r="2.4"/><circle class="dot d1" cx="78.6" cy="33.5" r="2.4"/><circle class="dot d2" cx="82.9" cy="69.0" r="2.4"/><circle class="dot d3" cx="50.0" cy="78.0" r="2.4"/><circle class="dot d4" cx="18.8" cy="68.0" r="2.4"/><circle class="dot d5" cx="24.0" cy="35.0" r="2.4"/></svg>`;

const SOULCARD_HTML = `<div class="ib-sc-top"><span class="ib-sc-code">APSR</span><span class="ib-sc-tier">六邊形戰士</span></div><div class="ib-sc-cuts" aria-hidden="true"><i class="cut c0"></i><i class="cut c1"></i><i class="cut c2"></i><i class="cut c3"></i></div><div class="ib-sc-hex"><svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><polygon class="ring" points="50.0,8.0 86.4,29.0 86.4,71.0 50.0,92.0 13.6,71.0 13.6,29.0"/><polygon class="poly" points="50.0,10.0 76.0,35.0 82.9,69.0 50.0,76.0 18.8,68.0 23.2,34.5"/><circle class="dot d0" cx="50.0" cy="10.0" r="3.1"/><circle class="dot d1" cx="76.0" cy="35.0" r="3.1"/><circle class="dot d2" cx="82.9" cy="69.0" r="3.1"/><circle class="dot d3" cx="50.0" cy="76.0" r="3.1"/><circle class="dot d4" cx="18.8" cy="68.0" r="3.1"/><circle class="dot d5" cx="23.2" cy="34.5" r="3.1"/></svg></div><div class="ib-sc-labels"><span>美學</span><span>個性</span><span>表演</span><span>內容</span></div><div class="ib-sc-foot"><b>追星靈魂</b><em>THE HEXAGON</em></div>`;
