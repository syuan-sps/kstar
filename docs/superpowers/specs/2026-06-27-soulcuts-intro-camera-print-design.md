# SOULCUTS first-visit intro + camera-print on the four-cut reveal

**Date:** 2026-06-27
**Status:** Approved design — ready for implementation plan

## Problem / goal

Two related onboarding-motion changes:

1. The app's first-visit splash is currently `IntroSplash` — a chrome instant-camera
   "printing" a four-cut strip of **generic silhouettes**, unrelated to the user's
   picks. We want a proper **brand moment** on first visit instead.
2. The camera-print animation is too good to waste on a generic intro. Move it to the
   onboarding **select → reveal** transition, where it can develop the user's **real
   four picks** — making the "沖洗照片" (develop the photos) button literal.

The SOULCUTS hero intro (wordmark + slogan + hexagon soul-card teaser, two motion
directions) was already designed and approved as a standalone prototype
(`kstar-intro/hero-intro-7.html` in the claude.ai/design project). This spec wires it
into the app and relocates the camera-print.

## Decisions (locked)

- **Camera-print placement:** on the Step 1 → Step 2 transition, triggered by the
  "沖洗照片 →" button.
- **Camera-print content:** develops the user's **real 4 picked idol photos** (fallback
  to gradient-initial `Thumb` style for picks without a photo).
- **First-visit splash:** the **SOULCUTS hero intro** (built in this same task).
- **Camera-print duration:** tightened to ~3.5s (was ~6.2s).
- **Reduced-motion:** never auto-plays flash; see rules below.

## Component A — SOULCUTS first-visit splash (rewritten `IntroSplash`)

Replaces the camera-print's first-visit role. Mounted globally in `layout.tsx` (as today).

**Gating (unchanged contract):**
- Plays only when `kstar:seenIntro` is unset AND `kstar:onboarding !== "done"`.
- `?intro` URL param forces a replay.
- On finish, sets `kstar:seenIntro`, dispatches **`kstar:intro-done`**, fades out
  (`handoff`), unmounts → `Onboarding` shows. (Onboarding's existing listener is unchanged.)

**Flash-consent gate (new):**
- Before any motion, show a window-frame modal (`.window-frame` / `.title-bar` chrome):
  title `⚠ 動畫含閃光 · FLASH WARNING`, bilingual body, two buttons
  「播放動畫 / Play with effects」 and 「平靜版本 / Use the calm version」, plus a
  "remember my choice" checkbox.
- Choice persists to **`kstar:flashChoice`** (`"flash"` | `"calm"`). If already stored,
  skip the modal and play the stored variant.

**Variant routing:**
- `flash` → **Direction 04 · Shutter Strip** (camera flashes → polaroids → SOULCUTS forges
  → hexagon soul-card).
- `calm`, OR `prefers-reduced-motion`, OR no stored choice + reduced-motion →
  **Direction 06 · Hexagon Radar** (no strobe).
- **Reduced-motion never plays flash**, regardless of stored choice; it also shows the
  resting/final frame rather than the full timeline where motion would be excessive.

**Lockup content (ported from the approved prototype):** wordmark `SOULCUTS / 靈魂四格`,
slogan `FOUR PICKS · ONE SOUL / 四格定格，靈魂顯影`, hexagon-led soul-card teaser
(four layer-colour cuts → mini hexagon radar). Layer colours are the real app colours.

## Component B — Camera-print on the select → reveal transition (`DevelopFourCuts`)

New component built from the camera-print guts of the old `IntroSplash`, parameterized by
the user's 4 picked artists (their `ArtistLite` photos).

**Trigger:** In `Onboarding.tsx` Step 1, the "沖洗照片 →" handler no longer calls
`setStep(2)` directly. It first plays `DevelopFourCuts` (~3.5s) with the 4 selected
artists, then advances to Step 2's existing `FourCuts` reveal.

**Behaviour:**
- The 4 cuts develop the user's **actual idol photos**; picks without a photo fall back to
  the same gradient-initial treatment `FourCuts`/`Thumb` use, so it matches the reveal.
- `prefers-reduced-motion` → skip the animation, advance straight to Step 2.
- Handoff: cross-fade from the printed strip into the Step 2 `FourCuts` layout (morph is a
  nice-to-have; cross-fade is the baseline).

**Optional nicety:** kick off the `/api/pick-scores` prefetch while the print plays, so the
later Step 2 → Step 3 "分析你的品味中…" wait is hidden. Low cost; include if simple.

## CSS / files

- `src/app/globals.css`: trim the camera-print keyframes (~247–413) to ~3.5s total; replace
  the hardcoded `--sil` silhouette gradients with per-cut photo vars (`--p0…--p3`) so cuts
  render real photos (gradient fallback when a pick has none). Add the SOULCUTS intro styles
  (ported/scoped from `intro-brand-x.css`), or a co-located CSS module.
- `src/components/IntroSplash.tsx`: rewritten to render the SOULCUTS hero + flash-consent gate.
- `src/components/DevelopFourCuts.tsx`: new — the parameterized camera-print.
- `src/components/Onboarding.tsx`: Step 1 "沖洗照片 →" handler plays `DevelopFourCuts` then
  advances; reduced-motion bypass.
- `src/app/layout.tsx`: still mounts `IntroSplash` (now the SOULCUTS hero).

## Flags / event contract

- `kstar:seenIntro` — first-visit gate (unchanged).
- `kstar:flashChoice` — **new**: `"flash"` | `"calm"`.
- `kstar:intro-done` — handoff event (unchanged).
- `kstar:onboarding` — completion flag (unchanged).
- `kstar:prefs-updated` — prefs change broadcast (unchanged).

## Out of scope

- Pushing further prototype edits back to claude.ai/design.
- Re-tuning the questionnaire / archetype engine.
- The home-hero (`MyFourCuts`) entrance flash — left as-is.

## Verification

- `npm run build` (typecheck gate) passes.
- Manual: first visit → flash gate → 04 plays → handoff → onboarding; pick 4 → 沖洗照片 →
  camera develops the real 4 → Step 2 reveal. Re-run with `prefers-reduced-motion` (06 / no
  flash, print skipped) and with `kstar:flashChoice="calm"` stored (06, no gate).
