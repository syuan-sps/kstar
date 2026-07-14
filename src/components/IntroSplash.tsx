"use client";

// First-visit brand moment: the KSTAR hero intro. Shows a flash-consent gate,
// then plays direction 04 (Shutter, flash) or 06 (Hexagon Radar, calm). Reduced-
// motion always gets the calm 06 and never the flash.
// Styles/timeline live in globals.css (the ".soul-intro" / ".ib-*" block).

import { useEffect, useRef, useState } from "react";
import { useCopy, useLocale } from "@/lib/i18n/LocaleProvider";

type Phase = "idle" | "gate" | "play" | "out";
type Variant = "flash" | "calm";

const FADE_MS = 5200;
const UNMOUNT_MS = 5700;

export default function IntroSplash() {
  const copy = useCopy();
  const locale = useLocale();
  const [phase, setPhase] = useState<Phase>("idle");
  const [variant, setVariant] = useState<Variant>("flash");
  const timersRef = useRef<{ t1?: ReturnType<typeof setTimeout>; t2?: ReturnType<typeof setTimeout> }>({});

  // decide whether to run at all (first visit / ?intro), and whether to show the gate
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
    // stamp seenIntro only now that the intro will actually play
    try { if (!seen) localStorage.setItem("kstar:seenIntro", "1"); } catch { /* ignore */ }

    // A forced replay (重新開始 → /?intro) always re-asks via the gate. Otherwise a
    // stored choice skips straight to that variant; first visit with no choice asks.
    const stored = (() => { try { return localStorage.getItem("kstar:flashChoice"); } catch { return null; } })();
    if (!force && (stored === "flash" || stored === "calm")) { setVariant(stored as Variant); setPhase("play"); }
    else { setPhase("gate"); }
  }, []);

  // run the play→out→unmount timeline once we enter "play"
  useEffect(() => {
    if (phase !== "play") return;
    const t1 = setTimeout(() => {
      setPhase("out");
    }, FADE_MS);
    const t2 = setTimeout(() => {
      setPhase("idle");
    }, UNMOUNT_MS);
    timersRef.current = { t1, t2 };
    return () => { clearTimeout(t1); clearTimeout(t2); timersRef.current = {}; };
  }, [phase]);

  function handleSkip() {
    // clear any pending timeline timers so they don't call setState after we do
    clearTimeout(timersRef.current.t1);
    clearTimeout(timersRef.current.t2);
    timersRef.current = {};
    setPhase("out");
    setTimeout(() => setPhase("idle"), UNMOUNT_MS - FADE_MS);
  }

  function choose(v: Variant) {
    try {
      localStorage.setItem("kstar:flashChoice", v);
      localStorage.setItem("kstar:flashOk", v === "flash" ? "1" : "0");
    } catch { /* ignore */ }
    setVariant(v);
    setPhase("play");
  }

  if (phase === "idle") return null;

  if (phase === "gate") {
    return (
      <div className="soul-intro-overlay" role="dialog" aria-modal="true" aria-label="Flash warning">
        <div className="window-frame w-full max-w-sm">
          <div className="title-bar">
            <span className="flex-1 truncate text-xs font-bold tracking-wide font-orbitron">{copy.introGateTitle}</span>
          </div>
          <div className="window-body space-y-3 p-5 text-center">
            <div className="text-3xl">⚡</div>
            <p className="font-orbitron text-sm font-bold text-[#1c1e24]">{copy.introGateHeading}</p>
            <p className="text-xs text-[#5e636d]">{copy.introGateBody}</p>
            <div className="flex flex-col gap-2 pt-1">
              <button onClick={() => choose("flash")} className="rounded-full bg-[#b4302b] px-5 py-2.5 text-xs font-bold text-white">{copy.introPlayBtn}</button>
              <button onClick={() => choose("calm")} className="rounded-full border border-[#aeb3bb] bg-white px-5 py-2.5 text-xs font-bold text-[#1c1e24]">{copy.introCalmBtn}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // play / out
  const dir = variant === "flash" ? "ibD" : "ibE";
  const playing = phase === "play";
  return (
    <div className={`soul-intro${phase === "out" ? " is-out" : ""}`} aria-hidden="true">
      <button className="ib-skip" onClick={handleSkip} aria-label="Skip intro">SKIP ✕</button>
      <div className={`ib-stage ${dir}${playing ? " ib-play" : ""}`}>
        {variant === "flash" ? (
          <>
            <div className="ib-strip"><span className="ib-frame f0" style={{"--tx":"-72px","--ty":"-46px","--rot":"-8deg"} as React.CSSProperties}><i /></span><span className="ib-frame f1" style={{"--tx":"66px","--ty":"-52px","--rot":"7deg"} as React.CSSProperties}><i /></span><span className="ib-frame f2" style={{"--tx":"-60px","--ty":"48px","--rot":"6deg"} as React.CSSProperties}><i /></span><span className="ib-frame f3" style={{"--tx":"74px","--ty":"42px","--rot":"-6deg"} as React.CSSProperties}><i /></span></div>
            <div className="ib-reticle" /><div className="ib-flash" />
          </>
        ) : (
          <div className="ib-hex" dangerouslySetInnerHTML={{ __html: HEX_SVG }} />
        )}
        <div className="ib-scene">
          <div className="ib-wordmark"><span className="ib-glint" /><span className="ib-mark">KSTAR</span>{locale === "zh" && <span className="ib-mark-zh">人生四格</span>}</div>
          <div className="ib-slogan"><div className="ib-en">FOUR PICKS · ONE SOUL</div>{locale === "zh" && <div className="ib-zh">四格定格，靈魂顯影</div>}</div>
          <div className="ib-soulcard" dangerouslySetInnerHTML={{ __html: soulcardHtml(locale) }} />
        </div>
      </div>
    </div>
  );
}

// Precomputed from hexSVG() in docs/superpowers/reference/kstar-intro/hero-intro-7.html
// Used for direction E (Hexagon Radar) large background hex
const HEX_SVG = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><polygon class="ring r0" points="50.0,10.0 84.6,30.0 84.6,70.0 50.0,90.0 15.4,70.0 15.4,30.0" pathLength="1"/><polygon class="ring r1" points="50.0,23.0 73.4,36.5 73.4,63.5 50.0,77.0 26.6,63.5 26.6,36.5" pathLength="1"/><polygon class="ring r2" points="50.0,36.0 62.1,43.0 62.1,57.0 50.0,64.0 37.9,57.0 37.9,43.0" pathLength="1"/><line class="spoke" x1="50" y1="50" x2="50.0" y2="10.0" pathLength="1"/><line class="spoke" x1="50" y1="50" x2="84.6" y2="30.0" pathLength="1"/><line class="spoke" x1="50" y1="50" x2="84.6" y2="70.0" pathLength="1"/><line class="spoke" x1="50" y1="50" x2="50.0" y2="90.0" pathLength="1"/><line class="spoke" x1="50" y1="50" x2="15.4" y2="70.0" pathLength="1"/><line class="spoke" x1="50" y1="50" x2="15.4" y2="30.0" pathLength="1"/><polygon class="poly" points="50.0,10.0 78.6,33.5 82.9,69.0 50.0,78.0 18.8,68.0 24.0,35.0"/><circle class="dot d0" cx="50.0" cy="10.0" r="2.4"/><circle class="dot d1" cx="78.6" cy="33.5" r="2.4"/><circle class="dot d2" cx="82.9" cy="69.0" r="2.4"/><circle class="dot d3" cx="50.0" cy="78.0" r="2.4"/><circle class="dot d4" cx="18.8" cy="68.0" r="2.4"/><circle class="dot d5" cx="24.0" cy="35.0" r="2.4"/></svg>`;

// Precomputed from soulcard() inner HTML in docs/superpowers/reference/kstar-intro/hero-intro-7.html
// The scHex() mini radar is embedded inside (.ib-sc-hex). Sample "APSR" card —
// tier name + axis labels are the only locale-varying pieces.
function soulcardHtml(locale: "zh" | "en"): string {
  const tier = locale === "en" ? "HEXAGONAL WARRIOR" : "六邊形戰士";
  const soul = locale === "en" ? "FAN SOUL" : "追星靈魂";
  const [a, p, s, r] = locale === "en" ? ["AESTHETIC", "PERSONALITY", "PERFORMANCE", "CONTENT"] : ["美學", "個性", "表演", "內容"];
  return `<div class="ib-sc-top"><span class="ib-sc-code">APSR</span><span class="ib-sc-tier">${tier}</span></div><div class="ib-sc-cuts" aria-hidden="true"><i class="cut c0"></i><i class="cut c1"></i><i class="cut c2"></i><i class="cut c3"></i></div><div class="ib-sc-hex"><svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><polygon class="ring" points="50.0,8.0 86.4,29.0 86.4,71.0 50.0,92.0 13.6,71.0 13.6,29.0"/><polygon class="poly" points="50.0,10.0 76.0,35.0 82.9,69.0 50.0,76.0 18.8,68.0 23.2,34.5"/><circle class="dot d0" cx="50.0" cy="10.0" r="3.1"/><circle class="dot d1" cx="76.0" cy="35.0" r="3.1"/><circle class="dot d2" cx="82.9" cy="69.0" r="3.1"/><circle class="dot d3" cx="50.0" cy="76.0" r="3.1"/><circle class="dot d4" cx="18.8" cy="68.0" r="3.1"/><circle class="dot d5" cx="23.2" cy="34.5" r="3.1"/></svg></div><div class="ib-sc-labels"><span>${a}</span><span>${p}</span><span>${s}</span><span>${r}</span></div><div class="ib-sc-foot"><b>${soul}</b><em>THE HEXAGON</em></div>`;
}
