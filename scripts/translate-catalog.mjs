// Catalog translation pipeline — generates the EN parallel files consumed by
// src/lib/i18n/catalog.ts. Never edits catalog.json; the similarity engine
// keeps reading raw zh fields untouched (see CLAUDE.md's i18n note).
//
// Outputs:
//   src/data/token-glossary.en.json  — { zhTag: "English" } for every distinct
//                                       open-vocab tag (style/trait/color)
//   src/data/catalog.en.json         — { [artistId]: { <layer>: { vibe, analysis,
//                                       official_analysis?, personal_analysis? }, … ,
//                                       overview: { vibe, summary } } }
//
// Usage:
//   node --env-file=.env.local scripts/translate-catalog.mjs --glossary
//   node --env-file=.env.local scripts/translate-catalog.mjs --sample 8
//   node --env-file=.env.local scripts/translate-catalog.mjs --artists [id…]   (default: all, resumable)
//   node scripts/translate-catalog.mjs --validate
//
// Closed-vocab topics (lifestyle_topics/value_topics, 23 values) are NOT part
// of the glossary — they're hand-authored in src/lib/cardMeta.ts's TOPIC_EN so
// emoji maps and quiz options can't desync from an AI-generated translation.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CATALOG_PATH = path.join(root, "src/data/catalog.json");
const GLOSSARY_PATH = path.join(root, "src/data/token-glossary.en.json");
const CATALOG_EN_PATH = path.join(root, "src/data/catalog.en.json");
const MODEL = "claude-sonnet-4-6";

const CLOSED_VOCAB_TOPICS = new Set([
  "健身", "動物", "居家日常", "戶外活動", "攝影", "旅遊", "時尚", "美妝", "美食", "藝術", "遊戲", "音樂創作",
  "公益環保", "努力哲學", "家庭觀", "專業職人精神", "幽默自嘲", "心理健康倡議", "正向思考", "真誠待粉", "自信表達", "自我認同", "自由奔放",
]);

function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; }
}
function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function loadCatalog() {
  return readJson(CATALOG_PATH, null)?.artists ?? [];
}

// ── Distinct open-vocab tags across the catalog ─────────────────────────
function collectOpenVocabTags(artists) {
  const tags = new Set();
  for (const a of artists) {
    const p = a.profile;
    if (!p) continue;
    for (const t of p.aesthetic?.style_tags ?? []) tags.add(t);
    for (const t of p.aesthetic?.official?.style_tags ?? []) tags.add(t);
    for (const t of p.aesthetic?.personal?.style_tags ?? []) tags.add(t);
    for (const t of p.aesthetic?.color_palette ?? []) tags.add(t);
    for (const t of p.personality?.trait_tags ?? []) tags.add(t);
    for (const t of p.performance?.trait_tags ?? []) tags.add(t);
    for (const t of p.content?.trait_tags ?? []) tags.add(t);
    for (const t of p.overview?.trait_tags ?? []) tags.add(t);
  }
  for (const t of CLOSED_VOCAB_TOPICS) tags.delete(t);
  return [...tags].sort();
}

// ── Anthropic client (lazy import — script exits early without a key) ──
async function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set. Run with --env-file=.env.local, or export it first.");
    process.exit(1);
  }
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  return new Anthropic();
}

async function askJson(client, system, user, maxTokens = 1024) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(jsonText);
}

// ── Stage A: glossary ────────────────────────────────────────────────────
const CHUNK_SIZE = 80;

async function runGlossary() {
  const artists = loadCatalog();
  const allTags = collectOpenVocabTags(artists);
  const glossary = readJson(GLOSSARY_PATH, {});
  const pending = allTags.filter((t) => !(t in glossary));
  console.log(`glossary: ${allTags.length} distinct tags, ${allTags.length - pending.length} already translated, ${pending.length} pending`);
  if (!pending.length) return;

  const client = await getClient();
  const system = [
    "You translate short K-pop fashion/personality/vibe tags from Traditional Chinese to natural, idiomatic English.",
    "Each tag is 2-8 characters — a style descriptor, personality trait, or color name, not a full sentence.",
    "Respond with STRICT JSON only: an object mapping each input tag to its English translation.",
    "Keep translations short (1-4 words), fan-magazine register, no explanations, no Chinese characters in the output.",
  ].join(" ");

  for (let i = 0; i < pending.length; i += CHUNK_SIZE) {
    const chunk = pending.slice(i, i + CHUNK_SIZE);
    const user = `Translate these ${chunk.length} tags to English. Return JSON: {"tag1": "translation1", ...}\n\n${JSON.stringify(chunk)}`;
    try {
      const result = await askJson(client, system, user, 2048);
      let added = 0;
      for (const t of chunk) {
        if (typeof result[t] === "string" && result[t].trim()) {
          glossary[t] = result[t].trim();
          added++;
        }
      }
      writeJson(GLOSSARY_PATH, glossary);
      console.log(`  chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(pending.length / CHUNK_SIZE)}: +${added}/${chunk.length}`);
    } catch (e) {
      console.error(`  chunk ${Math.floor(i / CHUNK_SIZE) + 1} failed: ${e.message} — will retry on next run`);
    }
  }
  console.log(`glossary done: ${Object.keys(glossary).length}/${allTags.length}`);
}

