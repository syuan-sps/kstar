# Soul Story Card Rebalanced Specimen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the editable Figma story-card proposal so the frequency specimen contains its explanatory core readout and the card has a balanced, light collectible rhythm.

**Architecture:** Work only in Figma file `iIv1HPSBwm0oZKrj8UfgwO`, editing frame `22:2` (`SoulStoryCard — Silvercore trend polish (proposal)`). The frequency panel becomes a self-contained three-row specimen; the footer stays a separate closing block. The imported capture and earlier proposal are not changed.

**Tech Stack:** Figma Design, Figma Plugin API through `use_figma`, `get_screenshot` for visual validation.

## Global Constraints

- Preserve the card at 270 x 480.
- Preserve the existing top identity group at x=41, y=24, 188 x 177.
- Keep the light glass panel, subtle technical grid, KSTAR typography, signal-red CTA, and corner stars.
- Do not introduce a dark navy panel, strong colour wash, badges, or production-code changes.
- Keep the imported production capture and prior proposal frames intact.

---

### Task 1: Rebuild the frequency specimen as a three-row readout

**Files:**
- Modify: Figma file `iIv1HPSBwm0oZKrj8UfgwO`, frame `22:2`
- Test: Figma screenshot of frame `22:2`

**Interfaces:**
- Consumes: frame `22:2`; frequency panel `22:35`; its heading and four existing bar cells; text node `22:60` (`入坑核心 · 個性 × 表演`).
- Produces: one translucent-white frequency panel with heading, four bars, and the core readout as its lower row.

- [x] **Step 1: Make the frequency panel 140px tall and position it immediately after the identity block**

Run a `use_figma` script that sets panel `22:35` to x=20, y=218, width=230, height=140. Keep its fill as translucent white and stroke as cool grey.

- [x] **Step 2: Move the frequency title and four-bar row into the top two rows of the resized panel**

Run a `use_figma` script that positions the existing title at 22px from the panel top and the bars at 52px from the panel top. Preserve the existing four labels and bar values.

- [x] **Step 3: Place the core readout inside the panel as its lower row**

Run a `use_figma` script that visually positions text node `22:60` over the panel at 96px from the panel top, centered horizontally. Give it the existing muted cool-grey fill and add a 1px low-opacity divider above the row.

- [x] **Step 4: Validate the specimen**

Run `get_screenshot` for Figma frame `22:2`.

Expected: the panel has three readable rows, no free-floating `入坑核心` line remains in the card body, and all labels remain legible.

### Task 2: Re-anchor the compact closing block and validate full-card balance

**Files:**
- Modify: Figma file `iIv1HPSBwm0oZKrj8UfgwO`, frame `22:2`
- Test: Figma screenshot and metadata of frame `22:2`

**Interfaces:**
- Consumes: resized three-row panel from Task 1 and footer group `22:26`.
- Produces: a visually balanced card with compact, separate header / specimen / footer zones.

- [x] **Step 1: Position the footer as a compact closing block**

Run a `use_figma` script that places footer group `22:26` at x=74.9921875, y=400, preserving its 120.015625 x 32 dimensions. This keeps the card visually balanced while leaving its corner star and chrome border clear.

- [x] **Step 2: Confirm the frame dimensions and unchanged top group**

Run `get_metadata` for Figma frame `22:2`.

Expected: frame is 270 x 480; top identity group remains x=41, y=24, 188 x 177; the footer remains 120.015625 x 32 at y=400.

- [x] **Step 3: Validate the finished card visually**

Run `get_screenshot` for Figma frame `22:2` at its native aspect ratio.

Expected: the card reads as a light K-pop collectible; the centre is informative rather than empty; no dark corporate panel, overlap, clipping, or oversized lower void is visible.

- [x] **Step 4: Commit the Figma implementation reference**

Run:

```bash
git add docs/superpowers/specs/2026-07-13-soul-story-card-rebalanced-specimen-design.md docs/superpowers/plans/2026-07-13-soul-story-card-rebalanced-specimen.md
git commit -m "docs(plan): detail soul story card rebalance"
```

Expected: Git records the approved design and executable Figma plan without adding unrelated untracked files.
