"use client";

// 應援卡 — a fan-made membership card for one of the user's picks. Idol branding
// dominates (group-name banner + idol badge); the fan's own cropped photo is a
// small secondary ID badge. Entirely client-side: the uploaded photo is read,
// cropped on a canvas, and kept only in component state — it never leaves the
// browser. Card colour comes from the shared per-idol theme (cardTheme) so it
// matches the 圖鑑 small-cards. Export reuses exportNode() like SoulStoryCard.

import { useRef, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import type { CardArtist } from "@/lib/lite";
import type { ArchetypeResult } from "@/lib/archetypes";
import { copy } from "@/lib/copy";
import { exportNode } from "@/lib/exportImage";
import { pickTheme } from "@/lib/cardTheme";
import Thumb from "@/components/Thumb";
import { MiniPhotoCard } from "@/components/SoulStoryCard";

type Area = { x: number; y: number; width: number; height: number };
type Step = "pick" | "upload" | "crop" | "card";

const CROP_ASPECT = 3 / 4; // ID-photo portrait, matching the app's photo slots

// Crop the source image to `area` (in source pixels) → PNG data URL, on canvas.
async function getCroppedImg(imageSrc: string, area: Area): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width));
  canvas.height = Math.max(1, Math.round(area.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) return imageSrc;
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

export default function FanPassCard({ result, picks }: { result: ArchetypeResult; picks: CardArtist[] }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>("pick");
  const [idol, setIdol] = useState<CardArtist | null>(null);

  const [rawImage, setRawImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPx, setAreaPx] = useState<Area | null>(null);
  const [photo, setPhoto] = useState<string | null>(null); // final cropped fan photo

  // Prefill from prefs (lenient — old prefs objects may lack fanName). Read via a
  // lazy initializer; this modal-only card is never in the SSR tree, so there's no
  // hydration mismatch, and it avoids a setState-in-effect.
  const [fanName, setFanName] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      const p = JSON.parse(localStorage.getItem("kstar:prefs") || "{}");
      return typeof p.fanName === "string" ? p.fanName : "";
    } catch { return ""; }
  });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  // Join date printed on the pass — stamped once (today for existing users who
  // never had it), then stable across visits. Persisted to prefs like fanName.
  const [joinedAt] = useState<string>(() => {
    const today = () => {
      const d = new Date();
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    };
    if (typeof window === "undefined") return today();
    try {
      const p = JSON.parse(localStorage.getItem("kstar:prefs") || "{}");
      if (typeof p.joinedAt === "string" && p.joinedAt) return p.joinedAt;
      const t = today();
      p.joinedAt = t;
      localStorage.setItem("kstar:prefs", JSON.stringify(p));
      return t;
    } catch { return today(); }
  });

  function saveFanName(name: string) {
    try {
      const p = JSON.parse(localStorage.getItem("kstar:prefs") || "{}");
      p.fanName = name;
      localStorage.setItem("kstar:prefs", JSON.stringify(p));
    } catch { /* ignore */ }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawImage(String(reader.result));
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setStep("crop");
    };
    reader.readAsDataURL(f);
  }

  async function confirmCrop() {
    if (!rawImage || !areaPx) return;
    setPhoto(await getCroppedImg(rawImage, areaPx));
    setStep("card");
  }

  async function run(kind: "download" | "share") {
    if (!cardRef.current || busy || !idol) return;
    setBusy(true); setFailed(false);
    const { ok } = await exportNode(cardRef.current, {
      fileName: `kstar-pass-${idol.id}.png`,
      pixelRatio: 4,
      kind,
      shareText: `${idol.group ?? copy.passSolo} 應援卡 ✦`,
    });
    if (!ok) setFailed(true);
    setBusy(false);
  }

  const theme = idol ? pickTheme(idol.id) : null;
  const topLabel = idol ? (idol.group ?? copy.passSolo) : "";

  // ── Step 1: choose which pick this pass is for ──────────────────────
  if (step === "pick") {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-bold text-[#1c1e24]">{copy.passPickIdol}</p>
        <div className="grid grid-cols-4 gap-2">
          {picks.slice(0, 4).map((a) => (
            <button
              key={a.id}
              onClick={() => { setIdol(a); setStep("upload"); }}
              className="w-[68px] rounded-[12px] transition hover:-translate-y-0.5"
            >
              <MiniPhotoCard a={a} accent={pickTheme(a.id).accent} label />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Step 2: upload a photo (client-side only) ───────────────────────
  if (step === "upload" && idol) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-bold text-[#1c1e24]">{copy.passUploadTitle}</p>
        <p className="text-xs text-[#7c8088]">{topLabel} · {idol.name}</p>
        <label className="cursor-pointer rounded-full bg-[#b4302b] px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_12px_rgba(180,48,43,0.4)] transition hover:brightness-110">
          {copy.passUploadBtn}
          <input type="file" accept="image/jpeg,image/png" onChange={onFile} className="hidden" />
        </label>
        <p className="text-[11px] text-[#9aa0aa]">{copy.passUploadHint}</p>
        <button onClick={() => setStep("pick")} className="text-xs text-[#7c8088]/70 hover:text-[#7c8088]">{copy.passChangeIdol}</button>
      </div>
    );
  }

  // ── Step 3: crop / zoom into the ID slot ────────────────────────────
  if (step === "crop" && rawImage) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-bold text-[#1c1e24]">{copy.passCropTitle}</p>
        <div className="relative h-[300px] w-[240px] overflow-hidden rounded-2xl border-2 border-[#c8ccd2] bg-[#1c1e24]">
          <Cropper
            image={rawImage}
            crop={crop}
            zoom={zoom}
            aspect={CROP_ASPECT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_area, px) => setAreaPx(px)}
          />
        </div>
        <input
          type="range" min={1} max={3} step={0.05} value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="zoom"
          className="w-[220px] accent-[#b4302b]"
        />
        <p className="text-[11px] text-[#9aa0aa]">{copy.passCropHint}</p>
        <div className="flex items-center gap-2">
          <button onClick={confirmCrop} className="rounded-full bg-[#b4302b] px-5 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(180,48,43,0.4)] transition hover:brightness-110">
            {copy.passCropConfirm}
          </button>
          <button onClick={() => setStep("upload")} className="rounded-full border border-[#c8ccd2] bg-white px-4 py-2 text-xs font-bold text-[#1c1e24] transition hover:bg-[#7c8088]/10">
            {copy.passRetake}
          </button>
        </div>
      </div>
    );
  }

  // ── Step 4: the rendered fan pass ───────────────────────────────────
  if (step === "card" && idol && theme) {
    return (
      <div className="flex flex-col items-center gap-4">
        {/* export target — luxury/metallic membership pass, fan-photo hero on the
            right, idol foil coin at the seam. pass-develop plays the shared ramp.
            HERO_W is the full-height fan-photo panel; BODY_W the left info column. */}
        <div
          ref={cardRef}
          className="pass-develop relative overflow-hidden rounded-[16px]"
          style={{
            width: 300,
            height: 212,
            backgroundColor: "#eef0f3",
            // brushed-metal base + guilloché security texture (fine radial + hatch)
            backgroundImage: [
              "repeating-conic-gradient(from 0deg at 82% 40%, rgba(124,128,136,0.045) 0deg, rgba(124,128,136,0.045) 4deg, transparent 4deg, transparent 8deg)",
              "repeating-radial-gradient(circle at 82% 40%, transparent 0, transparent 5px, rgba(124,128,136,0.05) 5px, rgba(124,128,136,0.05) 6px)",
              "repeating-linear-gradient(115deg, transparent 0, transparent 2px, rgba(255,255,255,0.35) 2px, rgba(255,255,255,0.35) 3px, transparent 3px, transparent 7px)",
              "linear-gradient(160deg, #ffffff 0%, #eef0f3 46%, #dfe3e9 100%)",
            ].join(", "),
            border: `1.5px solid ${theme.accent}80`,
            boxShadow: `2px 3px 0 ${theme.accent}38, 0 12px 30px rgba(70,78,92,0.20), inset 0 0 0 1px rgba(255,255,255,0.7), inset 0 1px 0 rgba(255,255,255,0.9)`,
          }}
        >
          {/* corner ✦ sticker */}
          <span className="absolute left-2 top-1.5 z-30 text-[10px] leading-none text-[#7c8088]">✦</span>

          {/* ── header band (idol accent + holo streak) ── */}
          <div
            className="relative overflow-hidden px-3.5 pb-2 pt-2"
            style={{
              height: 60,
              background: `linear-gradient(135deg, #ffffff44 0%, ${theme.accent} 48%, #2f333b 128%)`,
              borderBottom: "1.5px solid rgba(255,255,255,0.55)",
            }}
          >
            {/* holo streak + fine vertical hatch */}
            <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(115deg, transparent 38%, rgba(255,255,255,0.4) 50%, transparent 62%)" }} />
            <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: "repeating-linear-gradient(90deg, transparent 0, transparent 3px, rgba(255,255,255,0.06) 3px, rgba(255,255,255,0.06) 4px)" }} />
            <div className="relative z-10 font-orbitron text-[7.5px] font-bold uppercase tracking-[0.34em] text-white/80">✦ FAN PASS ✦</div>
            <div className="relative z-10 mt-1 flex items-end gap-2">
              <div className="max-w-[130px] truncate font-orbitron text-[23px] font-black uppercase leading-none tracking-tight text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.5)" }}>
                {topLabel}
              </div>
              <div className="truncate pb-0.5 text-[11px] font-bold text-white/95" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}>
                {idol.name}
                {idol.name_zh && idol.name_zh !== idol.name && <span className="ml-1 text-[10px] font-medium text-white/75">{idol.name_zh}</span>}
              </div>
            </div>
          </div>

          {/* ── fan-photo hero (full-height right panel) ── */}
          <div
            className="absolute right-0 top-0 z-10 h-full overflow-hidden"
            style={{
              width: 98,
              borderLeft: "1.5px solid rgba(255,255,255,0.75)",
              boxShadow: "inset 2px 0 6px rgba(70,78,92,0.18)",
              background: "linear-gradient(160deg,#d9dde2,#9aa0aa)",
            }}
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="member" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-white/70">✦</div>
            )}
            {/* gloss */}
            <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(255,255,255,0.28), transparent 45%)" }} />
          </div>

          {/* ── idol foil coin (straddles header/photo seam) ── */}
          <div
            className="absolute z-20 rounded-full"
            style={{
              top: 44, right: 104, width: 44, height: 44, padding: 2.5,
              background: "conic-gradient(from 210deg, #e9eef5, #9fb1cc, #f4f6fa, #56789f, #cdd6e4, #e9eef5)",
              boxShadow: "0 3px 8px rgba(0,0,0,0.32), inset 0 0 0 1px rgba(255,255,255,0.6)",
            }}
          >
            <div className="h-full w-full overflow-hidden rounded-full border-[1.5px] border-white">
              <Thumb src={idol.image_url} seed={idol.id} label={idol.name} rounded="rounded-full" focusY={idol.image_focus} />
            </div>
          </div>

          {/* ── left info column ── */}
          <div className="absolute left-0 top-[60px] z-10 px-3.5 pt-3" style={{ width: 202 }}>
            {/* embossed hairline */}
            <div className="mb-2.5" style={{ height: 0, borderTop: "1px solid rgba(124,128,136,0.28)", borderBottom: "1px solid rgba(255,255,255,0.85)" }} />
            <div className="font-orbitron text-[8px] font-bold uppercase tracking-[0.24em]" style={{ color: theme.accent }}>{copy.passMember}</div>
            {fanName ? (
              <div className="max-w-[168px] truncate text-[17px] font-black leading-tight text-[#1c1e24]">{fanName}</div>
            ) : (
              <div className="text-[13px] font-medium leading-tight text-[#aab0ba]">{copy.passNamePlaceholder}</div>
            )}
            <div className="mt-1.5 font-orbitron text-[8px] tracking-[0.1em] text-[#9aa0aa]">SINCE {joinedAt}</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span
                className="font-orbitron text-[19px] font-black tracking-[0.1em]"
                style={{ background: `linear-gradient(135deg, ${theme.accent}, #9fb1cc)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
              >
                {result.code.toUpperCase()}
              </span>
              <span className="text-[8px] tracking-[0.06em] text-[#7c8088]">追星靈魂</span>
            </div>
          </div>

          {/* ── barcode + 應援中 seal (bottom of left column) ── */}
          <div className="absolute bottom-3 left-0 z-10 flex items-center gap-2.5 px-3.5" style={{ width: 202 }}>
            <div
              className="h-[24px] flex-1 rounded-[2px]"
              style={{ opacity: 0.8, backgroundImage: "repeating-linear-gradient(90deg, #1c1e24 0 2px, transparent 2px 4px, #1c1e24 4px 5px, transparent 5px 8px)" }}
            />
            <div
              className="shrink-0 -rotate-[5deg] rounded-full border-[1.5px] px-2 py-0.5 font-orbitron text-[9px] font-extrabold tracking-[0.1em]"
              style={{ borderColor: theme.accent, color: theme.accent, opacity: 0.92 }}
            >
              {copy.passSeal}
            </div>
          </div>
        </div>

        {/* name input (not exported) */}
        <input
          type="text"
          value={fanName}
          onChange={(e) => setFanName(e.target.value)}
          onBlur={(e) => saveFanName(e.target.value)}
          placeholder={copy.passNamePlaceholder}
          maxLength={20}
          className="w-[240px] rounded-xl border border-[#c8ccd2]/60 bg-white px-3 py-2 text-center text-sm text-[#1c1e24] outline-none focus:border-[#56789f] focus:ring-1 focus:ring-[#56789f]/30"
        />

        {/* actions (not exported) — same pattern as SoulStoryCard */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button onClick={() => run("download")} disabled={busy}
            className="rounded-full bg-[#b4302b] px-4 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(180,48,43,0.4)] transition hover:brightness-110 disabled:opacity-50">
            {busy ? "處理中…" : copy.passDownload}
          </button>
          <button onClick={() => run("share")} disabled={busy}
            className="rounded-full border border-[#c8ccd2] bg-white px-4 py-2 text-xs font-bold text-[#1c1e24] transition hover:bg-[#7c8088]/10 disabled:opacity-50">
            {copy.shareShare}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setStep("crop")} className="text-xs text-[#7c8088]/70 hover:text-[#7c8088]">{copy.passRetake}</button>
          <button onClick={() => { setStep("pick"); setPhoto(null); setRawImage(null); }} className="text-xs text-[#7c8088]/70 hover:text-[#7c8088]">{copy.passChangeIdol}</button>
        </div>
        {failed && <p className="text-center text-[11px] text-[#b4302b]">圖片匯出失敗 — 直接長按／截圖這張卡分享吧 ✦</p>}
      </div>
    );
  }

  return null;
}
