# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Important:** This is Next.js 16 with React 19. APIs differ from training data. Read `node_modules/next/dist/docs/` before writing unfamiliar Next.js code.

---

## Commands

```bash
npm run dev          # dev server (port 3000; preview config uses 3100)
npm run build        # production build (also the typecheck gate — scripts/ is excluded from tsconfig)
npm run lint         # eslint

# Data pipeline (no credentials needed)
npx tsx scripts/audit-recs.ts          # asserts every idol × layer shows exactly the top-6 by match value; exit 1 on violation
node scripts/check-completeness.mjs    # asserts every idol has full Tier-2 data; prints 缺照清單; exit 1 on hard gaps
node scripts/fetch-idol-photos.mjs [ids…]  # CC-only photo fetch from Wikimedia Commons (see Photo pipeline)
node scripts/sync-idol-photos.mjs      # links public/idols/<id>.jpg files into catalog.json

# Legacy (need .env.local creds; compute-similarity.ts is stale and excluded from typecheck)
npm run ingest / npm run similarity
```

The app runs **completely without credentials**. `ANTHROPIC_API_KEY` (optional) enables AI-written similarity reasons via `/api/similarity-reason`; without it the route returns local zh-TW fallbacks.

After any catalog data change, the required gate is: `audit-recs` → `check-completeness` → `npm run build`.

---

## Architecture

### Stack
- **Next.js 16** App Router (async `params`: `const { id } = await params;`), **React 19**, **Tailwind v4** (CSS-first config in `globals.css` `@theme`, no tailwind.config), Orbitron + Noto Sans TC fonts. Y2K visual system: deep magenta `#1a0028` bg, `--pink #ff00cc` / `--cyan #00e5ff`, `.window-frame`/`.title-bar` OS chrome.

