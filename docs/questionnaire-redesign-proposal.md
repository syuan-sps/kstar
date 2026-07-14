# 入坑問卷 redesign proposal — Q8/Q9 + nudge-budget fix

Grounded in `src/lib/questionnaire.ts`, `src/lib/archetypes.ts`, `src/lib/types.ts`, `src/lib/similarity.ts` (performance jaccard: `roles + vocal_type + stage_persona` + dance_style bonus), and `src/data/catalog.json` as of 2026-07-01.

## The core diagnosis (why this matters more than it looks)

`computeQuizResult()` adds `LAYER_NUDGE = 0.12` to a layer's weight for whatever `opt.layer` the user's chosen answer carries. The catch: **Q2, Q3, Q4, Q5, and Q7 are "monochrome"** — every single option in those questions is tagged with the same layer. That means answering them at all guarantees the nudge, regardless of which option is picked:

| Layer | Guaranteed monochrome questions | Guaranteed floor | Conditional-only (via Q1/Q6 mixed options) |
|---|---|---|---|
| personality | Q2, Q3, Q4 | **+0.36, always** | +0.24 more possible (q1 "variety", q6 "comedic") |
| content | Q5 (if shown) | +0.12 if shown | +0.24 more possible (q1 "daily", q6 "intimate") |
| aesthetic | Q7 | +0.12, always | +0.24 more possible (q1 "visual", q6 "aesthetic") |
| performance | **none** | **+0, always** | only +0.24 possible (q1 "stage", q6 "hype") — never guaranteed |

Only Q1 and Q6 actually let the user's *choice* determine which layer benefits. Everywhere else the nudge is a structural artifact of how many questions happen to exist per layer, not a signal about the user's actual preference. Concretely: a user who ranks **personality dead last** (rank weight 0.1) still gets +0.36 baked in and can end up with personality as their *highest* raw weight after renormalization — while a user who ranks **performance #1** (rank weight 0.4) gets zero guaranteed reinforcement and can lose that letter's uppercase status in `getArchetype()` (since that function's `weights` param is this same post-nudge blend, not the raw rank).

This is the real reason performance feels invisible and personality feels overweighted — it's not that performance is less interesting to model, it's that it has zero monochrome questions. Adding performance questions and fixing the nudge mechanism are the same fix.

## Fix 1 — two new performance questions

Two clean controlled vocabularies already exist and are **already used in similarity scoring** (`similarity.ts:61-69`) but never asked about directly:

- `dance_style`: powerful | fluid | rhythmic | precise | theatrical fluid (5 values, exact match)
- `roles`: main vocalist / lead vocalist / vocalist, main dancer / lead dancer / dancer, main rapper / lead rapper / rapper, leader, center, visual, maknae (via `zhTrait()` in cardMeta.ts)

Note: `vocal_type` and `stage_persona` are **not** controlled vocab — they're flavor strings ("killing part king", "philosophical leader") split into loose word-tokens for fuzzy jaccard matching. Not suitable for a forced-choice question; leave them to be inferred from picks only.

**Q8 — 表演/舞台 (dance_style, always-on core, same tier as Q1-Q4)**

> 他的舞台，電到你的是？

| option | sub | token |
|---|---|---|
| 力量瞬間全開 | 一個抓地、全場氣勢瞬間拉滿 | `dance_style: powerful` |
| 絲滑到像流水 | 動作沒有一格是硬的 | `dance_style: fluid` |
| 精準到嚇人 | 每個點都卡在拍子上 | `dance_style: precise` |
| 跟拍點抓到心跳 | 律動感直接同步你的脈搏 | `dance_style: rhythmic` |
| 戲劇張力拉滿 | 舞台像在說一個故事 | `dance_style: "theatrical fluid"` |

**Q9 — 表演/位置 (roles, always-on core)**

> 在團體裡，你的目光通常黏在誰身上？

| option | token |
|---|---|
| 站在最前面、扛團的那個 | `roles: leader` + `roles: center` |
| 主唱擔當 | `roles: "main vocalist"` |
| 主舞擔當 | `roles: "main dancer"` |
| 饒舌擔當 | `roles: "main rapper"` |
| 么弟么妹 | `roles: maknae` |

