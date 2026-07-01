# Empty 人生四格 for new visitors / after 重新開始 — Design

**Date:** 2026-07-01
**Status:** Approved (design)

## Goal
When there are no picks yet — a fresh visitor (no `kstar:prefs`) or right after `重新開始`
(which wipes `kstar:prefs` + `kstar:onboarding`) — the 人生四格 hero should show the real
photobooth strip with **4 empty, tappable slots**, instead of the current text-only prompt.

## Context
- No login exists; "new user" = a browser with no valid `kstar:prefs.topIdols` (4 ids).
- `MyFourCuts` already gates: valid 4 picks → filled strip; otherwise → a text prompt.
  Picks are only ever 0 or 4 (onboarding writes 4; the ＋ swap keeps 4).
- Flow is unchanged: intro auto-plays, the picker auto-opens; the empty strip is the
  resting state when the picker is skipped/closed with `<4` picks.

## Changes
### `src/components/FourCuts.tsx`
- Add optional prop `onPickEmpty?: () => void`.
- When `artists.length === 0 && onPickEmpty`: render four **placeholder cuts** in the same
  2×2 grid, inside the same `#e9ebee` panel with the `✦ KSTAR · 2026 ✦` footer. Each slot:
  a `<button>` with `aspect-[3/4] rounded-lg`, a soft dashed border, a centered `＋`, and a
  small `選擇` hint; `onClick={onPickEmpty}`; `aria-label="選出你的 TOP 4"`; `cursor-pointer`.
- When `artists.length === 4` (or no `onPickEmpty`): unchanged.

### `src/components/MyFourCuts.tsx`
- Replace the `artists.length !== 4` text-prompt branch with the empty strip:
  keep the `你的人生四格 ✦` heading, then render
  `<FourCuts artists={[]} onPickEmpty={repick} className={frameClassName} />`.
- `repick()` already dispatches `kstar:open-onboarding` — tapping any empty slot opens the picker.

## Non-goals / preserved
- No change to the intro, onboarding auto-open, or `重新開始` (Taskbar) logic.
- Filled-strip rendering, the entry camera-flash, and single-cut re-develop are untouched.
- Partial (1–3) pick states don't occur, so only the 0-pick empty case is handled.
