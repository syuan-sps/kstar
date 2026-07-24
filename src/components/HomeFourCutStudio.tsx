"use client";

// Home-showcase lead-tab surface for the 人生四格: shows the decorated strip
// (edition mat + stickers + caption) with a 裝飾 button that opens the full-screen
// two-column editor, plus download/share and re-pick. Editing lives in the overlay.
import { useCallback, useEffect, useRef, useState } from "react";
import type { CardArtist } from "@/lib/lite";
import { useCopy, useLocale } from "@/lib/i18n/LocaleProvider";
import { exportNode } from "@/lib/exportImage";
import { FAN_ID_THEMES, type FanIdThemeId } from "@/lib/fanIdThemes";
import { normalizePlacedStickers, type PlacedCustomSticker } from "@/lib/fanIdCustomStickers";
import { CARD_BTN_PRIMARY, CARD_BTN_SECONDARY, CARD_BTN_SECONDARY_STYLE, CARD_BTN_DARK, CARD_BTN_GHOST } from "@/lib/cardActionStyles";
import { useFanIdLocalMedia } from "@/hooks/useFanIdLocalMedia";
import DecoratedFourCuts from "@/components/DecoratedFourCuts";
import FourCutDecorateOverlay from "@/components/FourCutDecorateOverlay";

function readSerial(): string | null {
  try { const p = JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}"); return typeof p.serial === "string" ? p.serial : null; }
  catch { return null; }
}

function readFourCut() {
  try {
    const p = JSON.parse(localStorage.getItem("kstar:prefs") ?? "{}") as Record<string, unknown>;
    const has = (v: unknown): v is FanIdThemeId => typeof v === "string" && Object.prototype.hasOwnProperty.call(FAN_ID_THEMES, v);
    const themeId: FanIdThemeId = has(p.fourCutThemeId) ? p.fourCutThemeId : has(p.themeId) ? p.themeId : "chrome";
    return {
      themeId,
      caption: typeof p.fourCutCaption === "string" ? p.fourCutCaption.slice(0, 40) : "",
      stickers: normalizePlacedStickers(p.fourCutStickers),
    };
  } catch {
    return { themeId: "chrome" as FanIdThemeId, caption: "", stickers: [] as PlacedCustomSticker[] };
  }
}

export default function HomeFourCutStudio({ artists, onRepick }: { artists: CardArtist[]; onRepick: () => void }) {
  const copy = useCopy();
  const locale = useLocale();
  const nodeRef = useRef<HTMLDivElement>(null);
  const [themeId, setThemeId] = useState<FanIdThemeId>("chrome");
  const [caption, setCaption] = useState("");
  const [stickers, setStickers] = useState<PlacedCustomSticker[]>([]);
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<null | "download" | "share">(null);
  const [exportFailed, setExportFailed] = useState(false);
  // Same per-idol photo store the Fan ID uses, so a photo picked in either place
  // shows on both the four-cut and the 追星證.
  const media = useFanIdLocalMedia({ cardSerial: readSerial(), idolIds: artists.map((a) => a.id) });

  const load = useCallback(() => {
    const s = readFourCut();
    setThemeId(s.themeId);
    setCaption(s.caption);
    setStickers(s.stickers);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onUpdate = () => load();
    window.addEventListener("kstar:prefs-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("kstar:prefs-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [load]);

  async function runExport(kind: "download" | "share") {
    if (!nodeRef.current || exporting) return;
    setExporting(kind);
    setExportFailed(false);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.all([...nodeRef.current.querySelectorAll("img")].map((im) => im.decode ? im.decode().catch(() => undefined) : Promise.resolve()));
    const { ok } = await exportNode(nodeRef.current, { fileName: "kstar-fourcut.png", kind, locale });
    if (!ok) setExportFailed(true);
    setExporting(null);
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <DecoratedFourCuts ref={nodeRef} artists={artists} themeId={themeId} caption={caption} stickers={stickers} photoOverrides={media.idolPreviewSources} className="w-full max-w-[328px]" />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={() => setOpen(true)} className={CARD_BTN_DARK}>{copy.decorateFourCut}</button>
        <button type="button" onClick={() => void runExport("download")} disabled={Boolean(exporting)} className={CARD_BTN_PRIMARY}>{exporting === "download" ? copy.wizExporting : copy.fourCutDownload}</button>
        <button type="button" onClick={() => void runExport("share")} disabled={Boolean(exporting)} className={CARD_BTN_SECONDARY} style={CARD_BTN_SECONDARY_STYLE}>{exporting === "share" ? copy.wizExporting : copy.fourCutShare}</button>
        <button type="button" onClick={onRepick} className={CARD_BTN_GHOST}>{copy.repickBtn}</button>
      </div>
      {exportFailed && <p role="alert" className="text-center text-xs text-[#b4302b]">{copy.wizExportFailedGeneric}</p>}

      <FourCutDecorateOverlay artists={artists} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
