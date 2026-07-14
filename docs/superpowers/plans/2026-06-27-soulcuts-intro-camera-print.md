# SOULCUTS intro + camera-print on four-cut reveal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the first-visit splash with the approved SOULCUTS hero intro (flash-consent gated, 04 Shutter / 06 Hexagon), and relocate the existing camera-print so it develops the user's real 4 picks on the 沖洗照片 select→reveal transition.

**Architecture:** Two client components. `IntroSplash` (rewritten) is the global first-visit brand moment + flash gate. `DevelopFourCuts` (new) is the camera-print, parameterized by the 4 picked artists, played inside `Onboarding` Step 1 before advancing to the Step 2 `FourCuts` reveal. All motion/timing lives in `globals.css`; the SOULCUTS lockup + 04/06 motion are ported from the vendored prototype.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4 (CSS-first in `globals.css`), Orbitron + Noto Sans TC. No test runner in this repo — the correctness gate is `npm run build` (typecheck) plus scripted manual verification in the dev preview.

## Global Constraints

- **Next.js 16 / React 19** — async route `params`; client components need `"use client"`.
- **No `tailwind.config`** — theme + all keyframes live in `src/app/globals.css` (`@theme`).
- **Verification cycle (this repo has no unit tests):** every task ends with `npm run build` passing, a documented manual check in the dev preview (`kpop-dev` on :3100, started via `.claude/launch.json` / `preview_start`), then a commit.
- **Porting source (durable, in-repo):** `docs/superpowers/reference/kstar-intro/intro-brand-x.css` and `…/hero-intro-7.html` — the approved prototype. Verbatim CSS is copied from there; do not re-invent it.
- **Layer colours (real app values):** 美學 `#e7eaef` · 個性 `#ef6f68` · 表演 `#86b6f0` · 內容 `#b8bec9` · cherry `#b4302b`.
- **localStorage / event contract:** `kstar:seenIntro`, `kstar:onboarding`, `kstar:intro-done`, `kstar:prefs-updated` (all existing); `kstar:flashChoice` = `"flash" | "calm"` (new).
- **Reduced-motion rule:** when `matchMedia("(prefers-reduced-motion: reduce)")` matches, the intro NEVER plays flash — it shows direction 06 (calm), and `DevelopFourCuts` is skipped (advance straight to reveal). This overrides any stored `kstar:flashChoice`.
- **Branch:** `intro-soulcuts-camera-print` (already created).

---

## File structure

- **Create** `src/components/DevelopFourCuts.tsx` — the parameterized camera-print (Task 1).
- **Modify** `src/components/Onboarding.tsx` — Step 1 「沖洗照片 →」 plays `DevelopFourCuts`, then `setStep(2)` (Task 1).
- **Modify** `src/app/globals.css` — add `.dev-*` camera-print styles (Task 1); add `.soul-intro` / `.ib-*` SOULCUTS styles (Task 2); remove orphaned `.intro-*` splash styles (Task 3).
- **Rewrite** `src/components/IntroSplash.tsx` — SOULCUTS hero + flash-consent gate + variant routing (Task 2).
- `src/app/layout.tsx` — no change (still mounts `<IntroSplash />` before `<Onboarding />`).

The camera-print gets brand-new `.dev-*` class names rather than reusing the old `.intro-*` ones, so Task 1 is fully independent of the splash rewrite and Task 3 can delete the old `.intro-*` block cleanly.

---

## Task 1: `DevelopFourCuts` — camera develops the real 4 picks on 沖洗照片

**Files:**
- Create: `src/components/DevelopFourCuts.tsx`
- Modify: `src/components/Onboarding.tsx` (imports; `selectedArtists` already exists at ~line 101; Step 1 button at lines 176–183; add a `developing` state)
- Modify: `src/app/globals.css` (append a `.dev-*` block near the existing splash block ~line 413)
- Verify: manual (no unit tests)

