# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Important:** This is Next.js 16 with React 19. APIs differ from training data. Read `node_modules/next/dist/docs/` before writing unfamiliar Next.js code.

> **Live site:** the canonical, user-confirmed Vercel URL for this project is **https://kstar-soulcuts.vercel.app/** (owner-stated 2026-07-15). Use this URL — not a `git ls-remote`/API-derived preview-deployment URL — whenever checking or comparing against "what's live."

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
node --env-file=.env.local scripts/fetch-flickr-photos.mjs [ids…]  # same, from Flickr (needs FLICKR_API_KEY — now PRO-only)
OPENVERSE_TOKEN=… node scripts/fetch-openverse-photos.mjs [ids…]   # same, from Openverse (keyless; aggregates Flickr CC + Wikimedia + more)
node scripts/sync-idol-photos.mjs      # links public/idols/<id>.jpg files into catalog.json
node scripts/gen-token-stats.mjs       # regenerates src/lib/tokenStats.ts (IDF token counts) — re-run after any catalog change
npx tsx scripts/calibrate-archetypes.ts # re-tunes 追星靈魂 SCALE/FLOOR/HIGH_THRESHOLD against the live score distribution
npx tsx scripts/smoke-soul.ts          # smoke-tests the archetype engine on sample picks (coherent vs diverse)