// ── Stage B: per-artist prose ────────────────────────────────────────────
function proseFieldsFor(artist) {
  const p = artist.profile;
  if (!p) return null;
  const out = {
    aesthetic: { vibe: p.aesthetic?.vibe, analysis: p.aesthetic?.analysis },
    personality: { vibe: p.personality?.vibe, analysis: p.personality?.analysis },
    performance: { vibe: p.performance?.vibe, analysis: p.performance?.analysis },
    content: { vibe: p.content?.vibe, analysis: p.content?.analysis },
    overview: { vibe: p.overview?.vibe, summary: p.overview?.summary },
  };
  if (p.aesthetic?.official?.analysis) out.aesthetic.official_analysis = p.aesthetic.official.analysis;
  if (p.aesthetic?.personal?.analysis) out.aesthetic.personal_analysis = p.aesthetic.personal.analysis;
  return out;
}

function glossaryContextFor(artist, glossary) {
  const p = artist.profile;
  const tags = new Set();
  for (const t of p?.aesthetic?.style_tags ?? []) tags.add(t);
  for (const t of p?.aesthetic?.official?.style_tags ?? []) tags.add(t);
  for (const t of p?.aesthetic?.personal?.style_tags ?? []) tags.add(t);
  for (const t of p?.personality?.trait_tags ?? []) tags.add(t);
  for (const t of p?.performance?.trait_tags ?? []) tags.add(t);
  for (const t of p?.content?.trait_tags ?? []) tags.add(t);
  const ctx = {};
  for (const t of tags) if (glossary[t]) ctx[t] = glossary[t];
  return ctx;
}

const ARTIST_SYSTEM_PROMPT = [
  "You translate K-pop idol profile prose from Traditional Chinese to natural, engaging English for a fan-discovery website.",
  "Register: fan-magazine / editorial, warm and specific — not stiff or literal. Match the tone of outlets like Teen Vogue or Dazed covering K-pop.",
  "Keep idol names, group names, brand names, song/album/era titles (e.g. 《GOLDEN》 -> GOLDEN), and song titles in their existing English/romanized form — do not translate proper nouns.",
  "Preserve factual claims exactly (dates, brand deals, chart facts) — do not embellish or invent details not in the source.",
  "Output STRICT JSON matching the exact key structure given in the input, with every value translated to English. No Chinese characters anywhere in the output. No markdown, no commentary — JSON only.",
].join(" ");

async function translateArtist(client, artist, glossary) {
  const fields = proseFieldsFor(artist);
  if (!fields) return null;
  const ctx = glossaryContextFor(artist, glossary);
  const user = [
    `Idol: ${artist.name}${artist.group ? ` (${artist.group})` : " (solo)"}`,
    ctx && Object.keys(ctx).length ? `Reference tag translations already established for this idol (for consistency, don't repeat them verbatim unless natural): ${JSON.stringify(ctx)}` : null,
    `Translate this JSON's string values to English, keeping the exact same keys:`,
    JSON.stringify(fields, null, 2),
  ].filter(Boolean).join("\n\n");
  return askJson(client, ARTIST_SYSTEM_PROMPT, user, 1536);
}

async function runArtists(ids, { force = false } = {}) {
  const artists = loadCatalog();
  const glossary = readJson(GLOSSARY_PATH, {});
  const catalogEn = readJson(CATALOG_EN_PATH, {});
  const targets = (ids.length ? ids.map((id) => artists.find((a) => a.id === id)).filter(Boolean) : artists)
    .filter((a) => force || !(a.id in catalogEn));

  console.log(`artists: ${targets.length} to translate (${artists.length} total, ${Object.keys(catalogEn).length} already done)`);
  if (!targets.length) return;

  const client = await getClient();
  let done = 0;
  for (const artist of targets) {
    try {
      const translated = await translateArtist(client, artist, glossary);
      if (translated) {
        catalogEn[artist.id] = translated;
        writeJson(CATALOG_EN_PATH, catalogEn);
      }
      done++;
      console.log(`  [${done}/${targets.length}] ${artist.id}`);
    } catch (e) {
      console.error(`  [${done + 1}/${targets.length}] ${artist.id} FAILED: ${e.message} — will retry on next run`);
    }
  }
}