(Deliberately **excludes** a "visual" option here — that pull is already fully captured by Q1's "visual" option and all of Q7, so this question stays about performance role rather than re-asking aesthetics.)

Both become part of `selectQuestionIds`'s always-on core, matching Q1-Q4 — since performance currently has literally no core question, it shouldn't be gated behind rank the way Q5/Q6 are for content. Once performance has a real floor, you could *also* gate Q9 behind `pos("performance") <= 1` if you want to keep total question count down for users who ranked performance low — flagging as an option, not a requirement.

## Fix 2 — Q3's 7-option overload, without touching the vocab

`fan_interaction`'s 7 values are real, load-bearing controlled vocab used across all 355 idols — trimming the vocabulary itself would hit the similarity engine broadly, not just this one question. The fix is presentational: chunk the same 7 options into 3 labeled visual groups (a well-worn survey-design technique — reduces perceived load without losing fidelity or touching scoring):

- **有點距離** — 王子／女王感的距離 (`formal`)
- **暖到不行** — 寵粉貼到不行 (`parasocial-close`) · 撒嬌可愛攻擊 (`aegyo-forward`)
- **玩心全開** — 調皮愛搗蛋 (`mischievous-charming`) · 天然呆 4D 笑點 (`4D-quirky`) · 嗨翻全場 (`hype`) · 玩心很重 (`playful`)

This only needs a `group?: string` field on `QOption` and a render change in the quiz component — `computeQuizResult` doesn't change at all.

## Fix 3 — layer/token mismatch

Right now `opt.layer` is set by hand per option, independent of which field its `tokens` actually write to. Two examples that currently disagree: Q1's "variety" is tagged `layer: personality` but writes `content_tone: comedic`; Q6's "comedic" is the same case. The nudge and the token land on different layers.

Proposed fix — derive the nudge layer from the token's field via a canonical map, and only fall back to a manual `layer` tag for options that carry **no** token (Q4's contrast/consistent, which are purely `derived` flags):

```ts
const FIELD_TO_LAYER: Record<string, ScoreLayer> = {
  energy_type: "personality", fan_interaction: "personality",
  dance_style: "performance", roles: "performance",
  content_tone: "content", lifestyle_topics: "content", value_topics: "content",
  style_tags: "aesthetic", color_palette: "aesthetic",
};
```

In `computeQuizResult`, when `opt.tokens` is non-empty, nudge `FIELD_TO_LAYER[t.field]` for each token instead of trusting `opt.layer`. This makes Q1/Q6's cross-layer options nudge *exactly* the layer their vocabulary actually belongs to — which also means Q1's "variety" and Q6's "comedic" will (correctly) nudge **content**, not personality, closing part of personality's structural overhang on its own.

## Fix 4 — cap the guaranteed floor so question-count isn't the tiebreaker

Even after Fix 1 and Fix 3, personality still has more *core* questions (Q2, Q3, Q4) than any other layer by construction — that's fine content-wise (real fans do think about personality across three distinct angles: friend-type, fan treatment, contrast-vs-consistent), but the nudge budget shouldn't scale linearly with how many questions happen to exist. Suggested change: normalize nudge contribution per layer to its **share** of that layer's monochrome questions rather than a flat add per question:

```ts
// instead of: w[opt.layer] += LAYER_NUDGE  (flat 0.12 per matching answer)
// use a fixed total budget per layer, split across however many core questions probe it:
const LAYER_NUDGE_BUDGET = 0.30; // same ceiling for every layer, regardless of question count
w[layer] += LAYER_NUDGE_BUDGET / coreQuestionCountFor(layer);
```

With Fix 1 in place (performance goes from 0→2 core questions), this gives every layer 2-3 core questions and a matched ceiling — personality no longer gets 3x the guaranteed weight of performance just because it has 3x the questions.

## Explicitly out of scope (per your answers)

- No Likert/repeated-item rewrite — you confirmed vibes-only, retake-instability-is-fine is the right philosophy, so the forced-choice Buzzfeed-style format stays.
- No new 5th scoring axis — would require re-running `calibrate-archetypes.ts` and redefining all 16 archetypes; bigger than what two new questions + a nudge fix need.
- `vocal_type` / `stage_persona` stay inference-only (not controlled vocab, not fit for multiple-choice).

## Net effect on question count

`selectQuestionIds` currently returns 5-9 ids. With Q8/Q9 added as always-on core: 7-11. If you'd rather not grow the base flow, Q9 (roles) is the safer one to gate behind `pos("performance") <= 1`, same treatment Q5 gets for content — Q8 (dance_style) is cheap enough (5 clean options, no sub-branching) to justify staying always-on.
