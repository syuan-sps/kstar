# Personality Card Families Design

## Goal

Replace the single, information-heavy story-card composition with five compact
visual families. Each archetype is assigned a family from its dominant fan
preference, giving the result a distinctive collectible identity while keeping
the export asset simple.

## Shared Card Contract

Every 270 x 480 export card contains only:

1. Archetype code.
2. Chinese archetype name.
3. One-line archetype truth/tagline.
4. A plain-language translation of the dominant taste dimensions.
5. One family-specific indicator.

The existing outer chrome, accent color, short CTA, and KSTAR footer remain.
The full four-bar frequency panel, extra labels, and duplicate explanatory
copy are removed from the story-card export.

The code is never expected to explain itself. A = 美學, P = 個性, S = 舞台,
and R = 共鳴／內容; uppercase letters are strong drivers and lowercase letters
are supporting preferences. Each card must surface an immediately readable
line such as "你的入坑核心：個性、舞台". The code remains a collectible mark.

## Families

### 1. Signal — personality-led

Large code, one red signal bar, and the direct tagline. This family is bold,
technical, and minimally decorated.

### 2. Collector — aesthetic-led

Specimen-label structure with a chrome color swatch and editorial caption.
It feels curated rather than data-driven.

### 3. Stage — performance-led

High-contrast spotlight field, large archetype name, and a single energy
meter. It is theatrical without becoming busy.

### 4. Archive — content-led

Fan-note composition: code, quote-style insight, and tiny index/date
metadata. This is the warmest, most intimate family.

### 5. Orbit — balanced or rare hybrid

Centered code and four tiny dots/rings that summarize trait balance. It reads
as a collectible badge for rare or evenly distributed results.

## Assignment Rules

- One clearly dominant score chooses that dimension's family: aesthetic ->
  Collector; personality -> Signal; performance -> Stage; content -> Archive.
- Ties, balanced scores, or rare classifications use Orbit.
- Accent color is still determined by the archetype; a family changes
  composition, visual motif, and its one indicator, not the result data.

## Figma Deliverable

Create five editable 270 x 480 variants side by side in the existing spacing
study file. Each uses the same sample archetype and KStar/Silvercore visual
language so the comparison isolates composition rather than content.

## Acceptance Criteria

- Five variants visibly differ at a glance.
- Each has the shared four content elements and no full frequency panel.
- Each remains legible at the 270 x 480 export size.
- Each has a single, intentional focal point and no unassigned empty region.
