// Fetch CC-licensed idol photos from Wikimedia Commons into public/idols/.
//
// Usage: node scripts/fetch-idol-photos.mjs [artist-id ...]   (no args = all 44)
//
// Policy: free licenses only (CC0 / CC BY / CC BY-SA / Public domain);
// prefer photos taken after 2025-06, else newest available; portrait and
// "(cropped)" head-shot files get a ranking bonus. Existing files are
// skipped unless --force. Attribution recorded in public/idols/attribution.json.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const idolsDir = path.join(root, "public/idols");
const attribPath = path.join(idolsDir, "attribution.json");

const UA = "KStarIdolDiscovery/0.1 (personal project; contact: ss7306@columbia.edu)";
const API = "https://commons.wikimedia.org/w/api.php";
const RECENT_CUTOFF = Date.parse("2025-06-01");

// artist-id → Commons search query (disambiguated)
const SEARCH = {
  karina: 'Karina aespa', winter: 'Winter aespa singer', ningning: 'Ningning aespa',
  minji: 'Minji NewJeans', hanni: 'Hanni NewJeans', haerin: 'Haerin NewJeans',
  wonyoung: 'Jang Won-young', "an-yujin": 'An Yu-jin IVE',
  jennie: 'Jennie Kim BLACKPINK', jisoo: 'Jisoo BLACKPINK', lisa: 'Lalisa Manobal', rose: 'Roseanne Park BLACKPINK',
  jungkook: 'Jungkook', "bts-v": 'Kim Tae-hyung', jimin: 'Park Ji-min BTS', rm: 'RM rapper BTS',
  jin: 'Kim Seok-jin BTS', "j-hope": 'J-Hope',
  nayeon: 'Im Na-yeon TWICE', sana: 'Minatozaki Sana', momo: 'Hirai Momo', tzuyu: 'Chou Tzu-yu',
  hyunjin: 'Hwang Hyun-jin Stray Kids', felix: 'Felix Lee Stray Kids', "bang-chan": 'Bang Chan Stray Kids',
  sakura: 'Miyawaki Sakura', "kim-chaewon": 'Kim Chae-won LE SSERAFIM',
  soyeon: 'Jeon So-yeon G-IDLE', jeonghan: 'Yoon Jeong-han Seventeen', hoshi: 'Kwon Soon-young Hoshi',
  yeonjun: 'Choi Yeon-jun TXT', soobin: 'Choi Soo-bin TXT',
  taeyeon: 'Kim Tae-yeon Girls Generation', iu: 'IU Lee Ji-eun singer',
  yeji: 'Hwang Ye-ji ITZY', ahyeon: 'Ahyeon Babymonster', seulgi: 'Kang Seul-gi Red Velvet',
  sullyoon: 'Sullyoon NMIXX', natty: 'Natty Kiss of Life singer',
  niki: 'Ni-ki Enhypen', wonbin: 'Park Won-bin RIIZE', "sung-hanbin": 'Sung Han-bin Zerobaseone',
  san: 'Choi San Ateez', mark: 'Mark Lee NCT',
  jeongyeon: 'Yoo Jeong-yeon TWICE', jihyo: 'Park Ji-hyo TWICE', mina: 'Myoui Mina TWICE',
  dahyun: 'Kim Da-hyun TWICE', chaeyoung: 'Son Chae-young TWICE',
  "lee-know": 'Lee Know Stray Kids Minho', changbin: 'Seo Chang-bin Stray Kids', han: 'Han Ji-sung Stray Kids',
  seungmin: 'Kim Seung-min Stray Kids', "i-n": 'I.N Yang Jeong-in Stray Kids',
  heeseung: 'Lee Hee-seung Enhypen', jay: 'Jay Enhypen Park', jake: 'Jake Enhypen Sim',
  sunghoon: 'Park Sung-hoon Enhypen', sunoo: 'Kim Sun-oo Enhypen', jungwon: 'Yang Jung-won Enhypen',
  lia: 'Lia ITZY Choi', ryujin: 'Shin Ryu-jin ITZY', chaeryeong: 'Lee Chae-ryeong ITZY', yuna: 'Shin Yu-na ITZY',
  gaeul: 'Gaeul IVE', rei: 'Rei IVE Naoi', liz: 'Liz IVE Kim Jiwon', leeseo: 'Lee-seo IVE',
  "huh-yunjin": 'Huh Yun-jin LE SSERAFIM', kazuha: 'Nakamura Kazuha', "hong-eunchae": 'Hong Eun-chae',
  miyeon: 'Cho Mi-yeon G-IDLE', minnie: 'Minnie G-IDLE Nicha', yuqi: 'Song Yu-qi', shuhua: 'Yeh Shu-hua',
  beomgyu: 'Choi Beom-gyu TXT', taehyun: 'Kang Tae-hyun TXT', hueningkai: 'Huening Kai',
  giselle: 'Giselle aespa Uchinaga', danielle: 'Danielle NewJeans Marsh', hyein: 'Hyein NewJeans',
  suga: 'Suga BTS Min Yoon-gi',
};

