"use client";

// 拍貼機開場 — the new-visitor photobooth splash (v2, polished).
// A stylized chrome instant-camera fires a 3·2·1 countdown inside its lens,
// flashes once, then prints a glossy 인생네컷 strip that develops cut-by-cut.
// Plays ONCE, above the picker (z-60), then fades and unmounts to reveal it.
// Gated so existing/returning visitors and reduced-motion users never see it.
// While playing it sets a global flag + fires `kstar:intro-done` so Onboarding
// can delay its picker to pop in on the handoff (IntroSplash mounts BEFORE
// Onboarding so its effect runs first).
//
// All visual styling + timing lives in globals.css (the "FIRST-LAUNCH
// PHOTOBOOTH SPLASH" block). The animation timeline is ~6.2s; the constants
// below must stay in sync with the CSS delays:
//   hint settles at ~6.2s  →  HANDOFF at 6400ms  →  UNMOUNT at 6900ms.

import { useEffect, useState } from "react";

type Phase = "idle" | "play" | "out";

const HANDOFF_MS = 6400; // begin fade + hand the picker its cue
const UNMOUNT_MS = 6900; // clear the flag + unmount

export default function IntroSplash() {
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    let play = false;
    try {
      // ?intro in the URL force-replays the splash (demo / re-watch), bypassing the gate.
      const force = new URLSearchParams(window.location.search).has("intro");
      const seen = localStorage.getItem("kstar:seenIntro");
      const done = localStorage.getItem("kstar:onboarding") === "done";
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (force) {
        play = true;
      } else {
        if (!seen && !done && !reduce) play = true;
        if (!seen) localStorage.setItem("kstar:seenIntro", "1");
      }
    } catch {
      /* ignore */
    }
    if (!play) return;

    (window as unknown as { __kstarIntroPlaying?: boolean }).__kstarIntroPlaying = true;
    setPhase("play");
    const t1 = setTimeout(() => {
      setPhase("out");
      window.dispatchEvent(new Event("kstar:intro-done")); // let the picker pop in on the crossfade
    }, HANDOFF_MS);
    const t2 = setTimeout(() => {
      (window as unknown as { __kstarIntroPlaying?: boolean }).__kstarIntroPlaying = false;
      setPhase("idle");
    }, UNMOUNT_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "idle") return null;

  return (
    <div className={`intro-splash${phase === "out" ? " is-out" : ""}`} aria-hidden="true">
      <div className="intro-stage">
        {/* ── the camera ── */}
        <div className="intro-cam">
          <span className="intro-rec" />
          <div className="intro-cam-top">
            <span className="intro-dial" />
            <span className="intro-shoe" />
            <span className="intro-shutter" />
          </div>
          <div className="intro-lenswrap">
            <div className="intro-lens">
              <span className="intro-glint" />
              <span className="intro-count c3">3</span>
              <span className="intro-count c2">2</span>
              <span className="intro-count c1">1</span>
            </div>
          </div>
          <div className="intro-cam-label">KSTAR PHOTO</div>
        </div>

        {/* ── the printed 인생네컷 strip ── */}
        <div className="intro-strip">
          <div className="intro-pgrid">
            <div className="intro-pcut pp0"><span className="intro-sil" /></div>
            <div className="intro-pcut pp1"><span className="intro-sil" /></div>
            <div className="intro-pcut pp2"><span className="intro-sil" /></div>
            <div className="intro-pcut pp3"><span className="intro-sil" /></div>
          </div>
          <div className="intro-pcap">✦ KSTAR · 2026 ✦</div>
        </div>

        <div className="intro-flash4" />
        <div className="intro-hint">選出你的 TOP 4 ↓</div>
      </div>
    </div>
  );
}
