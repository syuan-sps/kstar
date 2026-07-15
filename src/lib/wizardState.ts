// Resumable state for the /start wizard. One JSON blob under kstar:wizard.
// All readers parse leniently (old/partial blobs must never throw) — same
// discipline as UserPrefs. finishWizard() is the ONLY writer of kstar:prefs.
import type {
  FanIdCardMode,
  ScoreLayer,
  StoredArchetype,
  UserPrefs,
  Weights,
} from "./types";
import { SCORE_LAYERS } from "./types";
import { rankToWeights } from "./questionnaire";
import { FAN_ID_THEMES, type FanIdThemeId } from "./fanIdThemes";

export interface WizardState {
  step: 0 | 1 | 2 | 3 | 4;
  picks: string[];            // idol ids, 0..4, user-ordered (slot order)
  rank: ScoreLayer[];         // 入坑優先序
  answers: Record<string, string>;
  archetype?: StoredArchetype; // computed 追星靈魂, same shape as UserPrefs.archetype
  heroId?: string;            // spotlight 本命 (defaults to picks[0])
  fanName?: string;           // optional 持卡人
  song?: { title: string; artist: string; artworkUrl: string } | null;
  issuedAt?: string;          // YYYY.MM.DD, stamped once for this identity
  serial?: string;            // stable ID (not a sequence or scarcity claim)
  themeId?: FanIdThemeId;     // curated visual edition
  stickersEnabled?: boolean;
  cardMode?: FanIdCardMode;
}

const KEY = "kstar:wizard";
const MAX_ID = 128;
const MAX_ANSWER_KEY = 128;
const MAX_ANSWER_VALUE = 256;

function emptyWizard(): WizardState {
  return { step: 0, picks: [], rank: [...SCORE_LAYERS], answers: {} };
}

export function isStoredArchetype(value: unknown): value is StoredArchetype {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredArchetype>;
  return typeof candidate.code === "string"
    && /^[Aa][Pp][Ss][Rr]$/.test(candidate.code)
    && SCORE_LAYERS.includes(candidate.hiddenLayer as ScoreLayer);
}

function boundedString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

export function validRank(value: unknown): value is ScoreLayer[] {
  return Array.isArray(value)
    && value.length === SCORE_LAYERS.length
    && new Set(value).size === SCORE_LAYERS.length
    && value.every((layer) => SCORE_LAYERS.includes(layer as ScoreLayer));
}

export function validWeights(value: unknown): value is Weights {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const weights = value as Record<string, unknown>;
  return SCORE_LAYERS.every((layer) => typeof weights[layer] === "number"
    && Number.isFinite(weights[layer]) && Number(weights[layer]) >= 0 && Number(weights[layer]) <= 1);
}

function validAnswers(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, answer]) =>
    key.length > 0 && key.length <= MAX_ANSWER_KEY && boundedString(answer, MAX_ANSWER_VALUE),
  ));
}

function validSong(value: unknown): WizardState["song"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const song = value as Record<string, unknown>;
  return boundedString(song.title, 120)
    && boundedString(song.artist, 120)
    && boundedString(song.artworkUrl, 2048)
    ? { title: song.title, artist: song.artist, artworkUrl: song.artworkUrl }
    : null;
}

export function normalizeStickersEnabled(value: unknown): boolean {
  return value === true;
}

export function normalizeThemeId(value: unknown): FanIdThemeId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(FAN_ID_THEMES, value)
    ? value as FanIdThemeId
    : "chrome";
}

export function normalizeCardMode(value: unknown): FanIdCardMode {
  return value === "idol" || value === "idol-user" || value === "user"
    ? value
    : "idol-user";
}

export function loadWizard(): WizardState {
  if (typeof window === "undefined") return emptyWizard();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyWizard();
    const p = JSON.parse(raw) as Partial<WizardState>;
    return {
      step: ([0, 1, 2, 3, 4] as const).includes(p.step as 0) ? (p.step as WizardState["step"]) : 0,
      picks: Array.isArray(p.picks) ? p.picks.filter((x): x is string => boundedString(x, MAX_ID)).slice(0, 4) : [],
      rank: validRank(p.rank) ? p.rank : [...SCORE_LAYERS],
      answers: validAnswers(p.answers),
      archetype: isStoredArchetype(p.archetype) ? p.archetype : undefined,
      heroId: boundedString(p.heroId, MAX_ID) ? p.heroId : undefined,
      fanName: boundedString(p.fanName, 30) ? p.fanName : undefined,
      song: validSong(p.song),
      issuedAt: typeof p.issuedAt === "string" && /^\d{4}\.\d{2}\.\d{2}$/.test(p.issuedAt) ? p.issuedAt : undefined,
      serial: typeof p.serial === "string" && /^[A-Za-z0-9-]{1,32}$/.test(p.serial) ? p.serial : undefined,
      themeId: normalizeThemeId(p.themeId),
      stickersEnabled: normalizeStickersEnabled(p.stickersEnabled),
      cardMode: normalizeCardMode(p.cardMode),
    };
  } catch {
    return emptyWizard();
  }
}

