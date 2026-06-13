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
  scoups: 'S.Coups Choi Seung-cheol', joshua: 'Joshua Hong Seventeen', jun: 'Wen Jun-hui Seventeen',
  wonwoo: 'Jeon Won-woo Seventeen', woozi: 'Lee Ji-hoon Woozi', dk: 'Lee Seok-min DK Seventeen',
  mingyu: 'Kim Min-gyu Seventeen', the8: 'Xu Ming-hao The8', seungkwan: 'Boo Seung-kwan',
  vernon: 'Vernon Chwe Seventeen', dino: 'Lee Chan Dino Seventeen',
  hongjoong: 'Kim Hong-joong Ateez', seonghwa: 'Park Seong-hwa Ateez', yunho: 'Jeong Yun-ho Ateez',
  yeosang: 'Kang Yeo-sang Ateez', mingi: 'Song Min-gi Ateez', wooyoung: 'Jung Woo-young Ateez', jongho: 'Choi Jong-ho Ateez',
  irene: 'Bae Joo-hyun Irene', wendy: 'Son Seung-wan Wendy', joy: 'Park Soo-young Joy Red Velvet', yeri: 'Kim Ye-rim Yeri',
  lily: 'Lily NMIXX Morrow', haewon: 'Oh Hae-won NMIXX', bae: 'Bae NMIXX Jinsol', jiwoo: 'Kim Ji-woo NMIXX', kyujin: 'Jang Kyu-jin NMIXX',
  taeyong: 'Lee Tae-yong NCT', doyoung: 'Kim Dong-young Doyoung NCT', jaehyun: 'Jeong Jae-hyun NCT',
  haechan: 'Lee Dong-hyuck Haechan', jeno: 'Lee Je-no NCT', jaemin: 'Na Jae-min NCT', renjun: 'Huang Ren-jun NCT', jisung: 'Park Ji-sung NCT Dream',
  yoona: 'Im Yoon-ah', yuri: 'Kwon Yu-ri', tiffany: 'Tiffany Young Hwang', hyoyeon: 'Kim Hyo-yeon',
  // batch 2 — 五代團 (re-added inside the map; the earlier append landed outside it)
  yunah: 'Yunah ILLIT', minju: 'Minju ILLIT', moka: 'Moka ILLIT', wonhee: 'Wonhee ILLIT', iroha: 'Iroha ILLIT',
  shinyu: 'Shinyu TWS', dohoon: 'Dohoon TWS', youngjae: 'Youngjae TWS', hanjin: 'Hanjin TWS',
  "jihoon-tws": 'Jihoon TWS', kyungmin: 'Kyungmin TWS',
  sungho: 'Sungho Boynextdoor', riwoo: 'Riwoo Boynextdoor', "myung-jaehyun": 'Myung Jae-hyun Boynextdoor',
  taesan: 'Taesan Boynextdoor', leehan: 'Leehan Boynextdoor', woonhak: 'Woonhak Boynextdoor',
  ruka: 'Ruka Babymonster', pharita: 'Pharita Babymonster', asa: 'Asa Babymonster',
  rami: 'Rami Babymonster', rora: 'Rora Babymonster', chiquita: 'Chiquita Babymonster',
  julie: 'Julie Kiss of Life', belle: 'Belle Kiss of Life', haneul: 'Haneul Kiss of Life',
  shotaro: 'Shotaro Osaki RIIZE', eunseok: 'Song Eun-seok RIIZE', sungchan: 'Jung Sung-chan RIIZE',
  "sohee-riize": 'Sohee RIIZE', anton: 'Anton Lee RIIZE',
  "kim-jiwoong": 'Kim Ji-woong Zerobaseone', "zhang-hao": 'Zhang Hao Zerobaseone',
  "seok-matthew": 'Seok Matthew Zerobaseone', "kim-taerae": 'Kim Tae-rae Zerobaseone',
  ricky: 'Ricky Shen Zerobaseone', "kim-gyuvin": 'Kim Gyu-vin Zerobaseone',
  "park-gunwook": 'Park Gun-wook Zerobaseone', "han-yujin": 'Han Yu-jin Zerobaseone',
  jeemin: 'Jeemin izna', ella: 'Ella MEOVV',
  // batch 3 — 二代傳奇
  suho: 'Suho Kim Jun-myeon EXO', xiumin: 'Xiumin Kim Min-seok EXO', lay: 'Lay Zhang Yixing',
  baekhyun: 'Byun Baek-hyun EXO', chen: 'Chen Kim Jong-dae EXO', chanyeol: 'Park Chan-yeol EXO',
  "d-o": 'Doh Kyung-soo D.O. EXO', kai: 'Kai Kim Jong-in EXO', sehun: 'Oh Se-hun EXO',
  onew: 'Onew Lee Jin-ki SHINee', key: 'Key Kim Ki-bum SHINee', minho: 'Choi Min-ho SHINee', taemin: 'Lee Tae-min SHINee',
  "g-dragon": 'G-Dragon Kwon Ji-yong', taeyang: 'Taeyang Dong Young-bae BIGBANG', daesung: 'Kang Dae-sung BIGBANG',
  cl: 'CL Lee Chae-rin 2NE1', bom: 'Park Bom 2NE1', dara: 'Sandara Park 2NE1', minzy: 'Gong Min-ji Minzy 2NE1',
  gyuri: 'Park Gyu-ri KARA', seungyeon: 'Han Seung-yeon KARA', nicole: 'Nicole Jung KARA',
  jiyoung: 'Kang Ji-young KARA', youngji: 'Heo Young-ji KARA',
  sunye: 'Min Sun-ye Wonder Girls', yeeun: 'Park Ye-eun Hatfelt', sunmi: 'Sunmi Lee Sun-mi singer',
  sohee: 'Ahn So-hee', yubin: 'Kim Yu-bin Wonder Girls',
  leeteuk: 'Leeteuk Park Jeong-su Super Junior', heechul: 'Kim Hee-chul Super Junior',
  eunhyuk: 'Eunhyuk Lee Hyuk-jae Super Junior', donghae: 'Lee Dong-hae Super Junior',
  siwon: 'Choi Si-won Super Junior', kyuhyun: 'Cho Kyu-hyun Super Junior',
  "jun-k": 'Jun. K 2PM Kim Min-jun', nichkhun: 'Nichkhun Horvejkul 2PM', taecyeon: 'Ok Taec-yeon 2PM',
  "wooyoung-2pm": 'Jang Woo-young 2PM', junho: 'Lee Jun-ho 2PM', chansung: 'Hwang Chan-sung 2PM',
  chorong: 'Park Cho-rong Apink', bomi: 'Yoon Bo-mi Apink', eunji: 'Jeong Eun-ji Apink',
  naeun: 'Son Na-eun Apink', namjoo: 'Kim Nam-joo Apink', hayoung: 'Oh Ha-young Apink',
  // batch 4 — 三四代補強
  "jay-b": 'Jay B GOT7 singer', "mark-got7": 'Mark Tuan GOT7', jackson: 'Jackson Wang singer',
  "jinyoung-got7": 'Jinyoung GOT7 actor', "youngjae-got7": 'Youngjae GOT7 Choi', bambam: 'BamBam GOT7', yugyeom: 'Yugyeom GOT7',
  solar: 'Solar Mamamoo singer', moonbyul: 'Moonbyul Mamamoo', wheein: 'Wheein Mamamoo', hwasa: 'Hwasa Mamamoo',
  shownu: 'Shownu Monsta X', minhyuk: 'Minhyuk Monsta X Lee', kihyun: 'Kihyun Monsta X', hyungwon: 'Hyungwon Monsta X',
  joohoney: 'Joohoney Monsta X Jooheon', "i-m": 'I.M Monsta X Changkyun',
  jiu: 'JiU Dreamcatcher', sua: 'SuA Dreamcatcher', siyeon: 'Siyeon Dreamcatcher', handong: 'Handong Dreamcatcher',
  yoohyeon: 'Yoohyeon Dreamcatcher', dami: 'Dami Dreamcatcher', gahyeon: 'Gahyeon Dreamcatcher',
  hyojung: 'Hyojung Oh My Girl', mimi: 'Mimi Oh My Girl Kim', yooa: 'YooA Oh My Girl', seunghee: 'Seunghee Oh My Girl Hyun',
  binnie: 'Binnie Oh My Girl Bae', arin: 'Arin Oh My Girl Choi',
  saerom: 'Lee Sae-rom fromis_9', "hayoung-fromis": 'Song Ha-young fromis_9', jiwon: 'Park Ji-won fromis_9',
  jisun: 'Roh Ji-sun fromis_9', seoyeon: 'Lee Seo-yeon fromis_9', "chaeyoung-fromis": 'Lee Chae-young fromis_9',
  nagyung: 'Lee Na-gyung fromis_9', jiheon: 'Baek Ji-heon fromis_9',
  sumin: 'Sumin STAYC singer', sieun: 'Sieun STAYC', isa: 'Isa STAYC singer', seeun: 'Seeun STAYC',
  "yoon-stayc": 'Yoon STAYC singer', "j-stayc": 'J STAYC Jang Ye-eun',
  "choi-yujin": 'Choi Yu-jin Kep1er', xiaoting: 'Xiaoting Kep1er Shen', mashiro: 'Mashiro Kep1er Sakamoto',
  chaehyun: 'Kim Chae-hyun Kep1er', dayeon: 'Dayeon Kep1er', hikaru: 'Hikaru Kep1er Ezaki',
  yeseo: 'Kang Ye-seo Kep1er', bahiyyih: 'Bahiyyih Kep1er', youngeun: 'Seo Young-eun Kep1er',
  eunha: 'Eunha GFriend Viviz', sinb: 'SinB GFriend Viviz', umji: 'Umji GFriend Viviz',
  sangyeon: 'Sangyeon The Boyz', jacob: 'Jacob The Boyz', younghoon: 'Younghoon The Boyz',
  hyunjae: 'Hyunjae The Boyz', juyeon: 'Juyeon The Boyz', kevin: 'Kevin Moon The Boyz',
  "new-theboyz": 'New The Boyz Choi Chan-hee', "q-theboyz": 'Q The Boyz Ji Chang-min',
  sunwoo: 'Sunwoo The Boyz Kim', "eric-theboyz": 'Eric The Boyz Son Young-jae',
  seola: 'Seola WJSN Cosmic Girls', bona: 'Bona WJSN Cosmic Girls', exy: 'Exy WJSN Cosmic Girls',
  "soobin-wjsn": 'Soobin WJSN Cosmic Girls', luda: 'Luda WJSN Cosmic Girls', dawon: 'Dawon WJSN Cosmic Girls',
  eunseo: 'Eunseo WJSN Cosmic Girls', dayoung: 'Dayoung WJSN Cosmic Girls', yeoreum: 'Yeoreum WJSN Cosmic Girls',
  yeonjung: 'Yeonjung WJSN Cosmic Girls',
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
