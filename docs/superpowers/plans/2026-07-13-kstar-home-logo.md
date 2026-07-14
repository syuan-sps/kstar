# KStar Home Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make both KStar wordmarks reliably open the Life in 4 Cuts homepage.

**Architecture:** A small client component owns the only browser-only side effect: setting `kstar:onboarding` to `done` on an ordinary primary click. The existing global header and wizard shell use that same component while retaining their caller-provided styling.

**Tech Stack:** Next.js 16, React 19, TypeScript, TSX contract test.

## Global Constraints

- Destination must be `/`.
- Normal primary clicks write `kstar:onboarding=done` before navigation.
- Modified clicks keep default browser behavior and must not write local storage.
- The header and wizard shell share one implementation.

---

### Task 1: Reusable home logo link

**Files:**
- Create: `src/components/HomeLogoLink.tsx`
- Modify: `src/app/layout.tsx:4-5,52-56`
- Modify: `src/components/wizard/WizardChrome.tsx:4,22-24`
- Test: `.superpowers/sdd/kstar-home-logo.test.tsx`

**Interfaces:**
- Produces: `HomeLogoLink({ children, className })`, rendered as a `Link` to `/`.
- Consumes: a caller-supplied class name and child wordmark content.

- [ ] **Step 1: Write the failing source contract**

Assert that `HomeLogoLink` writes the onboarding key only for an unmodified left click and that both existing logo locations import it.

- [ ] **Step 2: Run the contract to verify it fails**

Run: `node node_modules/tsx/dist/cli.mjs .superpowers/sdd/kstar-home-logo.test.tsx`
Expected: failure because `HomeLogoLink.tsx` does not exist.

- [ ] **Step 3: Implement the client-side shared link**

Create a `use client` component with `onClick`. Return early for `event.defaultPrevented`, non-left clicks, or modifier keys. Otherwise call `localStorage.setItem("kstar:onboarding", "done")` in a try/catch. Render `Link href="/"` with the passed class name and children.

- [ ] **Step 4: Replace both logo links**

Use `HomeLogoLink` in `RootLayout` and `WizardChrome`, preserving their existing child content and CSS classes.

- [ ] **Step 5: Run the contract and typecheck**

Run: `node node_modules/tsx/dist/cli.mjs .superpowers/sdd/kstar-home-logo.test.tsx` and `node node_modules/typescript/bin/tsc --noEmit`.
Expected: the contract reports verified and TypeScript exits 0.

- [ ] **Step 6: Commit**

Commit the component, its two integrations, the focused test, and this plan/spec.
