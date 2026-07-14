# KStar 追星證 Wizard — Design Spec

**Date:** 2026-07-13
**Status:** Design ratified in brainstorm; awaiting spec review → implementation plan.
**Scope:** Redesign the KStar onboarding into a guided, full-page "issuing authority" wizard whose output is a shareable 追星證 (fan ID). One vertical slice: the navigation/experience redesign + the card + the cheap viral scaffolding. Motion follows the existing camera/四格 language.

---

## 1. Goal & problem

The current site drops first-time visitors straight onto a busy personalized home (人生四格 hero + 圖鑑) with the onboarding in a modal. Two problems:
1. **Navigation isn't intuitive / doesn't look simple at first glance** — the home competes with itself; the wizard is cramped in a dialog; the 應援卡 (fan card) is buried as a modal tab.
2. **The artifact is shareable but not viral** — no closed share loop, no re-trigger, no flex.

**This redesign** turns the flow into a Mixtape-style full-page wizard with a clear ceremony arc, defers the 圖鑑 to after the flow, and makes the fan card the flow's finale.

## 2. Narrative spine — 發證機構, not 後援會

KStar is framed as an **issuing authority**: the user applies for *their own* 追星證 (fan ID), not membership in any group's fan club.

**Why this spine (validated by 4 zh-TW research reports):**
- The product's premise is a **cross-group TOP 4**. 後援會 (fan club) is per-artist by definition and would side with 唯粉 (single-idol) loyalty — the exact model the product breaks. A fan *ID* certifies *you as a 追星人*, which is inherently multi-group.
- Research kill-reasons for a literal 後援會/入會 framing: (a) real 入會 is serious (audit tiers, payment, passport-name verification) — a click-through "membership" reads as 輕浮/cheap; (b) fan communities are hyper-alert to 官方 vs 山寨 — pseudo-official framing is a **trust** risk; (c) 會員編號/期數 derive meaning from scarcity/seniority — handing everyone one reads as 東施效顰.
- Fans *do* love institutional-parody artifacts **when the institution is the hobby itself, not a fandom** — 追星準考證, 學生證 generators, ktestone result cards all prove it. So the ceremony arc survives; the single-fandom implication dies.

**Ceremony arc (the through-line):** 申請 → 審核 → 判定 → 發證 (Apply → Assess → Determine → Issue). This maps 1:1 onto a photobooth session (pose → shoot → develop → print), which is why the camera motif *is* the spine (see §6).

## 3. Information architecture

```
/            first visit → minimal landing (poster)
             returning    → personalized home (人生四格 hero + 圖鑑; features live in header nav)
/start       the wizard (4 steps, URL-tracked: /start?step=2)
/types       型別圖鑑 — the 16-type index (all public, yours highlighted)
/artist/[id] unchanged
```

- First-visit detection stays `localStorage` `kstar:onboarding` (as today). Finishing the wizard OR taking the landing's escape link flips it to `done`.
- The old modal `Onboarding.tsx` retires; its picker/quiz state machines are **re-homed** into route pages under `/start`.
- `IntroSplash` (photobooth splash) plays only before the landing on true first entry (or `?intro=1`).
- Every wizard step has its own URL so refresh/mid-flow-exit resumes cleanly (a key advantage of the full-page route over the modal).

## 4. The wizard

Persistent chrome on every step: KStar logo; **stepper 1–4 with checkmarks**; Back/Next fixed at bottom; Next disabled until the step's requirement is met.

### Step 0 · Landing (first visit only)
Mixtape discipline: logo, **one finished 追星證** floating at a slight tilt (pre-populated sample TOP 4 + archetype chrome-code + rarity, so the payoff is legible before commitment), one CTA 「開始建立追星檔案」, footer — nothing else. A handwritten note: 「三分鐘,領取你的追星證」 sets the ≤90s + deco expectation honestly. Small escape link 「先逛逛偶像圖鑑 →」 marks onboarding done and routes to home (nobody is ever trapped; satisfies "圖鑑 exists after the flow").

### Step 1 · 建立本命欄 (申請 / Apply)
- Empty **binder page with 4 equal slots** at top — the persistent artifact begins.
- Below: search bar + browsable photo grid (性別/世代 filter chips, paginated). Reuses `IdolDirectory`'s lite-field filtering, but **picker-skinned**: photo + name only, no profile links.
- Tapping an idol **soft-develops** their 小卡 into a slot (no flash). Tapping a filled slot removes it; drag / tap-tap to rearrange — the 排版 ritual, which also kills any implied ranking.
- **4 slots are visually equal** (research: 本命卡 placement carries emotional hierarchy — an implied ranking backfires, "why is my 老公 in the corner").
- Next enables at 4/4. When the 4th card lands → **tentpole shutter flash + the strip "prints."**

