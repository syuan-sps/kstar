# KStar Home Logo Navigation Design

## Goal

Make every KStar wordmark reliably return a user to the homepage Life in 4
Cuts hero.

## Problem

The existing links navigate to `/`, but `LandingGate` redirects users without
`kstar:onboarding` back to `/start`. A direct navigation therefore reaches
Home briefly and then returns to the wizard.

## Design

Create one client-side `HomeLogoLink` component. On click it sets
`kstar:onboarding` to `done`, then follows the ordinary `/` link navigation.
Use this component in the global header and in `WizardChrome`.

The component preserves normal link semantics: its destination is `/`, it
supports modifier-click/open-in-new-tab behavior without writing local state,
and the visible logo styling remains owned by the caller.

## Verification

- A focused component contract verifies normal clicks write the onboarding
  flag and use `/`.
- Header and wizard chrome both render the shared link.
- TypeScript and the production build pass.
