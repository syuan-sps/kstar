# 補照片 CTA on gap cards — Design

**Date:** 2026-06-30
**Status:** Approved (design)

## Goal
Make the photo-submission entry discoverable by surfacing a cute, subtle **補照片** CTA
directly on the idols that need photos, deep-linking the fan into that idol's upload form.

## Scope
- **Where:** `IdolDirectory` (`#idols` browse grid) only, on cards where `!a.image_url`
  (the gradient-initial fallback cards). Cards that already have a photo are unchanged.
- **Trigger:** always-on (no hover) — mobile-friendly.

## Behavior
- On a gap card, overlay two elements over the existing `<Link href="/artist/{id}">`:
  1. A small **♡** just above the bottom edge, animated with a gentle heartbeat
     (variant 5): `transform: scale(1) → 1.18 → 1.02`, ~2.2s ease-in-out infinite.
  2. A compact cherry (`#b4302b`) **補照片** pill at the bottom.
- The pill is a `<button>` (NOT a nested `<a>` — the card is already a Link). On click:
  `e.preventDefault(); e.stopPropagation(); router.push('/submit?idol=' + a.id)`.
  Mirrors the existing add-to-四格 `＋` button pattern in the same card.
- Clicking anywhere else on the card → artist page (unchanged).
- Positioned to avoid the existing favorite button (top-right) and `＋` button (bottom-right).

## Deep-link
- `SubmitFlow` reads `?idol=<id>` via `useSearchParams`. If it matches an artist in the
  passed `artists` list, initialize `selected` to that artist → opens directly on that
  idol's upload form (skips the gap wall). Absent/invalid → gap wall as today.

## Motion & accessibility
- Heartbeat keyframes added to `globals.css`, gated behind
  `@media (prefers-reduced-motion: no-preference)` so reduced-motion users see a static ♡.
- Cherry/white, Silvercore visual language.

## Files touched
- `src/components/IdolDirectory.tsx` — gap-card overlay + `router.push`.
- `src/components/SubmitFlow.tsx` — read `?idol=` and preselect.
- `src/app/globals.css` — `@keyframes` + reduced-motion gate + CTA utility classes.

## Out of scope (YAGNI)
- CTA on any surface other than the directory grid (Thumb, similar cards, pickers).
- Hover-reveal variants; analytics on the CTA.