### Step 1→2 · 顯影 transition
Reuse `DevelopFourCuts` (the instant-camera develop) as the "application photo" being developed.

### Step 2 · 追星風格測驗 (審核 / Assess)
- Rank the 4 layers (入坑優先序), then adaptive Q1–Q9 (existing `SoulQuiz` logic, re-homed).
- The binder shrinks to a **corner thumbnail** — artifact stays visible.
- **Each question card soft-develops in** (no flash); the strip "develops" in the corner like posing between shots. Per-question progress dots under the stepper make "required" feel bounded and short.
- Mid-flow exit: the 4 picks are saved; returning resumes at step 2.

### Step 3 · 判定結果 (判定 / Determine)
- Full-screen archetype reveal: 16-type chrome code + fan-voice name, 隱藏面 line, layer bars (existing `TastePortraitCard` content).
- **New social-invitation block:** 速配同擔 + 互補型, wiring the already-built `soulmateCodes` / `expandCode` / `compatibilityPct` into the UI (the "find your kind" invitation mechanic).
- The reveal uses the print-emerging develop (soft, no flash). Next: 「領取我的追星證 →」.

### Step 4 · 領取追星證 (發證 / Issue)
- **Tentpole moment:** 「製卡中…」 → **shutter flash + the card develops in + a foil-stamp/laminate flourish** (hybrid print language: photo develop married to 證件 stamp).
- The certificate (see §5) slides out with serial, 發證日期, barcode, guilloché — parody-formal, **no fake 期數/membership tiers** (research: reads as 東施效顰).
- Two optional customizations:
  - **本命曲:** iTunes Search API (keyless, zero-credential — fits the site constraint); song title + artwork printed on the card.
  - **咕卡 deco:** sticker tray mirroring the three real material types — 字母/姓名貼, 緞帶/框線貼, 暱稱哏圖貼 (research: generic stickers feel off; these read as "what I already do").
- **One-tap export** — 9:16 限動 size (new) + the card ratio — via the existing hardened `exportImage.ts`. Then 「進入我的追星基地 →」 routes home.

## 5. The 追星證 card architecture