**Interfaces:**
- Consumes: `CardArtist` from `@/lib/lite` (`{ id, name, name_zh?, group?, image_url?, image_focus? }`); `Thumb` from `@/components/Thumb` (`<Thumb src seed label rounded focusY />`).
- Produces: `export default function DevelopFourCuts({ artists, onDone }: { artists: CardArtist[]; onDone: () => void }): JSX.Element` — renders the camera+strip developing `artists` photos, calls `onDone()` after ~3.5s (or immediately on reduced-motion).

- [ ] **Step 1: Create the component**

Create `src/components/DevelopFourCuts.tsx`:

```tsx
"use client";

// Camera-print on the select→reveal transition: a chrome instant-camera
// "develops" the user's four real picks, then hands off to the Step 2 reveal.
// ~3.5s; skipped (instant onDone) for prefers-reduced-motion. Visuals/timing in
// globals.css (the ".dev-*" block).

import { useEffect } from "react";
import type { CardArtist } from "@/lib/lite";
import Thumb from "@/components/Thumb";

const DONE_MS = 3500; // keep in sync with the .dev-* CSS timeline

export default function DevelopFourCuts({
  artists,
  onDone,
}: {
  artists: CardArtist[];
  onDone: () => void;
}) {
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      onDone();
      return;
    }
    const t = setTimeout(onDone, DONE_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="dev-splash" aria-hidden="true">
      <div className="dev-stage">
        <div className="dev-cam">
          <span className="dev-rec" />
          <div className="dev-lens">
            <span className="dev-glint" />
          </div>
          <div className="dev-cam-label">KSTAR PHOTO</div>
        </div>
        <div className="dev-strip">
          <div className="dev-grid">
            {artists.slice(0, 4).map((a, i) => (
              <div key={a.id} className={`dev-cut dev-cut${i}`}>
                <Thumb src={a.image_url} seed={a.id} label={a.name} rounded="rounded-md" focusY={a.image_focus} />
              </div>
            ))}
          </div>
          <div className="dev-cap">✦ KSTAR · 2026 ✦</div>
        </div>
        <div className="dev-flash" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the `.dev-*` styles**

Append to `src/app/globals.css` (after the existing splash block, ~line 413). This reuses the proven camera/strip look from the `.intro-*` block but on independent class names, a ~3.5s timeline, and real `<Thumb>` children inside the cuts (no silhouettes):

```css
/* ── Camera-print on the four-cut reveal (DevelopFourCuts, ~3.5s) ─────── */
.dev-splash { position: relative; display: flex; align-items: center; justify-content: center; padding: 6px 0 2px; }
.dev-stage { position: relative; width: 250px; height: 320px; }
.dev-cam { position: absolute; left: 50%; top: 2px; transform: translateX(-50%); z-index: 3; width: 150px; padding: 10px 12px 8px;
  background: linear-gradient(180deg, rgba(255,255,255,.8), rgba(255,255,255,0) 20%),
    linear-gradient(135deg, #f6f8fa 0%, #d6dade 28%, #aeb3bb 52%, #cdd1d7 72%, #9aa0aa 100%);
  border: 2px solid #aeb3bb; border-radius: 16px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 3px 5px 0 rgba(74,74,74,.22), 0 10px 28px rgba(124,128,136,.3);
  animation: cam-in .6s var(--ease-out-expo) both; }
.dev-rec { position: absolute; right: 13px; top: 11px; width: 7px; height: 7px; border-radius: 50%; background: #e0584f; box-shadow: 0 0 8px rgba(224,88,79,.95);
  animation: rec-pulse .6s var(--ease-soft) .3s 4 both; }
.dev-lens { position: relative; width: 84px; height: 84px; margin: 0 auto; border-radius: 50%; overflow: hidden;
  background: radial-gradient(circle at 50% 38%, #3b4048 0%, #1a1c21 46%, #0a0b0d 100%);
  box-shadow: 0 0 0 3px #d0d4da, 0 0 0 6px #aeb3bb, inset 0 3px 9px rgba(255,255,255,.22), inset 0 -7px 16px rgba(0,0,0,.62); }
.dev-glint { position: absolute; inset: 0; border-radius: 50%; pointer-events: none; transform: translateX(-130%);
  background: linear-gradient(118deg, transparent 42%, rgba(255,255,255,.72) 50%, transparent 58%);
  animation: lens-glint 1s var(--ease-out-expo) .4s both; }
.dev-cam-label { text-align: center; font-family: var(--font-orbitron), system-ui, sans-serif; font-size: 9px; letter-spacing: .22em; color: #6f747c; margin-top: 7px; }
.dev-strip { position: absolute; left: 50%; top: 118px; z-index: 1; width: 150px; transform: translate(-50%,0);
  background: linear-gradient(180deg, #fff, #eef0f3); border: 1px solid #d3d7dd; border-radius: 14px; padding: 9px 9px 7px;
  box-shadow: 5px 7px 0 rgba(124,128,136,.28), 0 10px 26px rgba(124,128,136,.26);
  animation: strip-print 1.1s var(--ease-out-expo) 1.0s both; }
.dev-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.dev-cut { position: relative; aspect-ratio: 3 / 4; border-radius: 6px; overflow: hidden; box-shadow: inset 0 0 0 1px rgba(255,255,255,.18);
  animation: cut-develop .55s var(--ease-out-expo) both; }
.dev-cut0 { animation-delay: 1.9s; } .dev-cut1 { animation-delay: 2.2s; }
.dev-cut2 { animation-delay: 2.5s; } .dev-cut3 { animation-delay: 2.8s; }
.dev-cap { text-align: center; font-family: var(--font-orbitron), system-ui, sans-serif; font-size: 10px; letter-spacing: .24em; color: #6f747c; margin-top: 7px; }
.dev-flash { position: absolute; inset: 0; z-index: 5; pointer-events: none; opacity: 0; background: radial-gradient(circle at 50% 40%, #fff, #eef3f9 58%, #e0e7ef);
  animation: intro-flash4 .7s var(--ease-soft) .85s both; }
```

(`cam-in`, `rec-pulse`, `lens-glint`, `strip-print`, `cut-develop`, `intro-flash4` already exist in `globals.css` lines 258–263.)

- [ ] **Step 3: Wire it into Onboarding Step 1**

In `src/components/Onboarding.tsx`:

Add the import near the other component imports (after line 8):

```tsx
import DevelopFourCuts from "@/components/DevelopFourCuts";
```

Add a `developing` state next to the others (after line 21):

```tsx
  const [developing, setDeveloping] = useState(false);
```

Replace the Step 1 「沖洗照片 →」 button (lines 176–182) so it starts the develop animation instead of jumping straight to Step 2:

```tsx
                <button
                  disabled={selected.length !== MAX_PICKS}
                  onClick={() => setDeveloping(true)}
                  className="rounded-full bg-[#b4302b] px-4 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                >
                  沖洗照片 →
                </button>
```

Render the overlay while developing. Insert this just inside the `window-body` div, before the `{step === 1 && (` block (after line 122):

```tsx
          {developing && (
            <DevelopFourCuts
              artists={selectedArtists}
              onDone={() => { setDeveloping(false); setStep(2); }}
            />
          )}
```

And guard Step 1 so the picker UI hides while the camera plays — change the Step 1 condition from `{step === 1 && (` to:

```tsx
          {step === 1 && !developing && (
```

- [ ] **Step 4: Build (typecheck gate)**

Run: `npm run build`
Expected: compiles with no type errors; route table prints.

- [ ] **Step 5: Manual verification**

Start the preview (`preview_start` with config `kpop-dev`, :3100), then in the browser console run `localStorage.clear()` and reload. Dismiss/await the splash, then in the picker: search + select 4 idols → click **沖洗照片 →**.
Expected: the chrome camera prints a strip whose four cuts develop into the **selected idols' actual photos** (idols without a photo show the gradient-initial `Thumb`), ~3.5s, then the Step 2 「你的人生四格 ✦」 reveal appears with the same four. Then toggle OS Reduce Motion on, repeat: the camera step is skipped and Step 2 appears immediately.

- [ ] **Step 6: Commit**

```bash
git add src/components/DevelopFourCuts.tsx src/components/Onboarding.tsx src/app/globals.css
git commit -m "feat(onboarding): camera develops the real 4 picks on 沖洗照片"
```

---

## Task 2: SOULCUTS first-visit intro + flash-consent gate (rewrite `IntroSplash`)

**Files:**
- Rewrite: `src/components/IntroSplash.tsx`
- Modify: `src/app/globals.css` (append the `.soul-intro` / `.ib-*` block)
- Reference: `docs/superpowers/reference/kstar-intro/intro-brand-x.css` (verbatim CSS source) and `…/hero-intro-7.html` (markup source for the lockup, `scHex()`, scenes D & E)
- Verify: manual

**Interfaces:**
- Consumes: nothing new (self-contained client component).
- Produces: default-exported `IntroSplash` that, on first visit, shows the consent gate then plays variant `flash` (04) or `calm` (06), then dispatches `kstar:intro-done` and unmounts — preserving the handoff `Onboarding.tsx` already listens for (no Onboarding change).

- [ ] **Step 1: Port the SOULCUTS styles into globals.css**

From `docs/superpowers/reference/kstar-intro/intro-brand-x.css`, copy into `src/app/globals.css` (append at end) these blocks, each selector prefixed with `.soul-intro ` so they can't collide with app styles:
- the shared lockup: `.ib-stage`, `.ib-scene`, `.ib-wordmark*`, `.ib-slogan*`, `.ib-soulcard*`, `.ib-sc-*`, `.ib-skip`
- the keyframes block (all `@keyframes ib-*`) — copy as-is (keyframes are global; no prefix)
- direction **D** resting + motion: `.ibD`, `.ibD .* `, `.ibD.ib-play .*`
- direction **E** resting + motion: `.ibE`, `.ibE .*`, `.ibE.ib-play .*`
- the four `--ib-*` custom properties and eases from the prototype `:root` → add them under the existing `@theme`/`:root` in globals.css (rename to avoid clashes only if a name already exists; the `--ib-*` names are new).

Skip directions A/B/C/F/G (not used). Wrap the stage usage so the component root carries both `.soul-intro` and the direction class.

- [ ] **Step 2: Rewrite the component**

Replace `src/components/IntroSplash.tsx` entirely:

```tsx
"use client";

// First-visit brand moment: the SOULCUTS hero intro. Shows a flash-consent gate,
// then plays direction 04 (Shutter, flash) or 06 (Hexagon Radar, calm). Reduced-
// motion always gets the calm 06 and never the flash. On finish it dispatches
// `kstar:intro-done` and unmounts, so Onboarding pops in on the handoff.
// Styles/timeline live in globals.css (the ".soul-intro" / ".ib-*" block).

import { useEffect, useState } from "react";

type Phase = "idle" | "gate" | "play" | "out";
type Variant = "flash" | "calm";

const HANDOFF_MS = 5200; // begin fade + cue the picker
const UNMOUNT_MS = 5700;

function prefersReduced() {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export default function IntroSplash() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [variant, setVariant] = useState<Variant>("flash");

  // decide whether to run at all (first visit / ?intro), and whether to show the gate
  useEffect(() => {
    let run = false;
    try {
      const force = new URLSearchParams(window.location.search).has("intro");
      const seen = localStorage.getItem("kstar:seenIntro");
      const done = localStorage.getItem("kstar:onboarding") === "done";
      run = force || (!seen && !done);
      if (!seen) localStorage.setItem("kstar:seenIntro", "1");
    } catch { /* ignore */ }
    if (!run) return;

    (window as unknown as { __kstarIntroPlaying?: boolean }).__kstarIntroPlaying = true;

    const stored = (() => { try { return localStorage.getItem("kstar:flashChoice"); } catch { return null; } })();
    if (prefersReduced()) { setVariant("calm"); setPhase("play"); }
    else if (stored === "flash" || stored === "calm") { setVariant(stored); setPhase("play"); }
    else { setPhase("gate"); }
  }, []);

  // run the play→out→unmount timeline once we enter "play"
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
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  function choose(v: Variant) {
    try { localStorage.setItem("kstar:flashChoice", v); } catch { /* ignore */ }
    setVariant(v);
    setPhase("play");
  }

  if (phase === "idle") return null;

  if (phase === "gate") {
    return (
      <div className="soul-intro-overlay" role="dialog" aria-modal="true" aria-label="Flash warning">
        <div className="window-frame w-full max-w-sm">
          <div className="title-bar">
            <span className="flex-1 truncate text-xs font-bold tracking-wide font-orbitron">⚠ 動畫含閃光 · FLASH WARNING</span>
          </div>
          <div className="window-body space-y-3 p-5 text-center">
            <div className="text-3xl">⚡</div>
            <p className="font-orbitron text-sm font-bold text-[#1c1e24]">開場動畫包含閃爍效果</p>
            <p className="text-xs text-[#5e636d]">SOULCUTS 的開場動畫含有閃光，可能影響光敏感族群。要播放嗎？</p>
            <p className="text-[11px] text-[#9aa0aa]">The opening animation contains flashing lights.</p>
            <div className="flex flex-col gap-2 pt-1">
              <button onClick={() => choose("flash")} className="rounded-full bg-[#b4302b] px-5 py-2.5 text-xs font-bold text-white">播放動畫 · Play with effects</button>
              <button onClick={() => choose("calm")} className="rounded-full border border-[#aeb3bb] bg-white px-5 py-2.5 text-xs font-bold text-[#1c1e24]">平靜版本 · Use the calm version</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // play / out
  const dir = variant === "flash" ? "ibD" : "ibE";
  const playing = phase === "play" && !prefersReduced();
  return (
    <div className={`soul-intro${phase === "out" ? " is-out" : ""}`} aria-hidden="true">
      <div className={`ib-stage ${dir}${playing ? " ib-play" : ""}`}>
        {variant === "flash" ? (
          <>
            <div className="ib-strip"><span className="ib-frame f0"><i /></span><span className="ib-frame f1"><i /></span><span className="ib-frame f2"><i /></span><span className="ib-frame f3"><i /></span></div>
            <div className="ib-reticle" /><div className="ib-flash" />
          </>
        ) : (
          <div className="ib-hex" dangerouslySetInnerHTML={{ __html: HEX_SVG }} />
        )}
        <div className="ib-scene">
          <div className="ib-wordmark"><span className="ib-glint" /><span className="ib-mark">SOULCUTS</span><span className="ib-mark-zh">靈魂四格</span></div>
          <div className="ib-slogan"><div className="ib-en">FOUR PICKS · ONE SOUL</div><div className="ib-zh">四格定格，靈魂顯影</div></div>
          <div className="ib-soulcard" dangerouslySetInnerHTML={{ __html: SOULCARD_HTML }} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add the SVG/markup constants**

The prototype builds the hexagon SVG, the four-frame markup, and the soul-card via JS template functions (`scHex()`, `soulcard()`, `frames()`, `hexPt()` in `hero-intro-7.html`). For React, precompute them as static strings at the bottom of `IntroSplash.tsx`. Run the prototype's `scHex()` and `soulcard()` once (open `docs/superpowers/reference/kstar-intro/hero-intro-7.html` in a browser, `console.log(scHex())` and `console.log(soulcard())` after the script loads) and paste the exact output:

```tsx
const HEX_SVG = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">/* paste scHex() output */</svg>`;
const SOULCARD_HTML = `/* paste the inner HTML of soulcard() — everything inside <div class="ib-soulcard"> */`;
```

(These are deterministic — `hexPt` uses fixed radii `[40,30,38,26,36,31]` — so the strings are stable. The `.ib-frame` markup for the flash variant is already inline in the JSX above.)

- [ ] **Step 4: Build (typecheck gate)**

Run: `npm run build`
Expected: compiles, no type errors.

- [ ] **Step 5: Manual verification (all paths)**

Preview on :3100. In console `localStorage.clear()` each time.
1. **First visit / flash:** reload → consent gate appears in the window-frame chrome → click **播放動畫** → Shutter Strip (04) plays (flashes → polaroids → SOULCUTS forges → hexagon soul-card) → fades → onboarding picker pops in. `localStorage.kstar:flashChoice === "flash"`.
2. **First visit / calm:** `localStorage.clear()`, reload → click **平靜版本** → Hexagon Radar (06) plays, no strobe → handoff. `kstar:flashChoice === "calm"`.
3. **Stored choice:** with `kstar:flashChoice` set and `kstar:seenIntro` cleared (`?intro`), reload `…/?intro` → gate is skipped, stored variant plays.
4. **Reduced motion:** OS Reduce Motion on, `localStorage.clear()`, reload → no gate, 06 plays calm (resting frame, no flash), handoff still fires.
5. Confirm onboarding still appears after every path (the `kstar:intro-done` handoff).

- [ ] **Step 6: Commit**

```bash
git add src/components/IntroSplash.tsx src/app/globals.css
git commit -m "feat(intro): SOULCUTS first-visit hero + flash-consent gate (04/06)"
```

---

## Task 3: Remove the orphaned camera-splash CSS + full-flow regression

**Files:**
- Modify: `src/app/globals.css` (delete the now-unused `.intro-*` splash block)
- Verify: manual full-flow

**Interfaces:** none (cleanup only).

- [ ] **Step 1: Delete orphaned styles**

The old splash markup is gone (Task 2 rewrote `IntroSplash`; `DevelopFourCuts` uses `.dev-*`). In `src/app/globals.css` delete the first-launch splash resting block and its motion rules that are no longer referenced: `.intro-splash`, `.intro-stage`, `.intro-cam*`, `.intro-rec*`, `.intro-dial*`, `.intro-shoe`, `.intro-shutter`, `.intro-lens*`, `.intro-glint`, `.intro-count*`, `.intro-cam-label`, `.intro-strip`, `.intro-pgrid`, `.intro-pcut*`, `.intro-sil`, `.intro-pcap`, `.intro-flash4`, `.intro-hint` (lines ~314–362 and the motion rules ~399–413).

KEEP: `.intro-flash` / `.intro-flash::after` / `.intro-flash .fc-cut` (lines ~298–303, ~374–380) — those belong to the **home-hero returning-visitor flash** (`MyFourCuts`), which is out of scope. KEEP all `@keyframes` still used by `.dev-*` (`cam-in`, `rec-pulse`, `lens-glint`, `strip-print`, `cut-develop`, `intro-flash4`) and by `.intro-flash` (`intro-flash`).

- [ ] **Step 2: Confirm nothing else references the deleted classes**

Run: `grep -rn "intro-cam\|intro-strip\|intro-pcut\|intro-splash\|intro-stage\|intro-count\|intro-hint\|intro-sil" src/`
Expected: no matches (only `.intro-flash` for the home hero remains, which is a different token — verify any hits are exactly `intro-flash`/`intro-flash4`, not the deleted ones).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 4: Manual full-flow regression**

Preview on :3100, `localStorage.clear()`, reload: gate → (flash) 04 → onboarding → pick 4 → 沖洗照片 → camera develops real picks → Step 2 reveal → CTA → quiz still works end to end. Then a returning visit (`kstar:onboarding="done"`): no intro, home hero `MyFourCuts` still does its entrance flash.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "chore(intro): drop orphaned camera-splash CSS after SOULCUTS swap"
```

---

## Self-review

- **Spec coverage:** A (SOULCUTS first-visit + gate + 04/06 + reduced-motion) → Task 2. B (camera-print on 沖洗照片, real picks, ~3.5s, reduced-motion skip) → Task 1. CSS trim/port → Tasks 1–3. Flags `kstar:flashChoice` etc. → Task 2. Prefetch `/api/pick-scores` nicety → intentionally deferred (noted optional in spec; not blocking — omitted to keep tasks focused; can be a follow-up).
- **Placeholders:** the only "paste output" steps (Task 2 Step 3) are deterministic generator outputs with an exact reproduction recipe and fixed inputs — not open-ended TODOs.
- **Type consistency:** `DevelopFourCuts({ artists: CardArtist[]; onDone })`, `Variant = "flash"|"calm"`, and the `kstar:flashChoice` values match across the plan and the spec.
- **Note:** prefetch nicety dropped from the plan; flag to the user as the one spec "optional" not scheduled.
