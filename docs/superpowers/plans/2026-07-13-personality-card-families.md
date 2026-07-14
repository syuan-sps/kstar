# Personality Card Families Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create five editable, compact 270 x 480 Soul Story Card family studies in Figma that make each archetype's taste code understandable.

**Architecture:** Use the existing Figma spacing-study file as a single comparison canvas. Each card shares the same outer Silvercore chrome and four text elements, while its one visual indicator changes by family. A readable "你的入坑核心" line replaces the four-bar dashboard.

**Tech Stack:** Figma Design, Figma Plugin API, Orbitron, Noto Sans TC.

## Global Constraints

- Card export frame is exactly 270 x 480.
- Every card includes code, Chinese name, one-line truth, plain-language core, one family-specific indicator, CTA, and footer.
- Do not use the full four-bar frequency panel.
- Use A = 美學, P = 個性, S = 舞台, R = 共鳴／內容; uppercase means a strong driver.

---

### Task 1: Build the shared five-card comparison canvas

**Files:**
- Modify: Figma file `iIv1HPSBwm0oZKrj8UfgwO`

**Interfaces:**
- Consumes: `ArchetypeResult.code`, `archetype.zhName`, `archetype.tagline`, `leadLayer`.
- Produces: Five named 270 x 480 Figma frames: Signal, Collector, Stage, Archive, Orbit.

- [x] **Step 1: Create five exact-size frames in one horizontal comparison row**

Create named frames at 270 x 480 with 48 px gaps. Use the shared white-to-silver gradient, 24 px radius, 2 px translucent accent border, and compact CTA/footer placement.

- [x] **Step 2: Add shared readable content to each frame**

Add a code, Chinese archetype name, one-line tagline, and the label `你的入坑核心：個性、舞台` using Noto Sans TC. Keep the code as a collectible mark, not the sole explanation.

- [x] **Step 3: Verify the canvas**

Capture the comparison row. Expected: five frames are fully visible and each contains no dashboard-style four-bar panel.

### Task 2: Give every family one distinct indicator

**Files:**
- Modify: Figma file `iIv1HPSBwm0oZKrj8UfgwO`

**Interfaces:**
- Consumes: Frames from Task 1.
- Produces: One unique visual indicator per family.

- [x] **Step 1: Add the Signal indicator**

Use one red signal bar for personality-led types.

- [x] **Step 2: Add the Collector indicator**

Use one chrome swatch and specimen-label divider for aesthetic-led types.

- [x] **Step 3: Add the Stage indicator**

Use a single blue spotlight/energy meter for performance-led types.

- [x] **Step 4: Add the Archive indicator**

Use small fan-note index metadata for content-led types.

- [x] **Step 5: Add the Orbit indicator**

Use four small dots/rings for balanced or rare types.

- [x] **Step 6: Capture and inspect all five cards**

Expected: the cards are visibly different at a glance, while the shared information hierarchy remains clear and compact.
