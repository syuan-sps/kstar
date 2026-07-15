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
import { exportNode } from "@/lib/exportImage";
import { pickTheme } from "@/lib/cardTheme";
import { MiniPhotoCard } from "@/components/SoulStoryCard";
import FanIdCard from "@/components/FanIdCard";
import { useCopy, useLocale } from "@/lib/i18n/LocaleProvider";

// Stable 4-digit fan serial — derived once per user, then persisted in prefs
// (djb2-style hash; not a scarcity claim, just a stable-looking ID).
function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

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
  const copy = useCopy();
  const locale = useLocale();
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
  const [showFace, setShowFace] = useState(true); // Version A (本人) vs B (純分享)

  // Stable per-user serial — derived once, then persisted like fanName/joinedAt.
  const [serial] = useState<string>(() => {
    if (typeof window === "undefined") return "0000";
    try {
      const p = JSON.parse(localStorage.getItem("kstar:prefs") || "{}");
      if (typeof p.serial === "string" && p.serial) return p.serial;
      const s = String(hashCode(String(Date.now()) + Math.random()) % 10000).padStart(4, "0");
      p.serial = s;
      localStorage.setItem("kstar:prefs", JSON.stringify(p));
      return s;
    } catch { return "0000"; }
  });

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
      shareText: copy.passShareText(idol.group ?? copy.passSolo),
      locale,
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

  // ── Step 4: the rendered fan ID (mirror-chrome card) ────────────────
  if (step === "card" && idol && theme) {
    const tags = [`#${result.archetype.name.zh}`, `#${topLabel}`, "#追星靈魂"];
    return (
      <div className="flex flex-col items-center gap-4">
        <div ref={cardRef} className="pass-develop">
          <FanIdCard
            hero={idol}
            result={result}
            fanName={fanName || undefined}
            tags={tags}
            issuedAt={joinedAt}
            serial={serial}
            showFace={showFace}
            facePhoto={photo}
          />
        </div>

        {/* 本人 / 純分享版 toggle (not exported as a control, only its effect is) */}
        <div className="inline-flex rounded-full border border-[#c8ccd2] bg-white p-0.5 text-xs font-bold">
          <button
            onClick={() => setShowFace(true)}
            className={`rounded-full px-3 py-1 transition ${showFace ? "bg-[#1c1e24] text-white" : "text-[#7c8088] hover:bg-[#7c8088]/10"}`}
          >
            本人版
          </button>
          <button
            onClick={() => setShowFace(false)}
            className={`rounded-full px-3 py-1 transition ${!showFace ? "bg-[#1c1e24] text-white" : "text-[#7c8088] hover:bg-[#7c8088]/10"}`}
          >
            純分享版
          </button>
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
            {busy ? copy.processing : copy.passDownload}
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
        {failed && <p className="text-center text-[11px] text-[#b4302b]">{copy.exportFailedPass}</p>}
      </div>
    );
  }

  return null;
}
