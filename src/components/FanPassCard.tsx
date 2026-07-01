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

  const year = new Date().getFullYear();

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
        {/* export target — the pass. `pass-develop` plays the shared develop ramp */}
        <div
          ref={cardRef}
          className="pass-develop relative overflow-hidden rounded-[20px]"
          style={{
            width: 300,
            height: 400,
            backgroundColor: "#f4f5f7",
            backgroundImage: [
              "repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(124,128,136,0.06) 19px, rgba(124,128,136,0.06) 20px)",
              "repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(124,128,136,0.06) 19px, rgba(124,128,136,0.06) 20px)",
              "radial-gradient(120% 70% at 50% 0%, rgba(255,255,255,0.7) 0%, transparent 55%)",
              "linear-gradient(165deg, #ffffff 0%, #f4f5f7 55%, #e6e9ed 100%)",
            ].join(", "),
            border: `2px solid ${theme.accent}55`,
            boxShadow: `3px 4px 0 ${theme.accent}30, 6px 7px 0 rgba(124,128,136,0.14), 0 10px 26px rgba(80,85,95,0.16), inset 0 0 0 1px rgba(255,255,255,0.6)`,
          }}
        >
          {/* ── idol banner (dominant) ── */}
          <div
            className="relative px-4 pb-3 pt-3"
            style={{ height: 132, background: `linear-gradient(140deg, ${theme.accent} 0%, #33363d 125%)` }}
          >
            <div className="font-orbitron text-[8px] font-bold uppercase tracking-[0.32em] text-white/70">FAN PASS ✦</div>
            <div className="mt-4 max-w-[190px] truncate font-orbitron text-[26px] font-black uppercase leading-none tracking-tight text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}>
              {topLabel}
            </div>
            <div className="mt-1.5 truncate text-[13px] font-bold text-white/90" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
              {idol.name}
              {idol.name_zh && idol.name_zh !== idol.name && <span className="ml-1 text-[11px] font-medium text-white/70">{idol.name_zh}</span>}
            </div>
            {/* circular idol badge, banner corner */}
            <div className="absolute right-4 top-4 h-[60px] w-[60px] overflow-hidden rounded-full border-[3px] border-white/85 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
              <Thumb src={idol.image_url} seed={idol.id} label={idol.name} rounded="rounded-full" focusY={idol.image_focus} />
            </div>
          </div>

          {/* ── member row (secondary: the fan) ── */}
          <div className="flex items-start gap-3 px-4 pt-4">
            {/* fan ID photo — small, clearly secondary */}
            <div
              className="shrink-0 overflow-hidden rounded-[10px] border-2 shadow-[2px_2px_0_rgba(124,128,136,0.28)]"
              style={{ width: 78, borderColor: `${theme.accent}66`, background: "linear-gradient(180deg,#fff,#eceef2)" }}
            >
              <div className="m-[3px] overflow-hidden rounded-[7px]">
                <div className="relative aspect-[3/4]">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="member" className="h-full w-full rounded-none object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#e9ebee] text-[10px] text-[#9aa0aa]">—</div>
                  )}
                </div>
              </div>
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="font-orbitron text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: theme.accent }}>{copy.passMember}</div>
              <div className="mt-1 truncate text-[17px] font-black text-[#1c1e24]">{fanName || "—"}</div>
              <div className="mt-0.5 font-orbitron text-[9px] tracking-[0.14em] text-[#9aa0aa]">{copy.passSince(year)}</div>
              <div className="mt-2 font-orbitron text-[8.5px] font-bold tracking-[0.1em] text-[#7c8088]">會員 · {result.code}</div>
            </div>
          </div>

          {/* ── footer ── */}
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-0.5 pb-3">
            <div className="font-orbitron text-[11px] font-black tracking-[0.2em]" style={{ color: theme.accent }}>{copy.passFooter}</div>
            <div className="font-orbitron text-[8px] font-bold tracking-[0.3em] text-[#7c8088]">✦&nbsp;KSTAR&nbsp;·&nbsp;{year}&nbsp;✦</div>
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