// ── --sample: side-by-side zh/en for N artists across tiers, no file writes ──
async function runSample(n) {
  const artists = loadCatalog();
  const glossary = readJson(GLOSSARY_PATH, {});
  if (!Object.keys(glossary).length) {
    console.error("No glossary yet — run --glossary first (--sample uses it for tag-consistency context).");
    process.exit(1);
  }
  const dualTrack = artists.filter((a) => a.profile?.aesthetic?.official);
  const rest = artists.filter((a) => !a.profile?.aesthetic?.official);
  const picks = [];
  for (let i = 0; i < n; i++) {
    const pool = i % 3 === 0 && dualTrack.length ? dualTrack : rest;
    const idx = Math.floor((i / n) * pool.length);
    picks.push(pool[idx % pool.length]);
  }
  const client = await getClient();
  for (const artist of picks) {
    const translated = await translateArtist(client, artist, glossary);
    const zh = proseFieldsFor(artist);
    console.log(`\n${"=".repeat(70)}\n${artist.id}  (${artist.name}${artist.group ? `, ${artist.group}` : ""})\n${"=".repeat(70)}`);
    for (const layer of Object.keys(zh)) {
      for (const field of Object.keys(zh[layer])) {
        const zhVal = zh[layer][field];
        const enVal = translated?.[layer]?.[field];
        if (!zhVal) continue;
        console.log(`\n[${layer}.${field}]\n  ZH: ${zhVal}\n  EN: ${enVal ?? "(missing)"}`);
      }
    }
  }
}

// ── Stage C: validate ────────────────────────────────────────────────────
const HAN_RE = /\p{Script=Han}/u;

function runValidate() {
  const artists = loadCatalog();
  const glossary = readJson(GLOSSARY_PATH, {});
  const catalogEn = readJson(CATALOG_EN_PATH, {});
  const errors = [];

  const allTags = collectOpenVocabTags(artists);
  for (const t of allTags) {
    if (!glossary[t]) errors.push(`glossary missing tag: ${t}`);
    else if (HAN_RE.test(glossary[t])) errors.push(`glossary tag "${t}" translation still contains Han: ${glossary[t]}`);
  }

  for (const artist of artists) {
    const fields = proseFieldsFor(artist);
    if (!fields) continue;
    const en = catalogEn[artist.id];
    if (!en) { errors.push(`catalog.en.json missing artist: ${artist.id}`); continue; }
    for (const layer of Object.keys(fields)) {
      for (const field of Object.keys(fields[layer])) {
        if (!fields[layer][field]) continue; // source was empty, nothing required
        const val = en[layer]?.[field];
        if (!val || !String(val).trim()) errors.push(`${artist.id}: ${layer}.${field} empty/missing`);
        else if (HAN_RE.test(val)) errors.push(`${artist.id}: ${layer}.${field} still contains Han characters`);
      }
    }
  }

  console.log(`validate: ${artists.length} artists, ${allTags.length} tags, ${errors.length} errors`);
  for (const e of errors.slice(0, 50)) console.log("  ✗ " + e);
  if (errors.length > 50) console.log(`  … and ${errors.length - 50} more`);
  process.exit(errors.length ? 1 : 0);
}

// ── CLI ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.includes("--glossary")) {
  await runGlossary();
} else if (args.includes("--validate")) {
  runValidate();
} else if (args.includes("--sample")) {
  const n = Number(args[args.indexOf("--sample") + 1] ?? 6);
  await runSample(n);
} else if (args.includes("--artists")) {
  const idx = args.indexOf("--artists");
  const ids = args.slice(idx + 1).filter((a) => !a.startsWith("--"));
  const force = args.includes("--force");
  await runArtists(ids, { force });
} else {
  console.log(`Usage:
  node --env-file=.env.local scripts/translate-catalog.mjs --glossary
  node --env-file=.env.local scripts/translate-catalog.mjs --sample [N=6]
  node --env-file=.env.local scripts/translate-catalog.mjs --artists [id…]   (omit ids for full resumable run)
  node scripts/translate-catalog.mjs --validate`);
}
