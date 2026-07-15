# KStar Session Summary — 2026-07-14

Everything done in this session, so it's readable from any machine. Covers: the `/soul-types` page, the production-deployment incident and fix, the Figma design system, and the card redesign work in progress.

---

## 1. Repo map (read this first — it's the #1 source of confusion)

There are **two separate git histories** for what looks like one app:

| Repo | Path | Branch | What it is |
|---|---|---|---|
| **kpop-discovery-clean** | `/Users/work/Documents/kpop-discovery-clean` | `main` | The "official" GitHub-connected repo (`github.com/syuan-sps/kstar`). Has `/soul-types` but **not** the FanID wizard. |
| **kstar-i18n** | `/Users/work/Projects/kstar-i18n` | `i18n-en` | An agent-driven fork built overnight from a *snapshot* of the deployed app — unrelated git history to `main`. Has the FanID wizard (`/start`, persistent "我的追星證" button, KSTAR SOULCUTS branding) **and**, as of this session, `/soul-types` too. |

**`kstar-i18n` / `i18n-en` is the one that's actually live in production right now** — Vercel's production branch tracking was switched from `main` to `i18n-en` this session (see §3). If you want to keep working on the live site, edit `kstar-i18n`, not `kpop-discovery-clean`.

- Production URL: **https://kstar-soulcuts.vercel.app**
- Vercel project: `kpop-discovery` under team `sxxyuan-3507s-projects`

---

## 2. `/soul-types` — 16 fan-soul types page

New page listing all 16 追星靈魂 archetypes (Omnivore → Hexagonal Warrior), grouped by tier (0–4 "high" axes), reusing the existing archetype engine (`src/lib/archetypes.ts`) and color system. Linked from the footer next to "投稿偶像照片".

**Ported into both repos:**
- `kpop-discovery-clean`: `src/app/soul-types/page.tsx` — committed to `main`, pushed.
- `kstar-i18n`: same file, plus the missing copy keys (`soulTypesTitle`, `soulTypesIntro`, `tierOmnivore`...`tierLegend`, `soulTypesCta`, `soulTypesMissingLabel`, `footerSoulTypes`) added to `copy.zh.ts`/`copy.en.ts` — committed to `i18n-en`, pushed, **deployed to production**.

Live now at **https://kstar-soulcuts.vercel.app/soul-types**, in both 中/EN.

---

## 3. The production incident (what happened, what's fixed)

**What happened:** The `kpop-discovery` Vercel project had **no Git integration** — every previous deploy was a manual `vercel deploy` CLI push from `kstar-i18n`. When I connected GitHub and pushed from `kpop-discovery-clean`'s `main` branch (to get `/soul-types` live), it silently **overwrote the FanID wizard build** with the plainer `main`-branch codebase — no wizard, no persistent Fan ID button, no EN toggle.

**Fix applied:**
1. Used Vercel's **Instant Rollback** to restore the wizard build immediately (stopgap).
2. Ported `/soul-types` properly into `kstar-i18n` (not `kpop-discovery-clean`) so the two features coexist in one codebase.
3. **Switched Vercel's Production environment branch tracking from `main` to `i18n-en`** (Project Settings → Environments → Production → Branch Tracking).
4. Manually promoted the `i18n-en` build and — important gotcha — **had to separately click "Promote" on the deployment itself** (not just the deployments-list row) because this project has **"Auto-assign Custom Production Domains" disabled**. Without that, a promoted build goes to "Ready" but the `kstar-soulcuts.vercel.app` domain alias never moves.
5. Reverted/cleaned up the leftover uncommitted wizard-port files in `kpop-discovery-clean` (nothing was ever committed there, so `git status` is clean — that repo now only has `/soul-types`, nothing else changed).

**Standing gotcha for next time:** future pushes to `kstar-i18n`'s `i18n-en` branch will auto-*build* on Vercel (Git is connected now) but **will not auto-move the production domain alias** until "Auto-assign Custom Production Domains" is turned on, or you manually click Promote on each new deployment. Worth deciding whether to enable that setting.

---

## 4. Figma design system

**File:** https://www.figma.com/design/Fc0TROoPhsNO5dg4pDVK46 ("KStar Design System")

Built from real tokens read out of `kstar-i18n/src/app/globals.css` (colors, fonts, radii) — not guessed.

**Pages:**
- **Cover** — KSTAR wordmark
- **Foundations** — 18 primitive + 17 semantic color variables (light mode, WEB code-syntax mapped to real CSS var names like `var(--cherry)`), 6 spacing + 7 radius tokens, 5 text styles (Orbitron Black display, Noto Sans TC body), `KStar/Sticker Shadow` effect style
- **Button** — Primary/Secondary × Default/Hover/Disabled (6 variants), editable `Label` property
- **IdolCard** — the photocard used in the directory grid, with `Name`/`NameZh`/`Group` text props + `Favorited` boolean
- **Header Nav** — logo + search + nav pills, matches the real header
- **Window Chrome** — the brushed-silver title-bar/OS-frame shell used in modals and the quiz wizard
- **Redesign — Fan ID Card** — work-in-progress chrome redesign of the actual Fan ID card (see §5)

No external UI kit was reused — Material 3 / Apple kits / Simple DS were all checked and rejected as style-incompatible with KStar's bespoke Y2K Silvercore aesthetic.