### Data model — one JSON, two shapes
All data lives in `src/data/catalog.json` (**~355 idols**; the batch roadmap lives in the user's project memory, not the repo). Each artist has a five-view zh-TW `profile`: `overview` + `aesthetic`/`personality`/`performance`/`content`, each with `vibe`/`trait_tags`. **Two depth tiers:** Tier-2 (most idols) is tags/vibes only; **Tier-1 (~84 idols)** additionally have a long-form `analysis` paragraph on each layer plus dual-track aesthetics — `aesthetic.official` (verified brand deals/red carpet) and `aesthetic.personal` (airport/IG style), rendered as ◆官方造型/◇私服風格 sub-blocks in `AestheticSection`. Categorization: group members have `group` set + a `k-pop boy/girl group` genre; **soloists have `group: null`** (→ "Solo" filter); **日系 groups carry a `j-pop` genre** alongside the boy/girl-group tag. `genderOf`/`positionsOf` in `src/lib/browse.ts` derive the 性別/定位 filters from these fields.

**The catalog must never be imported client-side.** Client components receive `ArtistLite` (`src/lib/lite.ts` — id/name/photo/gender/positions/generation) via props from server components (`getAllArtistsLite()` in `src/lib/data.ts`). Artist pages precompute the five per-layer top-6 recommendation lists AND per-candidate personalized-reason strings server-side (`src/app/artist/[id]/page.tsx`) and pass them down; `SimilarSection` only switches between precomputed lists. This keeps page payload constant as the catalog grows.

### Similarity engine (`src/lib/similarity.ts`)
4-layer Jaccard scoring (aesthetic/personality/performance/content) with per-layer weights. Ranking has deterministic tie-breaks: layer score → overall DEFAULT_WEIGHTS similarity → popularity → id. There is **no score cutoff** — `scripts/audit-recs.ts` guarantees six cards always render. Content scoring is split-pool: `lifestyle_topics` ×0.65 + `value_topics` ×0.35 + tone bonus. Dual-track aesthetic tags join the 美學 token pool.

**Controlled vocabularies — exact-token matching means new artists MUST reuse existing tokens** (mixing languages or inventing synonyms silently zeroes similarity):
- `energy_type`: warm | mysterious | calm | high energy · `fan_interaction`: parasocial-close | formal | hype | playful | 4D-quirky | aegyo-forward | mischievous-charming · `dance_style`: powerful | fluid | rhythmic | precise | theatrical fluid · `content_tone`: intimate | aesthetic | hype | comedic
- `lifestyle_topics` (zh): 時尚 美食 遊戲 健身 旅遊 動物 藝術 攝影 音樂創作 美妝 居家日常 戶外活動
- `value_topics` (zh): 自信表達 心理健康倡議 真誠待粉 家庭觀 努力哲學 自我認同 公益環保 幽默自嘲 專業職人精神 自由奔放 正向思考
- All aesthetic/trait/vibe strings are 繁體中文; `roles` are English (`main vocalist`, `leader`, `maknae`…), mapped to zh display via `zhTrait()` in `src/lib/cardMeta.ts`.

### Personalization rules (user-confirmed product decisions)
- `kstar:prefs` in localStorage holds `topIdols` (4 ids) + `weights`. Onboarding picks them; the 圖鑑's 「＋」 button swaps an idol in, rotating out index 0 (oldest), then dispatches `kstar:prefs-updated`.
- Personalized reasons (「因為你喜歡的X也愛…」) appear ONLY on pages of the user's four picks, anchored ONLY to that page's idol; every other page shows pure similarity reasons.
- 人氣/followers are never displayed (popularity is internal ranking/sort data only).

### Page/component map
- Home: the 인생네컷 four-cut strip is THE hero and selling point — do not let new sections compete with it. `IdolDirectory` (`#idols`) below filters by 性別/世代/定位 via precomputed lite fields (`matchesLite` in `src/lib/browse.ts`).
- Artist page: header (photo, IG icon when `instagram` handle set — only verified handles, never guessed) → `ProfileExplorer` (one shared pill state 全部/美學/個性/表演/內容 drives both the analysis card and the rec list) → `SimilarIdolCard` grid (two-zone card: photo top; info panel with emoji tags from `cardMeta.ts`, reason line, 4-color per-layer match bars; on touch devices lines 3-4 expand on first tap).
- SSR guard for localStorage readers: `useState(false)` + `useEffect(setMounted)` pattern; cross-component sync via the `kstar:prefs-updated` event.

### Adding & upgrading idols (the batch pipeline)
Adding idols is a `node` patch script over `catalog.json` (templates live in `/tmp/kstar-batch*.js`): a 23–24-field row → a helper builds the full five-view profile. Rules learned the hard way:
- **Reuse exact controlled-vocab tokens** (see above) — inventing synonyms silently zeroes similarity.
- **Unique ids** — suffix collisions (`mark-got7`, `chaeyoung-fromis`, `maya-xg` vs `maya-niziu`, `j-stayc`). The patch loop skips dups, so a collision = a silently-missing idol.
- **`name_zh` MUST be web-verified, never guessed.** Idol Chinese/kanji names are error-prone; a research pass (Chinese Wikipedia member tables + Taiwanese media) catches wrong surnames and wrong hanja every batch (e.g. STAYC Isa, fromis Jiwon, the entire 日系 roster). Workflow: draft with romaji/best-guess → research-agent returns an id→繁中 map → a fixup script overwrites `name_zh` → scan for garbled chars (`[�<>가-힣]`) → gate.
- **Tier-1 upgrades** are a separate merge that adds the `analysis` paragraphs + `official`/`personal` dual-track. Content is **web-verified**: name ONLY real, confirmed brand deals; OMIT unverified ones (no inventing brand ambassadorships/quotes for real people — the original 44 omitted debunked deals on purpose).
- Former/departed members are kept as discovery nodes (the app shows no roster status); only drop someone for a genuine reason (e.g. a withdrawal under controversy).

### Photo pipeline (`public/idols/`)
Policy: **Wikimedia Commons free licenses only** (CC0/CC BY/CC BY-SA/PD). News sites and Instagram are copyrighted — not "free" even when not fancams — so they are out of bounds for the repo; gaps get hand-dropped officials instead. Per-photo attribution is recorded in `public/idols/attribution.json`. Idols without a photo render gradient-initial cards (`Thumb`); `image_focus` (0–1, default 0.3) keeps faces at consistent height via object-position and survives re-syncs.

**Commons has a ~30–40% wrong-person rate** — it has served a Porsche (S.Coups), a snooker champion (Jun), Pope Leo XIV (Leo of BE:FIRST), a daylily flower (Crush), a DDLC cosplayer (Jo Yuri), a road sign for a Polish village (STAYC Sumin), and group/duo shots where no single subject is identifiable. So the fetch→commit flow is **non-negotiable**: `fetch-idol-photos.mjs [ids]` → read EVERY downloaded `.jpg` as an image and visually confirm identity → reject wrong-person AND group/duo shots → delete rejects' `attribution.json` entries → `sync-idol-photos.mjs` → gate → commit. Filename keywords catch the obvious misses; only the eyeball catches a same-named different person. To recover idols generic search misses, probe Commons for the exact `File:` title then download it directly (worked for CL, Minzy, the Super Junior veterans). `check-completeness.mjs` prints the 缺照清單 of idols still awaiting photos.
