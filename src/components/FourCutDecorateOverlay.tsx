"use client";

// Full-screen 人生四格 decorate editor. Two-column like the Fan ID's customize
// step: the strip sits sticky on the left with the live sticker canvas over it,
// the tabbed panel (貼紙 = edition + stickers, 名稱 = caption) on the right — same
// styling, same edition swatches, same sticker packs as the 追星證 editor.
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CardArtist } from "@/lib/lite";
import { useCopy, useLocale } from "@/lib/i18n/LocaleProvider";
import { exportNode } from "@/lib/exportImage";
import { FAN_ID_THEMES, type FanIdThemeId } from "@/lib/fanIdThemes";
import {
  normalizePlacedStickers,
  type CustomStickerPackId,
  type PlacedCustomSticker,
} from "@/lib/fanIdCustomStickers";
import { useFanIdLocalMedia } from "@/hooks/useFanIdLocalMedia";
import DecoratedFourCuts from "@/components/DecoratedFourCuts";
import FanIdStickerEditor from "@/components/FanIdStickerEditor";
import FanIdPhotoStudio from "@/components/FanIdPhotoStudio";

type Tab = "stickers" | "photo" | "caption";

function readSerial(): string | null {
  try { const p = JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}"); return typeof p.serial === "string" ? p.serial : null; }
  catch { return null; }
}

function readPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}") as Record<string, unknown>;
    const themeId = typeof p.fourCutThemeId === "string" && Object.prototype.hasOwnProperty.call(FAN_ID_THEMES, p.fourCutThemeId)
      ? p.fourCutThemeId as FanIdThemeId
      : (typeof p.themeId === "string" && Object.prototype.hasOwnProperty.call(FAN_ID_THEMES, p.themeId) ? p.themeId as FanIdThemeId : "chrome");
    return {
      themeId,
      caption: typeof p.fourCutCaption === "string" ? p.fourCutCaption.slice(0, 40) : "",
      stickers: normalizePlacedStickers(p.fourCutStickers),
    };
  } catch {
    return { themeId: "chrome" as FanIdThemeId, caption: "", stickers: [] as PlacedCustomSticker[] };
  }
}