---

## 5. Card redesign — reference moodboards & prompts

**Goal:** elevate the three result-card views — 限動卡 Story card, 完整報告 Full report, 應援卡 Fan pass/Fan ID — toward a "pure mirror-chrome Y2K" material direction, based on 9 reference moodboards the user provided (all converged on **pure liquid-silver chrome objects** — hearts, stars, bows, butterflies, disco balls, balloon letters — no color tint, unlike the app's current blue/cherry-tinted "Silvercore" palette).

### Status
- **Fan ID Card**: first redesign pass built in Figma (page "Redesign — Fan ID Card"). Applied: chrome-gradient border frame, metallic bevel treatment on the "ApSr" archetype code text, chrome heart + sparkle accent icons, photo bottom-scrim caption + corner badge, state-based layer bar (dark = high, light = low). **Known gap:** this was built from visual inspection, not a literal pixel-imported screenshot, so some details may still drift from the live card — see the ready-to-use prompt below to fix that properly.
- **Story card & Full report**: not yet redesigned — same treatment should be applied next.

### The reusable "Edit with prompt" prompt (for Figma AI, applied directly to the real card selection — most reliable path)

> Elevate this Fan ID card into a premium mirror-chrome Y2K collectible, using a pure liquid-silver material system (no color tint — pure chrome/steel, like a metallic balloon or brushed steel object, not the pink/blue Y2K palette).
>
> **Frame & material:** Give the card a visible mirror-chrome gradient border (white → steel gray → dark charcoal → white, diagonal sweep) as its outer edge, like a metal-edged trading card. Keep the inner card body clean white/frost so content stays legible.
>
> **Archetype code ("ApSr"):** Render it with a liquid-chrome bevel — a soft drop-shadow duplicate layer behind the main text, and the main text filled with a vertical silver gradient (bright highlight → mid steel → dark shadow → bright highlight) so it reads as polished metal, not flat gray.
>
> **Corner emblem:** Add one small 3D chrome accent icon — a puffy balloon heart or a 4-point diamond sparkle — placed near the archetype code, rendered in the same mirror-chrome material as the frame. Add a second, smaller sparkle accent on the main photo's corner.
>
> **Rarity badge:** Keep the pill shape but give its border a thin metallic sheen instead of flat gold.
>
> **Photo slots:** Add a subtle dark gradient scrim at the bottom of the main photo with the caption text overlaid directly on it (white text, high contrast) instead of a separate caption below the photo. Add one small chrome badge icon (crown or star) in the photo's top-left corner.
>
> **Layer bar:** Keep the 4-segment bar but render the "high" segment(s) as solid dark chrome and the rest as light silver-gray — a state contrast, not a rainbow of colors.
>
> **What to preserve exactly:** all existing text content, the 3-mini-photocard row, the layer bar's 4 labels (美學/個性/表演/內容), the "互補型" line, cardholder line, and the barcode + QR footer layout — only the material/finish and the chrome accents should change, not the structure or copy.

### Reference moodboard categories (for Higgsfield image generation, if generating standalone icon assets instead of editing in Figma directly)

| Category | Motifs | Best for |
|---|---|---|
| Hearts | Dripping/melted, puffy balloon, wireframe outline, interlocking, chain-link, padlock | Story card hero icon |
| Stars & sparkles | 4-point diamond, 5-point balloon, glitter-textured, shooting star, sunburst | Full report section markers |
| Creatures | Balloon dog, teddy bear, duck, bearbrick, Mario-star | Optional flourishes |
| Nature/food | Butterfly, clover, cherries, strawberry, rose, moon, Saturn/planet | Full report section markers (map one per archetype layer) |
| Luxury/emblem objects | Bow, medallion/brooch, chess king, lips, martini glass, dollar sign, padlock, chain, safety pin, key | Fan Pass emblem/seal |
| Typography | "LOVE" balloon letters, sunburst text-marks | Accent only |

Higgsfield prompt template (swap the bracketed subject per card):
> *"A single 3D-rendered mirror-chrome sticker icon, pure liquid-mercury silver material, no color tint, sharp specular highlights, dramatic studio rim lighting, floating on transparent background, subject: [X], Y2K aesthetic, no text, product-render quality"*

### Recommended next step
Rather than continuing to rebuild the card from visual memory in Figma, use the "Edit with prompt" flow above **directly on the real card selection** in Figma (import the actual screenshot or use Figma's own capture-from-URL/paste-screenshot flow) — this sidesteps the mismatch problem entirely since it starts from the true current design.

---

## 6. Open items / follow-ups

- [ ] Apply the chrome redesign to Story card and Full report (same prompt, adapted)
- [ ] Fix the Fan ID Card redesign's remaining accuracy gaps against the real live card (crown badge icon didn't render as emoji — needs a vector icon instead)
- [ ] Decide whether to enable "Auto-assign Custom Production Domains" on the Vercel project so future `i18n-en` pushes go live without a manual Promote click
- [ ] Longer-term: decide whether `kpop-discovery-clean` (`main`) and `kstar-i18n` (`i18n-en`) should be reconciled into one canonical repo, since right now they're two unrelated histories that happen to both deploy-ish to the same domain
- [ ] Figma design system: Code Connect mappings (link components to real `.tsx` files), more components (archetype result card, four-cut frame, form inputs)
