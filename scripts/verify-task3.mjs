import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import QRCode from "qrcode";

const intro = fs.readFileSync("src/components/IntroSplash.tsx", "utf8");
const chooseBody = intro.match(/function choose\(v: Variant\) \{([\s\S]*?)\n  \}/)?.[1] ?? "";

assert.match(chooseBody, /localStorage\.setItem\("kstar:flashOk", v === "flash" \? "1" : "0"\)/);
assert.ok(
  chooseBody.indexOf('localStorage.setItem("kstar:flashOk"') < chooseBody.indexOf('setPhase("play")'),
  "flash consent must be persisted before the play phase transition",
);
assert.match(intro, />KSTAR<\/span><span className="ib-mark-zh">人生四格<\/span>/);
assert.match(intro, /開場動畫含有閃光，可能影響光敏感族群。要播放嗎？/);
assert.doesNotMatch(intro, /SOULCUTS|靈魂四格/);

const generator = fs.readFileSync("scripts/gen-start-qr.mjs", "utf8");
assert.match(generator, /import QRCode from "qrcode"/);
assert.match(generator, /fs\.writeFileSync\("public\/qr-start\.svg", svg\)/);

const qr = fs.readFileSync("public/qr-start.svg", "utf8");
const expectedQr = await QRCode.toString("https://kstar-six.vercel.app/start", {
  type: "svg",
  margin: 1,
  color: { dark: "#180626", light: "#ffffff" },
});

assert.equal(qr, expectedQr, "QR asset must exactly encode the production /start URL with the ratified SVG options");
assert.match(qr, /^<svg[^>]+viewBox="0 0 \d+ \d+"/);
assert.match(qr, /(?:fill|stroke)="#180626"/i);

const baseLock = JSON.parse(execFileSync("git", ["show", "d700a56:package-lock.json"], { encoding: "utf8" }));
const currentLock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
const currentRootWithoutQr = structuredClone(currentLock.packages[""]);
delete currentRootWithoutQr.devDependencies.qrcode;
assert.deepEqual(currentRootWithoutQr, baseLock.packages[""], "only qrcode may change the pre-existing root lock metadata");

for (const [path, metadata] of Object.entries(baseLock.packages)) {
  if (!path) continue;
  assert.deepEqual(currentLock.packages[path], metadata, `pre-existing lock metadata changed: ${path}`);
}

const addedPaths = new Set(Object.keys(currentLock.packages).filter((path) => !(path in baseLock.packages)));
const reachableAddedPaths = new Set();
const pending = ["node_modules/qrcode"];
while (pending.length) {
  const path = pending.pop();
  if (reachableAddedPaths.has(path)) continue;
  reachableAddedPaths.add(path);
  for (const dependency of Object.keys(currentLock.packages[path]?.dependencies ?? {})) {
    let scope = path;
    let resolved;
    while (true) {
      const candidate = scope ? `${scope}/node_modules/${dependency}` : `node_modules/${dependency}`;
      if (currentLock.packages[candidate]) { resolved = candidate; break; }
      if (!scope) break;
      const cut = scope.lastIndexOf("/node_modules/");
      scope = cut === -1 ? "" : scope.slice(0, cut);
    }
    if (resolved && addedPaths.has(resolved)) pending.push(resolved);
  }
}
assert.deepEqual(addedPaths, reachableAddedPaths, "new lock packages must be exactly the qrcode dependency graph");

console.log("Task 3 focused checks passed");