export default function FourCutDecorateOverlay({ artists, open, onClose }: { artists: CardArtist[]; open: boolean; onClose: () => void }) {
  const copy = useCopy();
  const locale = useLocale();
  const nodeRef = useRef<HTMLDivElement>(null);
  const stickersRef = useRef<PlacedCustomSticker[]>([]);
  const [themeId, setThemeId] = useState<FanIdThemeId>("chrome");
  const [caption, setCaption] = useState("");
  const [stickers, setStickers] = useState<PlacedCustomSticker[]>([]);
  const [activePack, setActivePack] = useState<CustomStickerPackId>("chrome");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("stickers");
  const [exporting, setExporting] = useState<null | "download" | "share">(null);
  const [exportFailed, setExportFailed] = useState(false);
  // Shared per-idol photo store (same one the Fan ID uses) so photos picked here
  // show on both the four-cut and the 追星證.
  const media = useFanIdLocalMedia({ cardSerial: readSerial(), idolIds: artists.map((a) => a.id) });

  // Hydrate from prefs each time the editor opens.
  useEffect(() => {
    if (!open) return;
    const s = readPrefs();
    setThemeId(s.themeId);
    setCaption(s.caption);
    setStickers(s.stickers);
    stickersRef.current = s.stickers;
    setActivePack(s.themeId);
    setSelectedId(null);
    setActiveTab("stickers");
  }, [open]);

  const close = useCallback(() => { setSelectedId(null); onClose(); }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); close(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  function persist(patch: Record<string, unknown>) {
    try {
      const prefs = JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}");
      localStorage.setItem("kstar:prefs", JSON.stringify({ ...prefs, ...patch }));
      window.dispatchEvent(new Event("kstar:prefs-updated"));
    } catch {
      /* keep the on-screen edit even if storage is unavailable */
    }
  }

  function saveStickers(next: PlacedCustomSticker[]) {
    stickersRef.current = next;
    setStickers(next);
    persist({ fourCutStickers: next });
  }
  function updateSticker(id: string, patch: Partial<PlacedCustomSticker>) {
    saveStickers(stickersRef.current.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function pickEdition(id: FanIdThemeId) { setThemeId(id); setActivePack(id); persist({ fourCutThemeId: id }); }
  function editCaption(value: string) { const c = value.slice(0, 40); setCaption(c); persist({ fourCutCaption: c }); }

  async function runExport(kind: "download" | "share") {
    if (!nodeRef.current || exporting) return;
    setSelectedId(null);
    setExporting(kind);
    setExportFailed(false);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.all([...nodeRef.current.querySelectorAll("img")].map((im) => im.decode ? im.decode().catch(() => undefined) : Promise.resolve()));
    const { ok } = await exportNode(nodeRef.current, { fileName: "kstar-fourcut.png", kind, locale });
    if (!ok) setExportFailed(true);
    setExporting(null);
  }

  if (!open || typeof document === "undefined") return null;

  const editor = {
    stickers,
    selectedId,
    onSelect: setSelectedId,
    onTransform: updateSticker,
    onRemove: (id: string) => { saveStickers(stickersRef.current.filter((s) => s.id !== id)); if (selectedId === id) setSelectedId(null); },
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#f4f5f7]/92 backdrop-blur-sm" onClick={close}>
      <div className="mx-auto min-h-full max-w-4xl px-4 py-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-orbitron text-sm font-black tracking-wide text-[#1c1e24]">{copy.decorateFourCut}</h2>
          <button type="button" aria-label={copy.fourCutDone} onClick={close} className="grid h-8 w-8 place-items-center rounded-full border border-[#c8ccd2] bg-white text-[#5e636d] hover:bg-[#7c8088]/10">×</button>
        </div>

        <div className="flex flex-col items-center gap-4 lg:grid lg:grid-cols-[328px_minmax(0,1fr)] lg:items-start lg:gap-6">
          {/* Sticky strip + live sticker canvas */}
          <div className="shrink-0 lg:sticky lg:top-6 lg:justify-self-center">
            <DecoratedFourCuts ref={nodeRef} artists={artists} themeId={themeId} caption={caption} stickers={stickers} editor={editor} photoOverrides={media.idolPreviewSources} className="w-full max-w-[328px]" />
          </div>

          {/* Right panel — same shell/tabs as the Fan ID customize step */}
          <div className="w-full max-w-lg lg:max-w-none">
            <div role="tablist" aria-label={copy.decorateFourCut} className="flex gap-1 rounded-full border border-[#c8ccd2] bg-white/75 p-1">
              {(["stickers", "photo", "caption"] as const).map((tab) => {
                const selected = activeTab === tab;
                const label = tab === "stickers" ? (locale === "zh" ? "貼紙" : "Stickers")
                  : tab === "photo" ? (locale === "zh" ? "照片" : "Photo")
                  : copy.fourCutCaptionLabel;
                return (
                  <button key={tab} type="button" role="tab" aria-selected={selected} onClick={() => setActiveTab(tab)}
                    className={`min-h-[36px] flex-1 rounded-full px-2 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b4302b] ${selected ? "bg-[#1c1e24] text-white" : "text-[#5e636d] hover:bg-black/5"}`}>
                    {label}
                  </button>
                );
              })}
            </div>

            <section className="mt-2 space-y-4 rounded-2xl border border-[#c8ccd2] bg-white/75 p-4 shadow-sm">
              {activeTab === "stickers" && (
                <>
                  <div>
                    <p className="mb-2 text-xs font-bold text-[#5e636d]">{copy.fourCutFrameLabel}</p>
                    <div className="flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label={copy.fourCutFrameLabel}>
                      {Object.values(FAN_ID_THEMES).map((theme) => {
                        const selected = themeId === theme.id;
                        return (
                          <button key={theme.id} type="button" role="radio" aria-checked={selected} onClick={() => pickEdition(theme.id)}
                            className={`min-w-[84px] rounded-xl border-2 p-1.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b4302b] ${selected ? "border-[#b4302b] shadow-sm" : "border-transparent hover:border-[#c8ccd2]"}`}>
                            <span className="block h-9 rounded-lg border" style={{ backgroundImage: theme.surface, borderColor: theme.border }} />
                            <span className="mt-1 block truncate text-[10px] font-bold text-[#1c1e24]">{locale === "zh" ? theme.labelZh : theme.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <FanIdStickerEditor
                    selectedThemeId={activePack}
                    activePackId={activePack}
                    stickers={stickers}
                    onPackChange={setActivePack}
                    onChange={(next) => { saveStickers(next); setSelectedId(next.at(-1)?.id ?? null); }}
                  />
                  {stickers.length > 0 && <button type="button" onClick={() => { saveStickers([]); setSelectedId(null); }} className="w-full text-xs font-bold text-[#b4302b]">{copy.stickerClearPlaced}</button>}
                </>
              )}

              {activeTab === "photo" && (
                readSerial()
                  ? <FanIdPhotoStudio cardSerial={readSerial()!} picks={artists} cardMode="idol" media={media} />
                  : <p className="text-center text-[11px] text-[#9aa0aa]">{locale === "zh" ? "先領取追星證才能換照片。" : "Claim your Fan ID first to change photos."}</p>
              )}

              {activeTab === "caption" && (
                <label className="block text-xs font-bold text-[#5e636d]">
                  {copy.fourCutCaptionLabel}
                  <input value={caption} maxLength={40} onChange={(e) => editCaption(e.target.value)} placeholder={copy.fourCutCaptionPlaceholder} className="mt-1.5 w-full rounded-xl border border-[#c8ccd2] bg-white px-3 py-2.5 text-sm font-normal text-[#1c1e24] outline-none focus:border-[#7c8088]" />
                </label>
              )}
            </section>

            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button type="button" disabled={Boolean(exporting)} onClick={() => void runExport("download")} className="rounded-full bg-[#b4302b] px-4 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(180,48,43,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:brightness-110 disabled:opacity-50">{exporting === "download" ? copy.wizExporting : copy.fourCutDownload}</button>
                <button type="button" disabled={Boolean(exporting)} onClick={() => void runExport("share")} className="rounded-full border border-white/[0.68] px-4 py-2 text-xs font-bold text-[#1a1a1a] shadow-[0_1px_0_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] transition hover:brightness-95 disabled:opacity-50" style={{ backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.38))" }}>{exporting === "share" ? copy.wizExporting : copy.fourCutShare}</button>
              </div>
              {exportFailed && <p role="alert" className="text-center text-xs text-[#b4302b]">{copy.wizExportFailedGeneric}</p>}
              <button type="button" onClick={close} className="w-full rounded-xl bg-[#1c1e24] py-3 font-bold text-white">{copy.fourCutDone}</button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
