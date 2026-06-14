"use client";

// 拍貼機開場 — the new-visitor photobooth splash. Plays ONCE, above the picker
// (z-60), then fades and unmounts to reveal it. Gated so existing/returning
// visitors and reduced-motion users never see it. While playing it sets a global
// flag + fires `kstar:intro-done` so Onboarding can delay its picker to pop in on
// the handoff (IntroSplash is mounted BEFORE Onboarding so its effect runs first).

import { useEffect, useState } from "react";

type Phase = "idle" | "play" | "out";

export default function IntroSplash() {
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    let play = false;
    try {
      const seen = localStorage.getItem("kstar:seenIntro");
      const done = localStorage.getItem("kstar:onboarding") === "done";
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (!seen && !done && !reduce) play = true;
      if (!seen) localStorage.setItem("kstar:seenIntro", "1");
    } catch {
      /* ignore */
    }
    if (!play) return;

    (window as unknown as { __kstarIntroPlaying?: boolean }).__kstarIntroPlaying = true;
    setPhase("play");
    const t1 = setTimeout(() => {
      setPhase("out");
      window.dispatchEvent(new Event("kstar:intro-done")); // let the picker pop in on the crossfade
    }, 3400);
    const t2 = setTimeout(() => {
      (window as unknown as { __kstarIntroPlaying?: boolean }).__kstarIntroPlaying = false;
      setPhase("idle");
    }, 3900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "idle") return null;

  return (
    <div className={`intro-splash${phase === "out" ? " is-out" : ""}`} aria-hidden="true">
      <div className="intro-stage">
        <div className="intro-cam">
          <div className="intro-lens">
            <span className="intro-rec" />
            <span className="intro-count c3">3</span>
            <span className="intro-count c2">2</span>
            <span className="intro-count c1">1</span>
          </div>
          <div className="intro-cam-label">KSTAR PHOTO</div>
        </div>
        <div className="intro-strip">
          <div className="intro-pgrid">
            <div className="intro-pcut pp0" />
            <div className="intro-pcut pp1" />
            <div className="intro-pcut pp2" />
            <div className="intro-pcut pp3" />
          </div>
          <div className="intro-pcap">✦ KSTAR ✦</div>
        </div>
        <div className="intro-flash4" />
        <div className="intro-hint">選出你的 TOP 4 ↓</div>
      </div>
    </div>
  );
}
