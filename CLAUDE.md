# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Important:** This is Next.js 16 with React 19. APIs differ from training data. Read `node_modules/next/dist/docs/` before writing unfamiliar Next.js code.

---

## Commands

```bash
npm run dev          # start dev server (default port 3000)
npm run build        # production build
npm run lint         # eslint
npm run ingest       # pull artists from Spotify → Supabase (needs env vars)
npm run similarity   # precompute similarity scores in Supabase (needs env vars)
```

The app runs **completely without credentials** — all data is bundled in `src/data/catalog.json`. Supabase + Spotify are only needed to re-ingest or persist cross-device favorites.

**Optional env vars** (copy `.env.example` → `.env.local`):
- `ANTHROPIC_API_KEY` — enables AI-generated similarity reasons; falls back to local strings when absent
- `SPOTIFY_*` — ingestion scripts only
- `SUPABASE_*` — cloud persistence for favorites; falls back to localStorage

---

## Architecture

### Stack
- **Next.js 16** App Router — all routes under `src/app/`
- **React 19** — async params in server components: `const { id } = await params;`
- **Tailwind v4** — CSS-first config in `globals.css` using `@theme inline {}`, no `tailwind.config.js`
- **Fonts** — `Orbitron` (display, `.font-orbitron`) + `Noto Sans TC` (body), both loaded via `next/font/google` in `layout.tsx`

### Data flow
All catalog data lives in `src/data/catalog.json` — 24 artists, each with a 4-layer `profile`. `src/lib/data.ts` loads it synchronously and exports async functions to match the Supabase-backed API shape.

### Similarity engine (`src/lib/similarity.ts`)
4-layer Jaccard scoring: **aesthetic** / **personality** / **performance** / **content**, weighted by user preferences (`Weights`). Falls back to genre + popularity Jaccard for artists without `profile`. The `aestheticScore` tokenises `style_tags + color_palette + vibe.split(" ")` — the optional `analysis` field is display-only, not tokenised.

All aesthetic tokens are **繁體中文** across all 24 artists so Jaccard overlap works correctly. Mixing languages would zero out aesthetic similarity.

### User preferences
Stored in localStorage:
- `kstar:prefs` → `{ topIdols: string[], weights: Weights }`
- `kstar:onboarding` → `"done"` once dismissed

`usePreferences.ts` is SSR-safe (`useState(null)` + `useEffect`). Components that read prefs must be `"use client"` and use the `useState(false)` + `useEffect(() => setMounted(true))` guard pattern to avoid hydration mismatches.

`SimilarSection` dispatches a custom `kstar:prefs-updated` event + listens to the `storage` event for cross-tab/component sync.

### AI reasons
`POST /api/similarity-reason` calls `claude-sonnet-4-6` for a 10-15 繁中 character reason string. Falls back to `相似特質：X、Y` locally when the key is absent or the call fails.

### Key patterns

**Async params (Next.js 16):**
```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

**SSR guard for localStorage:**
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return <Skeleton />;
```

**Filter pills in SimilarSection** — clicking `美學 / 個性 / 表演 / 內容` calls `similarArtists` synchronously with `{ [layer]: 1.0, others: 0 }` weights; no network round-trip needed.

### Visual system
Y2K aesthetic — deep magenta `#1a0028` background with pink grid mesh (`globals.css`). CSS variables: `--pink: #ff00cc`, `--cyan: #00e5ff`, `--lime: #ccff00`. OS window chrome via `.window-frame` / `.title-bar` CSS classes. `IdolFrame` uses 8 deterministic themes (hash of `artist.id % 8`).

### Component hierarchy (key)
- `layout.tsx` — mounts `<Onboarding />` globally, `<Taskbar />` at bottom (desktop only)
- `page.tsx` (home) — desktop: `<MyFourCuts>` centered; mobile: `<MyFourCuts>` + card grid
- `MyFourCuts` → reads `kstar:prefs`, renders `<FourCuts linked>` (인생네컷 photobooth strip)
- `ArtistCard` → wraps `<IdolFrame>` (偶像小卡 photocard holder)
- `artist/[id]/page.tsx` — header → `<AestheticSection>` → `<SimilarSection>`
- `SimilarSection` — client component, handles scoring + AI reasons + filter pills
