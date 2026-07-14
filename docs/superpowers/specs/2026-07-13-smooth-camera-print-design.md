# Smooth Camera-Print Design

**Date:** 2026-07-13  
**Status:** Approved

## Goal

Make the Step 1 camera-print transition feel physically continuous and smooth while preserving KStar's chrome camera, four selected idols, and short wizard pacing.

## Reference Comparison

Reference: <https://www.instagram.com/p/DaVVq_KsNwt/>

The reference keeps the printer body fixed while paper advances continuously through its mouth. Image development happens on the moving surface, so feed, exposure, and reveal read as one mechanical action.

KStar currently performs separate beats: the camera enters, the complete strip drops into place, a strong stage-wide flash plays, and four photos develop through independent delayed fades. The pauses and independent fades make the sequence feel staged instead of printed.

## Motion Design

- Keep the existing chrome camera artwork, four-photo grid, caption, and real selected-idol images.
- Keep the total transition near 4.2 seconds.
- Hold the camera body stationary once it enters.
- Clip the strip at a printer-mouth boundary and animate one continuous downward paper feed.
- Tie development to the paper movement with a traveling exposure/development mask. Areas nearest the printer mouth begin washed out and resolve as they move away from it.
- Allow the four photos to resolve with a subtle top-to-bottom progression, but overlap their timing so they remain part of one continuous print action rather than four discrete reveals.
- Replace the strong stage-wide flash with a brief localized glow at the printer mouth and a restrained lens glint.
- Add a very small mechanical settle at the end of the paper feed; avoid springy overshoot.
- Begin the transition to Step 2 as the final image finishes resolving. Preserve a short completed-strip hold without the current dead pause.

## Implementation Boundaries

- Retain `DevelopFourCuts` and its existing `artists` / `onDone` interface.
- Implement the timeline with scoped CSS animations and minimal additional markup for the printer mouth and development overlay.
- Do not add GSAP, Motion, or another animation dependency.
- Keep the same state transition in `StartFlow`; only align its completion timer with the revised CSS timeline.
- Preserve replay behavior and fallback thumbnails.

## Accessibility and Motion Policy

This transition follows the product's existing always-on, user-triggered wizard motion policy. The exposure effect must remain localized and low-opacity; it must not recreate a full-screen strobe.

## Verification

- Add focused tests for the continuous-feed classes, printer-mouth clipping layer, development overlay, and revised completion timing.
- Run existing wizard transition and final-review tests.
- Run TypeScript validation and the production build.
- Record or capture multiple frames from a real Step 1 transition and verify that paper position and development progress advance together.
- Verify all four selected idols appear, the strip reaches its complete resting state, and Step 2 begins only after the final development pass.
- Check mobile and desktop viewports for clipping, centering, and unintended page movement.

## Out of Scope

- Copying the reference's vintage photobooth styling or single-photo layout.
- Changing the selected-idol data or Step 2 quiz state.
- Adding sound, haptics, or an animation library.
- Reworking the separate first-visit SOULCUTS intro.
