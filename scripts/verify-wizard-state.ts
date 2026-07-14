import assert from "node:assert/strict";
import { SCORE_LAYERS, type ScoreLayer } from "../src/lib/types";
import {
  clearWizard,
  finishWizard,
  loadWizard,
  saveWizard,
  type WizardState,
} from "../src/lib/wizardState";

const WIZARD_KEY = "kstar:wizard";
const PREFS_KEY = "kstar:prefs";
const ONBOARDING_KEY = "kstar:onboarding";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, String(value));
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function installBrowser(storage = new MemoryStorage()): { storage: MemoryStorage; events: string[] } {
  const events: string[] = [];
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { dispatchEvent: (event: Event) => events.push(event.type) },
  });
  return { storage, events };
}

function uninstallBrowser(): void {
  Reflect.deleteProperty(globalThis, "localStorage");
  Reflect.deleteProperty(globalThis, "window");
}

const failures: string[] = [];

function check(name: string, behavior: () => void): void {
  try {
    behavior();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(name);
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

function finishedState(overrides: Partial<WizardState> = {}): WizardState {
  return {
    step: 4,
    picks: ["karina", "winter"],
    rank: ["performance", "aesthetic", "personality", "content"],
    answers: { q1: "stage" },
    archetype: { code: "APsr", hiddenLayer: "aesthetic" },
    fanName: "Star",
    ...overrides,
  };
}

check("lenient parsing sanitizes invalid and partial wizard blobs", () => {
  const { storage } = installBrowser();
  storage.setItem(WIZARD_KEY, "not-json");
  assert.deepEqual(loadWizard(), { step: 0, picks: [], rank: SCORE_LAYERS, answers: {} });

  storage.setItem(WIZARD_KEY, JSON.stringify({
    step: 99,
    picks: ["one", 2, "two", "three", "four", "five"],
    rank: ["content"],
    answers: "bad",
  }));
  assert.deepEqual(loadWizard(), {
    step: 0,
    picks: ["one", "two", "three", "four"],
    rank: SCORE_LAYERS,
    answers: {},
    archetype: undefined,
    heroId: undefined,
    fanName: undefined,
    song: null,
  });
});

check("every empty and fallback load returns fresh rank and answers objects", () => {
  uninstallBrowser();
  const ssrFirst = loadWizard();
  ssrFirst.rank.reverse();
  ssrFirst.answers.changed = "yes";
  assert.deepEqual(loadWizard().rank, SCORE_LAYERS);
  assert.deepEqual(loadWizard().answers, {});

  const { storage } = installBrowser();
  const missingFirst = loadWizard();
  missingFirst.rank.reverse();
  missingFirst.answers.changed = "yes";
  assert.deepEqual(loadWizard().rank, SCORE_LAYERS);
  assert.deepEqual(loadWizard().answers, {});

  storage.setItem(WIZARD_KEY, "{");
  const corruptFirst = loadWizard();
  corruptFirst.rank.reverse();
  corruptFirst.answers.changed = "yes";
  assert.deepEqual(loadWizard().rank, SCORE_LAYERS);
  assert.deepEqual(loadWizard().answers, {});
});

check("save merges state and clear removes persisted wizard state", () => {
  const { storage } = installBrowser();
  const saved = saveWizard({ step: 1, picks: ["karina"] });
  assert.equal(saved.step, 1);
  assert.deepEqual(saved.picks, ["karina"]);
  assert.deepEqual(JSON.parse(storage.getItem(WIZARD_KEY) ?? "{}"), saved);
  clearWizard();
  assert.equal(storage.getItem(WIZARD_KEY), null);
});

check("StoredArchetype requires a string code and a valid hidden layer", () => {
  const { storage } = installBrowser();
  const valid = { code: "APsr", hiddenLayer: "content" as ScoreLayer };
  storage.setItem(WIZARD_KEY, JSON.stringify({ archetype: valid }));
  assert.deepEqual(loadWizard().archetype, valid);

  for (const archetype of [
    "APsr",
    { code: 42, hiddenLayer: "content" },
    { code: "APsr" },
    { code: "APsr", hiddenLayer: "invalid" },
  ]) {
    storage.setItem(WIZARD_KEY, JSON.stringify({ archetype }));
    assert.equal(loadWizard().archetype, undefined);
  }
});

check("finishWizard is a server-side no-op", () => {
  uninstallBrowser();
  assert.doesNotThrow(() => finishWizard(finishedState()));
});

check("finishWizard merges prefs, sets flags, dispatches, and clears wizard state", () => {
  const { storage, events } = installBrowser();
  storage.setItem(PREFS_KEY, JSON.stringify({ joinedAt: "2026.07.13", visualMood: "darkLuxe" }));
  storage.setItem(WIZARD_KEY, JSON.stringify({ step: 4 }));

  finishWizard(finishedState());

  assert.deepEqual(JSON.parse(storage.getItem(PREFS_KEY) ?? "{}"), {
    joinedAt: "2026.07.13",
    visualMood: "darkLuxe",
    topIdols: ["karina", "winter"],
    weights: { aesthetic: 0.3, personality: 0.2, performance: 0.4, content: 0.1 },
    layerRank: ["performance", "aesthetic", "personality", "content"],
    archetype: { code: "APsr", hiddenLayer: "aesthetic" },
    heroId: "karina",
    fanName: "Star",
    fanIdClaimed: true,
  });
  assert.equal(storage.getItem(ONBOARDING_KEY), "done");
  assert.deepEqual(events, ["kstar:prefs-updated"]);
  assert.equal(storage.getItem(WIZARD_KEY), null);
});

uninstallBrowser();

if (failures.length > 0) {
  console.error(`\n${failures.length} verification check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log("\nAll wizard state verification checks passed.");
}
