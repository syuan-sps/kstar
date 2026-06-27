// scripts/_test-submissions.ts
import assert from "node:assert";
import { isValidLicense, looksNonFree, hashIp, validateIntake } from "../src/lib/submissions";

// license guard
assert.equal(isValidLicense("cc-by"), true);
assert.equal(isValidLicense("nope"), false);

// non-free source heuristic
assert.equal(looksNonFree("https://www.instagram.com/p/abc"), true);
assert.equal(looksNonFree("https://twitter.com/x/status/1"), true);
assert.equal(looksNonFree("https://commons.wikimedia.org/wiki/File:X"), false);
assert.equal(looksNonFree("https://www.flickr.com/photos/x/123"), false);

// ip hashing is stable + salted
assert.equal(hashIp("1.2.3.4", "s"), hashIp("1.2.3.4", "s"));
assert.notEqual(hashIp("1.2.3.4", "s"), hashIp("1.2.3.4", "t"));
assert.equal(hashIp("1.2.3.4", "s").length, 64);

// intake validation
const exists = (id: string) => id === "ryujin";
assert.equal(validateIntake({ idolId: "ryujin", sourceUrl: "https://x.com", license: "cc-by" }, exists).ok, true);
assert.equal(validateIntake({ idolId: "ghost", sourceUrl: "https://x.com", license: "cc-by" }, exists).ok, false);
assert.equal(validateIntake({ idolId: "ryujin", sourceUrl: "", license: "cc-by" }, exists).ok, false);
assert.equal(validateIntake({ idolId: "ryujin", sourceUrl: "https://x.com", license: "bad" }, exists).ok, false);

console.log("submissions helpers: OK");