const FREE_LICENSE = /^(cc0|cc[ -]by(?:[ -]sa)?(?:[ -]\d|\b)|public domain|pd)/i;

const force = process.argv.includes("--force");
const onlyIds = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const ids = onlyIds.length ? onlyIds : Object.keys(SEARCH);

const attribution = fs.existsSync(attribPath) ? JSON.parse(fs.readFileSync(attribPath, "utf8")) : {};
fs.mkdirSync(idolsDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", ...params })}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

function parseDate(md) {
  const raw = md.DateTimeOriginal?.value ?? md.DateTime?.value ?? "";
  const m = String(raw).match(/(\d{4})-(\d{2})-(\d{2})|(\d{4})/);
  if (!m) return 0;
  return Date.parse(m[1] ? `${m[1]}-${m[2]}-${m[3]}` : `${m[4]}-01-01`) || 0;
}

function stripHtml(s) {
  return String(s ?? "").replace(/<[^>]*>/g, "").trim();
}

async function fetchOne(id) {
  const file = path.join(idolsDir, `${id}.jpg`);
  if (fs.existsSync(file) && !force) return { id, status: "exists" };

  const data = await api({
    action: "query",
    generator: "search",
    gsrsearch: `filetype:bitmap ${SEARCH[id]}`,
    gsrnamespace: "6",
    gsrlimit: "25",
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "800",
  });

  const pages = Object.values(data.query?.pages ?? {});
  const candidates = [];
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii) continue;
    const md = ii.extmetadata ?? {};
    const license = stripHtml(md.LicenseShortName?.value);
    if (!FREE_LICENSE.test(license)) continue;            // hard license gate
    if (!/\.(jpe?g|png|webp)$/i.test(p.title)) continue;
    if (ii.width < 500) continue;
    const date = parseDate(md);
    let score = date / 1e10;                               // newer = better baseline
    if (date >= RECENT_CUTOFF) score += 1000;              // within-a-year strongly preferred
    if (ii.height > ii.width) score += 50;                 // portrait bonus
    if (/cropped/i.test(p.title)) score += 80;             // head-crop bonus
    if (ii.width >= 1000) score += 10;
    candidates.push({ title: p.title, ii, md, license, date, score });
  }
  if (!candidates.length) return { id, status: "no-cc-photo" };

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const url = best.ii.thumburl ?? best.ii.url;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return { id, status: `download-failed-${res.status}` };
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));

  attribution[id] = {
    file: best.title,
    page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(best.title.replace(/ /g, "_"))}`,
    author: stripHtml(best.md.Artist?.value).slice(0, 120),
    license: best.license,
    date: best.date ? new Date(best.date).toISOString().slice(0, 10) : "unknown",
  };
  return { id, status: "ok", title: best.title, license: best.license, date: attribution[id].date, recent: best.date >= RECENT_CUTOFF };
}

const results = [];
for (const id of ids) {
  try {
    const r = await fetchOne(id);
    results.push(r);
    const tag = r.status === "ok" ? `✓ ${r.date}${r.recent ? "" : " (older fallback)"} ${r.license} — ${r.title}` : r.status;
    console.log(`${id.padEnd(12)} ${tag}`);
  } catch (e) {
    results.push({ id, status: `error: ${e.message}` });
    console.log(`${id.padEnd(12)} error: ${e.message}`);
  }
  await sleep(700);
}

fs.writeFileSync(attribPath, JSON.stringify(attribution, null, 2) + "\n");
const ok = results.filter((r) => r.status === "ok" || r.status === "exists").length;
const none = results.filter((r) => r.status === "no-cc-photo").map((r) => r.id);
console.log(`\nphotos available: ${ok}/${ids.length}`);
if (none.length) console.log(`no CC photo found: ${none.join(", ")}`);
