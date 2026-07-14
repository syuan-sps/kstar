# 16 型別文案優化提案 (overnight, 2026-07-14)

**Status: PROPOSALS ONLY — no code touched.** Sources: two Sonnet research passes (rename drafting + web-verified 支語 check). Final calls are the owner's; my recommendation is marked ★ per item. Apply during the P1 "archetype name polish" task; renames only touch `zhName`/`tagline` fields in `src/lib/archetypes.ts` (the structures index by code, not name — verified).

## 1. 支語 verdicts (web-verified, with sources in the research)

| 詞 | 風險 | 依據 | 處置 |
|---|---|---|---|
| **六邊形戰士** (APSR) | **低 — 可保留** ★ | udn/中時體育版用了近十年;invade.tw 支語字典查無;找不到任何「這是支語」的公審串。屬日本雷達圖梗經兩岸共同吸收,非替代型支語。 | 保留原名。 |
| **炸場** (aPSr 個性炸場王) | **中高 — 建議換掉** ★ | 2018《這!就是街舞》(優酷) 原生術語,中國娛樂工業直接輸出;**找不到任何台灣媒體/PTT/Dcard 自然使用實例**;受眾恰是最敏感族群。 | 改名(見 §2)。 |

**⚠ 這是唯一「必改」項** — 其餘都是 nice-to-have。

## 2. aPSr 個性炸場王 → rename (必改)

研究員給的舞台語境替代詞:嗨翻全場/掀翻全場/全場沸騰。套回名字:

| 提案 | 理由 |
|---|---|
| **個性掀場王** ★ | 最貼近原意(個性先收你,舞台再掀翻全場),「掀場」道地且保留「王」的氣勢。 |
| 個性圈粉王 | 「圈粉」在台媒已普及,但重心偏「吸粉」失去舞台爆發感。 |
| 個性嗨翻王 | 直白,但「嗨翻」放進四字名略口語。 |

Tagline 同步改:「個性先收你，舞台再補一刀」不含炸場 → 不用動。

## 3. 撞名解套:apsR 頻率共鳴控 vs aPsR 真實共鳴派

研究員判斷:改 apsR 一個即可(內容單高,「共鳴」用得較空);aPsR 的 tagline 已講清雙高邏輯,可留。

| 代碼 | 提案 | 理由 |
|---|---|---|
| apsR | **語錄成癮者** ★ | 與 apSr「直拍上癮者」形成 1-high 家族的「上癮」句式對仗(一個吃直拍、一個吃發言),並排即懂。 |
| apsR | 動態秒讀魂 | 「秒讀限動」是真實粉絲動作,亦佳。 |
| apsR | 文字系本命 | 與 Apsr 神顏控形成「顏 vs 字」對照。 |

## 4. 扁平名加強(選改)

| 代碼 | 現名 | 提案 ★=我推 | 理由 |
|---|---|---|---|
| ApsR | 氛圍生活家 | **氛圍感本命** ★ / 美感生活控 / 保留 | 「氛圍感」是台粉高頻自然語;原名其實不差,若求穩可留。 |
| aPSR | 靈魂全方位 | **顏值免疫本命** ★ / 內在控 / 靈魂系全能王 | 「顏值免疫」自嘲梗準確指出「唯獨美學不過線」,記憶點強。 |
| APSr | 完全巨星型 | **全能巨星本命** ★ / 高攻略度本命 / 神台本命 | 「完全」偏書面;「高攻略度」很有梗但偏乙女圈內;「神台」易被誤讀成神明桌,不推。 |

## 5. 16 型短版 tagline (≤12 字, 卡面空間備用)

apsr 什麼都推，全面入坑 · Apsr 一眼淪陷，顏值即正義 · aPsr 愛的是人，不是臉 · apSr 直拍循環，根本停不了 · apsR 句句戳心，像在說你 · APsr 高冷收留，反差擊沉 · ApSr 顏值舞台，雙殺淪陷 · ApsR 美得有質感，暖得剛好 · aPSr 個性先收，舞台補刀 · aPsR 頻率對了，個性補刀 · apSR 台上尖叫，台下融化 · APSr 什麼都有，就是沒空聊 · APsR 站著不動，你就淪陷 · ApSR 顏值舞台全包，個性留神秘 · aPSR 不看臉，只對你的胃 · APSR 零死角，能中的人很少

## Decision checklist — RATIFIED 2026-07-13 (owner: take all ★ picks)

- [x] aPSr 個性炸場王 → **個性掀場王** (必改 — 炸場支語)
- [x] apsR 頻率共鳴控 → **語錄成癮者**
- [x] ApsR 氛圍生活家 → **氛圍感本命**
- [x] aPSR 靈魂全方位 → **顏值免疫本命**
- [x] APSr 完全巨星型 → **全能巨星本命**
- [x] 短版 taglines: 全收 (apsR 短版配合改名沿用「句句戳心，像在說你」)
- 六邊形戰士 (APSR): 保留 (支語檢核低風險)

Apply in the P1 archetype-polish task: update `zhName` fields in `src/lib/archetypes.ts` + add a `shortTagline` field with the 16 short versions. Structures index by code, not name — no logic changes.
