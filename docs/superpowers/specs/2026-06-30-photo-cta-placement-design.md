# 補照片 CTA placement fix + artist-header CTA — Design

**Date:** 2026-06-30
**Status:** Approved (design)

## Problems
1. Directory gap card: the `補照片` pill sat in the name row (bottom-left) with a lone
   floating ♥ → looked lopsided/asymmetric.
2. Artist page: a photo-missing header shows no submission CTA at all.

## Solution
Extract a single shared `AddPhotoCTA` client component and place it consistently:

- **Directory** (`IdolFrame`/`IdolDirectory`): pill **dead-center of the photo slot**, big
  initials hidden, idol name kept below. Corner buttons (♡ favorite, ＋ swap) unchanged.
- **Artist header** (`artist/[id]/page.tsx`): pill overlaid **bottom-center** of the 160px
  photo; big initials kept.

## Component: `src/components/AddPhotoCTA.tsx` (client)
- Props: `idolId: string`, `name: string`, `className?: string`.
- Renders a `<button>` pill: `♥ 補照片`, with the `♥` wrapped in `.cta-heartbeat`
  (existing keyframes in `globals.css`, already gated behind `prefers-reduced-motion`).
- `onClick`: `e.preventDefault(); e.stopPropagation(); router.push('/submit?idol=' + idolId)`
  (works whether or not a parent `<Link>` wraps it).
- `aria-label={`幫 ${name} 補照片`}`, `title="補照片"`, `cursor-pointer`.
- Cherry `#b4302b` / white pill; caller supplies positioning via `className`.

## Edits
- `src/components/Thumb.tsx` — add optional `hideInitials?: boolean`; when true and no
  `src`, render the gradient with no initials text.
- `src/components/IdolFrame.tsx` — add optional `showAddCTA?: boolean`. When
  `showAddCTA && !artist.image_url`: pass `hideInitials` to `Thumb` and render
  `AddPhotoCTA` centered in the photo slot (`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10`).
- `src/components/IdolDirectory.tsx` — pass `showAddCTA` to `IdolFrame`; **remove** the
  previous inline gap-card overlay (bottom-left pill + floating ♥) and the now-unused
  `useRouter` import if nothing else uses it.
- `src/app/artist/[id]/page.tsx` — add `relative` to the header photo div; when
  `!artist.image_url`, overlay `<AddPhotoCTA idolId={artist.id} name={artist.name}
  className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10" />`.

## Behavior preserved
- Card click → artist page; pill click → `/submit?idol=<id>` (deep-links to that idol's
  form, already implemented). Motion-safe. Name/identity visible on both surfaces.

## Out of scope (YAGNI)
- CTA on other `IdolFrame` usages (pickers, modals) — gated off by default via `showAddCTA`.