**Layout: hero + lineup** (like a real fan ID / 準考證 — one hero photo + supporting detail; one focal point, so it never crowds):
- **Hero** — one spotlighted 本命 (large, the postable face), user picks which of their 4 (default = lead pick). Picking a 本命 is itself a beloved ritual, and it's the place hierarchy is *allowed* (the home four-cut stays deliberately equal).
- **陣容 strip** — the other 3 as small 小卡; keeps the cross-group taste visible and honest to how the archetype was computed (from all 4 picks' cohesion). Visually much lighter than the hero — supporting, not competing.
- **Rail** — the 16-type chrome code + type name + **rarity badge**.
- **持卡人 name line** — optional free-text (like today's fan-name field); collapses entirely if empty. Defaults: shown in Version A (本人版), hidden in Version B (純分享版), toggleable in both.
- **本命曲** line — optional; collapses entirely if empty. The picker plays **30-sec previews (▶)** via the iTunes `previewUrl` (keyless) so users confirm the right version before printing it.
- **QR footer (P0)** — 「掃碼做你的」 short URL/QR that deep-links to `/start`.

**Two versions from one layout (a switch, not two designs):**
- **Version A (本人版 / ID mode):** the user's uploaded, cropped photo sits as a small 「本人」 ID badge on the hero's corner (as today's `FanPassCard` does — photo never leaves the browser).
- **Version B (純分享版 / clean):** the same layout with that badge dropped. About your taste, not your face.

Export offers both. The card supersedes today's single-idol `FanPassCard` (which is idol-centric with the fan's face central) by making the fan photo optional and adding the lineup + type + rarity + loop.

## 6. Motion language — the booth is the issuing machine

The camera/四格/printing motif is the spine, not decoration: a purikura booth develops your shots and prints your official 追星證.

**Reuse, don't rebuild** (from the animation inventory):
- **`cut-develop`** keyframe (~0.55–0.7s `--ease-out-expo`, a photo ramping from blown-out flash to normal) is the core primitive. Already proven shape-agnostic (photo cuts *and* the landscape card via `.pass-develop`). Extend it to the currently-flat steps.
- **Extract `DevelopFourCuts`** (camera body → REC blink → lens glint → strip prints → shutter flash → cuts develop, ~4.4s; currently hardcoded to a 4-grid) into a **parameterized booth component** reused across steps.
- **Flash policy:** tentpole flashes only — the strip completing (step 1) and the final print (step 4). Everywhere else: soft, no-flash develop (`fc-redevelop` + `fc-sheen` + `fc-glow` grammar).
- **Accessibility:** reduced-motion is off by product decision; photosensitivity is handled by the existing **in-app consent gate** (shutter vs. calm). The wizard's 2 tentpole flashes hook into that gate — do NOT rely on `prefers-reduced-motion`.
- **Fix the off-motif gaps:** the quiz gets soft-develop per question; the result/share cards get a develop-in they currently lack.

**Constraints:** no animation library (pure CSS `@keyframes` + `setTimeout` phase machines); coordinate with the splash via the existing `kstar:intro-done` event + `window.__kstarIntroPlaying` flag; any new export target must follow the `exportImage.ts` recipe (`skipFonts`, `includeStyleProperties` allowlist, img-decode wait, 3× retry, pad margin).

## 7. Growth layer

**In this build (cheap, high-ROI):**
- **Loop-closure (P0):** the QR/short URL on every card deep-links to `/start`. The card becomes a door, not a dead end. Non-negotiable.
- **Rarity, always-flattering:** each type shows its population share (from `calibrate-archetypes.ts` distribution), framed as a badge no matter what — rare types flex 「4% 稀有型別」, common types read 「主流大勢」, never a demotion.
- **應援-tag:** the hero 本命 doubles as the tag target, giving sharing the "doing it for them" double motive. Falls out of the hero+lineup layout.

**Deliberately deferred (user's scoping calls — ceiling capped by choice, not oversight):**
- **生咖/birthday re-trigger → parked.** Would need verified birthdays for ~355 idols (no data exists; same web-verify grind as `name_zh`). This was the biggest "wave" mechanic — its absence means the card stays largely one-and-done.
- **Seeding → organic / later.** No cold-start distribution plan in this slice.

## 8. Copy system

- **Validated TW-native vocab (use):** 本命, 入坑, 小卡, 咕卡, 應援色, 應援物, 手幅, 燈牌, 唯粉, All飯, 大勢, 生咖.
- **Hard blocklist (支語 / stiff / official-claiming):** 拉踩, 控評, 反黑, 塌房, 泥塑, 打榜, 內卷, 隊推/團推, 站姐, 後援會入會, 官方認證.
- **Naming rules:** the card is always **追星證** (en: FAN ID); idol photocards are always **小卡** (never standalone 應援卡 — ambiguous in TW). Tone: sincere-playful 揪團 voice, never corporate/官方.
- **Archetype names already exist** in `src/lib/archetypes.ts` (16 fan-voice zh names + taglines, above-average quality). Remaining **polish task** (small): de-collide the two 共鳴 names (頻率共鳴控 / 真實共鳴派), punch up the flatter ones (氛圍生活家, 靈魂全方位, 完全巨星型), and **native-reader 支語 check** on 六邊形戰士 and 炸場 (cross-over mainland terms) before they hit the card.

## 9. Component reuse / re-home map

| Concern | Existing | Action |
|---|---|---|
| First-visit routing | `kstar:onboarding` localStorage | keep; flip on finish/escape |
| Picker grid | `IdolDirectory` + `ArtistLite` | reuse filtering, picker-skin (no profile links) |
| Develop transition | `DevelopFourCuts` | extract → parameterized booth component |
| Develop primitive | `cut-develop` / `.pass-develop` | extend to quiz + result cards |
| Quiz | `SoulQuiz`, `questionnaire.ts`, `tokenStats.ts` | re-home into `/start?step=2` |
| Archetype reveal | `TastePortraitCard`, `archetypes.ts` | reuse; add social block UI |
| Social block | `soulmateCodes`/`expandCode`/`compatibilityPct` | wire into UI (built, unwired) |
| Card | `FanPassCard` | supersede → hero+lineup, optional photo, rarity, QR |
| Export | `exportImage.ts` | reuse; add 9:16 output |
| Home entry | `SoulPortraitButton` | rename → visible 追星證 chip |
| **New** | — | `/start` route, iTunes API route, deco sticker library, rarity computation, QR/short-link, foil-stamp motion, 9:16 export |

## 10. Build order (for the implementation plan)

- **P0 — shippable slice:** `/start` route + 4 steps (picker, develop transition, quiz re-home, reveal, card) with the booth motion; hero+lineup card (both versions); rarity; **loop-closure QR**; 9:16 export; landing + returning-home changes; **header nav redistribution** (home slims to hero + 圖鑑); copy guardrails.
- **P1 — fast-follows:** **`/types` 型別圖鑑 page** (static render from `ARCHETYPES` + calibration distribution; header link ships with the page, never as a dead link); iTunes 本命曲 picker; 咕卡 deco stickers; social-invitation block polish; archetype name polish pass.
- **P2 / parked:** 生咖 birthday editions (needs birthday-data pass); seeding plan.

## 11. Late-ratified decisions (2026-07-13, post-review)

- **Four-cut product name: 人生四格** (owner's call). The intro's "SOULCUTS / 靈魂四格" wordmark updates to match during implementation.
- **Existing users (live site, `kstar:onboarding=done`): invite chip → shortcut path.** Returning home shows a 「領取你的追星證」 chip that deep-links into `/start` but skips completed stages — picks kept; quiz only if missing; straight to 發證 if an archetype is stored. Nobody re-does work; the existing base gets the card + QR loop.
- **Home modal tabs: 限動卡 + 完整報告 + 追星證.** The 限動卡 (story card) survives as its own artifact after the questionnaire; the new 追星證 replaces only the old 應援卡 tab.
- **Native nav redistribution (owner-ratified).** Features live in the header, not chips piled on the hero: 偶像圖鑑 · **型別圖鑑** (new) · ♥ 我的收藏 · **🪪 我的追星證** (opens the 3-tab modal). Home slims to the 人生四格 hero + 圖鑑 only. 重新測驗 lives inside the modal and on `/types` — never on home. The existing-user 「領取你的追星證」 invite chip is the one exception (temporary; disappears once claimed).
- **`/types` 型別圖鑑 (owner-ratified): all 16 archetypes fully public, MBTI-style.** A grid of mini type-cards (chrome code + 型別名 + tagline + rarity %), the viewer's own type highlighted, 速配同擔/互補型 badged — so the three codes printed on the 追星證 finally link somewhere, and friends can compare types. Every card carries 「這是你嗎?→ 測測看」 → `/start`, making the index the viral loop's **second entrance** (especially for visitors who took the 圖鑑 escape hatch). Deliberately NOT browsable from inside the wizard — the reveal's surprise is preserved by placement, not gating.

## 12. Implementation notes (surfaced during design, don't lose these)

- **Deco sticker assets** must be created/sourced — the three material types (字母/姓名貼, 緞帶/框線貼, 哏圖貼) need actual graphics, under the same license discipline as idol photos (free-license or self-made only).
- **QR/short-URL mechanics:** decide which production URL the QR encodes (the deployed Vercel domain vs. a short domain) and how QR generation happens (build-time per-card vs. a static `/start` QR). The QR must survive the 9:16 export pipeline legibly.
- **Prefs-parsing hardening:** during live testing, `SoulPortraitButton` rendered 「我的追星靈魂 · undefined」 when prefs were malformed (synthetic seed data, but old real prefs could plausibly do the same). Add a defensive fallback wherever the archetype name renders from stored prefs.
- **iTunes API flakiness:** the picker needs a graceful empty/error state (search can fail; `previewUrl` is sometimes absent — hide ▶ when missing).
- **Archetype tagline length budget:** code taglines are full sentences; the card face may need short-form variants (decide per-type during the P1 name-polish pass).
- **EN archetype names:** whether the English name appears on the card (or stays a flourish elsewhere) — decide during card implementation; zh name + code are the committed payload.

## 13. Future growth ideas — recorded, NOT committed

Deliberately unranked; none block P0/P1. Revisit after launch data.

- **Comeback/打歌期 limited card skins** — the cheaper cousin of the parked 生咖 hook (needs comeback dates for ~30 groups, not 355 idol birthdays). A re-trigger + collective moment.
- **Launch timing as a wave** — time the public launch to a major comeback week/anniversary so "everyone tests the same week" (research: viral tests ride collective moments).
- **「We share 2!」 mutual-overlap comparison** — compare two users' TOP 4 overlap; needs a card-compare mechanism.
- **Tag-a-friend / find-同型 mechanic** — an interactive action beyond displaying 速配/互補 codes.
- **Wallpaper / print-oriented export sizes** — 手機桌布 sizing and a print-shop-friendly output (fans print custom cards at 全家); research says artifacts that "leave the site" resonate hardest.
- (Pre-existing backlog, tracked elsewhere: `recWeightMask` rec re-ranking, Supabase auth/sync, Spotify ingestion, EN toggle.)

## 14. Out of scope / open items

- 生咖 birthday hook and seeding (parked, §7).
- Cross-border / EN localization (TW-only by choice; caps ceiling).
- All copy strings pending a final zh-TW pass against §8 guardrails.

## 15. Data-safety & project rules

- No catalog data written in this slice except the (deferred) birthday pass, which — if/when done — follows the read-only-source + enriched-output rules and web-verifies every `name_zh`-adjacent field.
- Any new `WordEntry`/card field stays in sync across Pydantic / SQLite blob / TS types / mock per the schema contract.
- Per owner's standing rule: **do not commit/push/merge** — this doc is for review; implementation stops at a printed summary.