export function saveWizard(patch: Partial<WizardState>): WizardState {
  const next = { ...loadWizard(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* quota — state stays in memory */ }
  return next;
}

export function resetWizardForRetake(state: WizardState): WizardState {
  return {
    ...state,
    step: 2,
    rank: [...SCORE_LAYERS],
    answers: {},
    archetype: undefined,
  };
}

export function hydrateClaimWizard(value: unknown, current: WizardState): WizardState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return current;
  const prefs = value as Record<string, unknown>;
  const picks = Array.isArray(prefs.topIdols)
    ? prefs.topIdols.filter((id): id is string => boundedString(id, MAX_ID))
    : [];
  if (picks.length !== 4 || new Set(picks).size !== 4) return current;
  const legacyWeights = validWeights(prefs.weights) ? prefs.weights : undefined;
  const rank = validRank(prefs.layerRank)
    ? prefs.layerRank
    : legacyWeights
      ? [...SCORE_LAYERS].sort((a, b) => legacyWeights[b] - legacyWeights[a])
      : current.rank;
  const archetype = isStoredArchetype(prefs.archetype) ? prefs.archetype : undefined;
  return saveWizard({ picks, rank, archetype, step: archetype ? 4 : 2 });
}

export function acceptWizardUrlStep(s: WizardState, requested: number): WizardState {
  if (![1, 2, 3, 4].includes(requested) || requested > s.step) return s;
  if (requested === s.step) return s;
  return saveWizard({ step: requested as WizardState["step"] });
}

export function clearWizard(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

function issueDate(): string {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function hashCode(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) + hash) ^ value.charCodeAt(i);
  return hash >>> 0;
}

// Prepare the visible certificate identity without touching preferences.
// saveWizard makes it stable across rerenders and interrupted /start sessions.
export function ensureIssueIdentity(s: WizardState): WizardState {
  if (s.issuedAt && s.serial) return s;
  let prefs: { issuedAt?: unknown; serial?: unknown } = {};
  try { prefs = JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}"); } catch { /* fresh */ }
  const issuedAt = s.issuedAt
    ?? (typeof prefs.issuedAt === "string" && /^\d{4}\.\d{2}\.\d{2}$/.test(prefs.issuedAt) ? prefs.issuedAt : issueDate());
  const serial = s.serial
    ?? (typeof prefs.serial === "string" && /^[A-Za-z0-9-]{1,32}$/.test(prefs.serial) ? prefs.serial : String(hashCode(`${s.picks.join("|")}|${Date.now()}`) % 10000).padStart(4, "0"));
  return saveWizard({ ...s, issuedAt, serial });
}

// Merge the finished wizard into the app's existing prefs shape and mark done.
export function finishWizard(s: WizardState): boolean {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return false;
  let prefs: Partial<UserPrefs> & { fanIdClaimed?: boolean; fanName?: string; heroId?: string } = {};
  try { prefs = JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}"); } catch { /* fresh */ }
  const merged = {
    ...prefs,
    topIdols: s.picks,
    weights: rankToWeights(s.rank),
    layerRank: s.rank,
    archetype: s.archetype,
    heroId: s.heroId ?? s.picks[0],
    fanName: s.fanName,
    themeId: normalizeThemeId(s.themeId),
    cardMode: normalizeCardMode(s.cardMode),
    issuedAt: s.issuedAt,
    serial: s.serial,
    stickersEnabled: normalizeStickersEnabled(s.stickersEnabled),
    fanIdClaimed: true,
  };
  try {
    localStorage.setItem("kstar:prefs", JSON.stringify(merged));
    localStorage.setItem("kstar:onboarding", "done");
    window.dispatchEvent(new Event("kstar:prefs-updated"));
    clearWizard();
    return true;
  } catch {
    return false;
  }
}
