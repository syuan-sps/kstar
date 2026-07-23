# Fan ID Theme Customization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four curated visual themes to the Fan ID wizard and carry the selected theme through card, story, report, and share views.

**Architecture:** Store theme tokens and optional asset paths in `src/lib/fanIdThemes.ts`. Keep the existing card information hierarchy and make `FanIdCard`, `SoulStoryCard`, and `SoulReport` consume the same `themeId`; render a swatch picker in `StepIssue` above the live card preview. Sticker assets remain optional and are never required for rendering.

**Tech Stack:** Next.js, React, TypeScript, existing CSS/Tailwind conventions, local PNG assets.

## Global Constraints

- Preserve the existing information hierarchy and card semantics across themes.
- Avoid making the card dependent on sticker placement or transparent-asset quality.
- Keep decoration subordinate to the user’s Fan ID content.
- Use the existing Y2K Chrome treatment as the baseline for shared card structure.
- Keep the first version curated; do not add freeform mix-and-match controls.
- Chrome is the default when no theme is selected.

---

### Task 1: Define the theme model and five presets

**Files:**
- Create: `src/lib/fanIdThemes.ts`
- Test: `src/lib/fanIdThemes.test.ts` if the project test setup supports unit tests; otherwise verify through the TypeScript gate.

**Interfaces:**
- Produces `FanIdThemeId`, `FanIdTheme`, `FAN_ID_THEMES`, and `getFanIdTheme(themeId?: FanIdThemeId)`.
- `getFanIdTheme(undefined)` and unknown runtime values resolve to the Chrome preset.

- [ ] Add typed tokens for surface, border, accent, text, typography, decorative details, and optional stickers.
- [ ] Define exactly `chrome`, `cloudy-dreamy`, `kawaii`, and `monochrome-cute` presets.
- [ ] Map only vetted assets under `/fanid-themes/<theme>/`; missing optional assets must be representable as an empty list.
- [ ] Verify all preset IDs and fallback behavior with a focused test or `npx tsc --noEmit`.
- [ ] Commit: `feat: define fan ID theme presets`.

### Task 2: Add theme selection state and the Step 4 swatch picker

**Files:**
- Modify: `src/app/start/page.tsx` or the current wizard owner identified by `StepIssue`.
- Modify: the file containing `StepIssue`.
- Create or modify: the focused theme-picker component if the existing file becomes difficult to read.

**Interfaces:**
- Consumes `FAN_ID_THEMES` and `FanIdThemeId`.
- Produces a selected `themeId` with Chrome as the initial value and passes it to the live card preview and final issue action.

- [ ] Add a controlled horizontal swatch strip above the live card preview.
- [ ] Render theme-specific material samples and labels, with a visible selected state and keyboard focus state.
- [ ] Make the strip horizontally scrollable on narrow screens without changing the wizard’s step count.
- [ ] Confirm selecting each swatch updates the preview immediately.
- [ ] Commit: `feat: add fan ID theme picker`.

### Task 3: Apply theme tokens to FanIdCard

**Files:**
- Modify: `src/components/FanIdCard.tsx`.
- Test: existing component/type checks plus a rendered preview if available.

**Interfaces:**
- Consumes `themeId?: FanIdThemeId`.
- Resolves tokens with `getFanIdTheme(themeId)` and preserves current Chrome output when omitted.

- [ ] Add the optional `themeId` prop without breaking existing callers.
- [ ] Replace hard-coded theme-specific surface, frame, accent, and typography values with resolved tokens.
- [ ] Keep content layout and accessibility labels unchanged.
- [ ] Add optional decorative treatment only where the theme data supplies it.
- [ ] Verify the five themes render without missing-class, asset, or type errors.
- [ ] Commit: `feat: theme the fan ID card`.

### Task 4: Propagate the selected theme to story, report, and share views

**Files:**
- Modify: `src/components/SoulStoryCard.tsx`.
- Modify: `src/components/SoulReport.tsx`.
- Modify: the wizard/share route that constructs these components.

**Interfaces:**
- Each consumer accepts `themeId?: FanIdThemeId` and uses the same selected ID as the Fan ID card.

- [ ] Thread `themeId` through issue, story, report, and share navigation/state.
- [ ] Apply shared theme tokens to supporting cards without redesigning their information architecture.
- [ ] Confirm a refresh or direct route with no theme still renders Chrome.
- [ ] Commit: `feat: preserve fan ID theme across generated views`.

### Task 5: Verify responsive behavior and integration

**Files:**
- Modify only files required by verification findings.

- [ ] Run `npx tsc --noEmit` from `/Users/xxxsw/claude code/kpop-discovery`.
- [ ] Run the project build command and fix any type or route errors.
- [ ] Verify Step 4 at desktop and mobile widths: five swatches, horizontal overflow, selected state, and live preview update.
- [ ] Verify each theme through issue, story, report, and share views.
- [ ] Verify missing sticker paths do not break any theme.
- [ ] Commit final integration fixes: `test: verify fan ID theme customization`.
