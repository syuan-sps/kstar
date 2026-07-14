import assert from "node:assert/strict";
import fs from "node:fs";
import { ARCHETYPES } from "../src/lib/archetypes";
import { getStoryCardDecor } from "../src/lib/storyCardDecor";

const cases = [
  ["apsr", "aesthetic", "orbit", 0],
  ["Apsr", "aesthetic", "collector", 1],
  ["aPsr", "personality", "signal", 1],
  ["apSr", "performance", "stage", 1],
  ["apsR", "content", "archive", 1],
  ["APsr", "personality", "signal", 2],
  ["APSr", "personality", "orbit", 3],
  ["APSR", "performance", "orbit", 4],
] as const;

for (const [code, leadLayer, family, tier] of cases) {
  const decor = getStoryCardDecor({ code, leadLayer, missing: ARCHETYPES[code].missing });
  assert.equal(decor.family, family, code);
  assert.equal(decor.tier, tier, code);
  assert.match(decor.edgeColor, /^#[0-9a-f]{6}$/i, code);
}

assert.equal(
  getStoryCardDecor({ code: "APSr", leadLayer: "personality", missing: "content" }).ghostLayer,
  "content",
);
assert.equal(getStoryCardDecor({ code: "APSR", leadLayer: "performance" }).motif, "orbit-ring");

const source = fs.readFileSync("src/components/SoulStoryCard.tsx", "utf8");
assert.match(source, /getStoryCardDecor/);
assert.match(source, /data-story-card-motif/);
assert.match(source, /data-story-card-tier/);
assert.match(source, /ref={cardRef}/);
assert.match(source, /exportNode\(cardRef\.current/);
assert.doesNotMatch(source, /grid-rows-\[auto_minmax\(120px,1fr\)_auto\]/);
assert.doesNotMatch(source, /className="flex h-full w-full flex-col justify-center rounded-\[18px\]/);
assert.match(source, /h-\[115px\] w-\[210px\]/);
assert.match(source, /flex w-\[270px\] flex-col items-center gap-\[30px\]/);
assert.match(source, /padding: "50px 18px 22px"/);

console.log("story-card decoration contract verified");