# Legacy (need .env.local creds; compute-similarity.ts is stale and excluded from typecheck)
npm run ingest / npm run similarity
```

The app runs **completely without credentials**. `ANTHROPIC_API_KEY` (optional) enables AI-written similarity reasons via `/api/similarity-reason`; without it the route returns local zh-TW fallbacks.

After any catalog data change, the required gate is: `audit-recs` → `check-completeness` → `npm run build` (and re-run `gen-token-stats` so the questionnaire's IDF weights stay in sync).

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

### 追星靈魂 (taste archetype) & 入坑問卷 (adaptive questionnaire)
A 16-type MBTI-style result **derived from the user's 4 picks**, not a separate quiz. Onboarding flow: pick 4 → 人生四格 reveal → opt-in CTA → rank the 4 layers (入坑優先序) → adaptive questions → shareable 追星卡.
- **Server boundary**: `getPickSummaries(ids)` in `data.ts` (+ `POST /api/pick-scores`) returns, per pick, its **mean pairwise layer cohesion vs the other 3 picks** (intra-pick cohesion = your taste's defining axes) plus a small token summary. Cached to `kstar:pick-summaries`. The catalog never reaches the client; everything downstream runs on these summaries.
- **`src/lib/archetypes.ts`** — `getArchetype(picks, weights)`: `score[L] = scaledStrength × recurrence × (1 + onboardingWeight)` per layer; `≥ HIGH_THRESHOLD` → that layer's letter is UPPERCASE. Code order is **A·P·S·R** (美學/個性/表演/內容) → one of 16 `ARCHETYPES`. Also `soulmateCodes` (Hamming-1), `expandCode` (complement = 互補/discovery), `compatibilityPct`, `wallClimbType` (hidden face → 1-high purist), `recWeightMask` (UPPERCASE ×1.5 / lowercase ×0.7 — **built but not yet wired into recs**). Calibration constants come from `scripts/calibrate-archetypes.ts`; the raw per-layer Jaccards differ ~5× in magnitude (denim aesthetic ~0.12 vs exact-match personality ~0.59), so each is normalised to its own p90 before thresholding.
- **`src/lib/questionnaire.ts`** — Q1–Q7 fan-voice defs (controlled-vocab tokens underneath), `rankToWeights`, IDF via `tokenStats.ts`, and the four adaptive mechanics: **pick-grounded framing** (names a pick), **weight-driven depth** (`selectQuestionIds` skips low-ranked layers' questions), **confirm-or-refine** (`agreedToken`/`agreedMood` when ≥3 picks agree), **outlier** (`energyOutlier` → 隱藏面 flavour). Q7 = **7 visual moods** (`MOODS`/`MOOD_TOKENS`, base-token substring + accent-colour match, intentionally ignoring near-universal 白/黑).
- **Share card**: `TastePortraitCard.tsx` (the screenshot target: chrome code, hero name, 隱藏面 line, 4 mini photocards, layer bars, discovery loop) rendered inside `SoulQuiz.tsx` (flow) and re-opened by `SoulPortraitButton.tsx` (persistent home entry, **portaled to `document.body`** — a `position:fixed` modal inside the desktop hero's `-translate` transform collapses otherwise). PNG export via `html-to-image`: **must** pass `skipFonts`/empty `fontEmbedCSS` (the full Noto Sans TC face is ~22MB and stalls rasterisation) **and** `includeStyleProperties` (an allowlist — otherwise Tailwind v4's hundreds of inherited custom properties make export take 10s+); also waits for `<img>` decode + retries 3×, with a screenshot fallback.
- `UserPrefs` gained optional `layerRank` / `tokenPrefs` / `hiddenFace` / `archetype` — all readers parse leniently, so they're backward-compatible.

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
Policy: **free licenses only** (CC0/CC BY/CC BY-SA/PD/US-Gov). Three fetchers share one disambiguated query map (`scripts/_idol-search.mjs`): **Wikimedia Commons** (`fetch-idol-photos.mjs`, no key), **Flickr** (`fetch-flickr-photos.mjs` — but Flickr now gates API keys behind PRO, so this is effectively dormant), and **Openverse** (`fetch-openverse-photos.mjs`, the practical second source — keyless, aggregates Flickr CC + Wikimedia + museums). All license-gate to the no-NC/no-ND set (CC BY / CC BY-SA / CC0 / PD). Openverse throttles hard: anonymous is ~20 req/min, 200/day, so the script spaces requests 3.5s apart with 429-backoff; an `OPENVERSE_TOKEN` (free, no PRO — register via `/v1/auth_tokens/register/`) helps once email-verified. Every source is noisy, so the eyeball-every-file rule is unchanged; non-Commons attribution rows carry a `"source"` field (`"flickr"` / `"openverse:<provider>"`). Watch for sequence-numbered group-event files (e.g. `&TEAM showcase 03`) — the number is NOT a member index, so the member identity is unverifiable; reject those. News sites and Instagram are copyrighted — not "free" even when not fancams — so they are out of bounds for the repo; gaps get hand-dropped officials instead. Per-photo attribution is recorded in `public/idols/attribution.json`. Idols without a photo render gradient-initial cards (`Thumb`); `image_focus` (0–1, default 0.3) keeps faces at consistent height via object-position and survives re-syncs.

**Commons has a ~30–40% wrong-person rate** — it has served a Porsche (S.Coups), a snooker champion (Jun), Pope Leo XIV (Leo of BE:FIRST), a daylily flower (Crush), a DDLC cosplayer (Jo Yuri), a road sign for a Polish village (STAYC Sumin), and group/duo shots where no single subject is identifiable. So the fetch→commit flow is **non-negotiable**: `fetch-idol-photos.mjs [ids]` → read EVERY downloaded `.jpg` as an image and visually confirm identity → reject wrong-person AND group/duo shots → delete rejects' `attribution.json` entries → `sync-idol-photos.mjs` → gate → commit. Filename keywords catch the obvious misses; only the eyeball catches a same-named different person. To recover idols generic search misses, probe Commons for the exact `File:` title then download it directly (worked for CL, Minzy, the Super Junior veterans). `check-completeness.mjs` prints the 缺照清單 of idols still awaiting photos.

**Recovery tooling + lessons (2026-06-13 full re-audit).** `fetch-idol-photos.mjs` is **deterministic and resolution-biased** — its ranking can pick a high-res GROUP shot over the correct lower-res SOLO of the member (this is how giselle/kazuha/dk/jeonghan/jongho got group photos), so a blind re-fetch just re-pulls the same wrong file. Two fixes: (1) the cheapest wrong-person/solo tell is the **Commons `File:` title** — a title naming the GROUP ("Aespa at…") is usually a group photo; one naming the MEMBER ("Giselle at…") is usually solo; a title naming a *different* person is a same-name collision (jaehyun→BOYNEXTDOOR, jinyoung-got7→producer J.Y. Park, jeno→cimbalom player). (2) `scripts/_probe-commons.mjs <id> "<query>"` downloads the top ~6 CC candidates to `/tmp/photo-recovery/<id>/` with a `candidates.json` manifest so you (or a per-idol vision agent) can VIEW them and pick the right solo. **`sync-idol-photos.mjs` only LINKS existing files — it never clears a stale `image_url`**, so when you delete a reject you must null its `image_url` in catalog.json manually (else it renders a broken `<img>`, as ruka/chiquita/belle did). Scale verification with a fan-out: a Workflow of 2 perspective-diverse finders per ~20-photo batch (face-match lens + title/composition lens) → adversarial skeptic per flag re-confirmed all 258 photos with 0 false survivors.
