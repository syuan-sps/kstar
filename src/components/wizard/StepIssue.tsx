"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FanIdCard from "@/components/FanIdCard";
import FanIdPhotoStudio from "@/components/FanIdPhotoStudio";
import FanIdStickerEditor from "@/components/FanIdStickerEditor";
import Thumb from "@/components/Thumb";
import { useFanIdLocalMedia } from "@/hooks/useFanIdLocalMedia";
import type { ArchetypeResult } from "@/lib/archetypes";
import { resolveFanIdCardPhotos } from "@/lib/fanIdMedia";
import { useCopy, useLocale } from "@/lib/i18n/LocaleProvider";
import { exportNode } from "@/lib/exportImage";
import { CARD_BTN_PRIMARY, CARD_BTN_SECONDARY, CARD_BTN_SECONDARY_STYLE } from "@/lib/cardActionStyles";
import type { CardArtist } from "@/lib/lite";
import { finishWizard, saveWizard, type WizardState } from "@/lib/wizardState";
import { FAN_ID_THEMES, type FanIdThemeId } from "@/lib/fanIdThemes";
import type { CustomStickerPackId, PlacedCustomSticker } from "@/lib/fanIdCustomStickers";

type Phase = "printing" | "customize";
type ExportKind = "download" | "share";
type CustomizeTab = "stickers" | "style" | "photo" | "name";

export default function StepIssue({
  wiz,
  picks,
  result,
  onWizardChange,
  onDone,
  skipIntro = false,
}: {
  wiz: WizardState;
  picks: CardArtist[];
  result: ArchetypeResult;
  onWizardChange: (state: WizardState) => void;
  /** When set (e.g. rendered inside the home decorate popup), the finish button
      calls this instead of finalising the wizard + navigating home. */
  onDone?: () => void;
  /** Skip the printing/ceremony intro and open straight into the editor. */
  skipIntro?: boolean;
}) {
  const copy = useCopy();
  const locale = useLocale();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const completing = useRef(false);
  const [phase, setPhase] = useState<Phase>(skipIntro ? "customize" : "printing");
  const [flash] = useState(() => typeof window !== "undefined" && localStorage.getItem("kstar:flashOk") === "1");
  const [cardMode, setCardMode] = useState<"idol" | "idol-user" | "user">(wiz.cardMode ?? "idol-user");
  const [customStickers, setCustomStickers] = useState<PlacedCustomSticker[]>(wiz.customStickers ?? []);
  const customStickersRef = useRef<PlacedCustomSticker[]>(wiz.customStickers ?? []);
  const [activeStickerPack, setActiveStickerPack] = useState<CustomStickerPackId>(wiz.themeId ?? "chrome");
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CustomizeTab>("stickers");
  const [exporting, setExporting] = useState<ExportKind | null>(null);
  const [exportFailed, setExportFailed] = useState(false);
  const [completionFailed, setCompletionFailed] = useState(false);

  useEffect(() => {
    if (phase !== "printing") return;
    const timer = setTimeout(() => setPhase("customize"), 2400);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    setActiveStickerPack(wiz.themeId ?? "chrome");
  }, [wiz.themeId]);

  const heroId = picks.some((pick) => pick.id === wiz.heroId) ? wiz.heroId! : picks[0]?.id;
  const media = useFanIdLocalMedia({
    cardSerial: wiz.serial ?? null,
    idolIds: picks.map((pick) => pick.id),
  });
  const resolvedPhotos = resolveFanIdCardPhotos({
    mode: cardMode,
    catalogIdolSrc: picks.find((pick) => pick.id === heroId)?.image_url ?? null,
    idolOverrideSrc: media.idolPreviewSources[heroId ?? ""] ?? null,
    userPortraitSrc: media.userPortraitSrc,
    userAvatarSrc: media.userAvatarSrc,
  });
  const photoRequired = resolvedPhotos.photoRequired || (media.status === "loading" && cardMode !== "idol");
  if (!heroId || !wiz.issuedAt || !wiz.serial) {
    return <div role="alert" className="grid min-h-64 place-items-center text-sm text-[#b4302b]">{copy.wizIncompleteAlert}</div>;
  }

  function update(patch: Partial<WizardState>) {
    onWizardChange(saveWizard(patch));
  }

  function saveCustomStickers(next: PlacedCustomSticker[]) {
    customStickersRef.current = next;
    setCustomStickers(next);
    update({ customStickers: next });
  }

  function updateSticker(id: string, patch: Partial<PlacedCustomSticker>) {
    saveCustomStickers(customStickersRef.current.map((sticker) => sticker.id === id ? { ...sticker, ...patch } : sticker));
  }

  const card = (
    <FanIdCard
      ref={cardRef}
      picks={picks}
      heroId={heroId}
      result={result}
      fanName={wiz.fanName}
      idolPhoto={media.idolPreviewSources[heroId] ?? null}
      userPortraitPhoto={media.userPortraitSrc}
      userAvatarPhoto={media.userAvatarSrc}
      cardMode={cardMode}
      hideArchetype={wiz.hideArchetype}
      issuedAt={wiz.issuedAt}
      serial={wiz.serial}
      themeId={wiz.themeId}
      customStickers={customStickers}
      customStickerEditor={phase === "customize" && !exporting ? {
        stickers: customStickers,
        selectedId: selectedStickerId,
        onSelect: setSelectedStickerId,
        onTransform: updateSticker,
        onRemove: (id) => {
          saveCustomStickers(customStickersRef.current.filter((sticker) => sticker.id !== id));
          if (selectedStickerId === id) setSelectedStickerId(null);
        },
      } : undefined}
    />
  );

  if (phase === "printing") {
    return (
      <div className={`${flash ? "wiz-flash" : ""} flex min-h-[560px] flex-col items-center justify-center gap-5`} aria-live="polite">
        <p className="font-orbitron text-sm font-bold tracking-[0.18em] text-[#7c8088]">{copy.wizPrinting}</p>
        <div className="wiz-develop relative">
          <div className="fanid-preview-shell">
            <div className="fanid-preview-scale">{card}</div>
          </div>
        </div>
      </div>
    );
  }

  async function runExport(kind: ExportKind) {
    if (!cardRef.current || exporting || photoRequired) return;
    setExporting(kind);
    setExportFailed(false);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.all([...cardRef.current.querySelectorAll("img")].map((image) => image.decode ? image.decode().catch(() => undefined) : Promise.resolve()));
    // Both export the card itself (no 9:16 frame) — matches the 下載 / 分享 the
    // other result cards use; only the delivery differs (save vs native share).
    const { ok } = await exportNode(cardRef.current, { fileName: "kstar-fanid-card.png", kind, locale });
    if (!ok) setExportFailed(true);
    setExporting(null);
  }

  function complete() {
    if (completing.current) return;
    // In the home popup, edits are already mirrored to prefs live — just close.
    if (onDone) { onDone(); return; }
    completing.current = true;
    setCompletionFailed(false);
    if (!finishWizard(wiz)) {
      completing.current = false;
      setCompletionFailed(true);
      return;
    }
    router.push("/");
  }

  const TAB_COPY: Record<CustomizeTab, string> = locale === "zh"
    ? { stickers: "貼紙", style: "樣式", photo: "照片", name: "名稱" }
    : { stickers: "Stickers", style: "Style", photo: "Photo", name: "Name" };

  return (
    <div className="flex flex-col items-center gap-3 md:grid md:grid-cols-[328px_minmax(0,1fr)] md:items-start md:gap-6">
      {/* Card zone. On desktop it's sticky beside the panel so it never scrolls
          out of view while you edit; on mobile it stacks above the tabs. */}
      <div className="fanid-preview-shell relative shrink-0 md:sticky md:top-20 md:justify-self-center">
        <div className="fanid-preview-scale">{card}</div>
      </div>

      <div className="w-full max-w-lg md:max-w-none">
        {/* Tab bar */}
        <div role="tablist" aria-label={copy.customizeFanIdAria} className="flex gap-1 rounded-full border border-[#c8ccd2] bg-white/75 p-1">
          {(["stickers", "style", "photo", "name"] as const).map((tab) => {
            const selected = activeTab === tab;
            return (
              <button key={tab} type="button" role="tab" aria-selected={selected} onClick={() => setActiveTab(tab)}
                className={`min-h-[36px] flex-1 rounded-full px-2 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b4302b] ${selected ? "bg-[#1c1e24] text-white" : "text-[#5e636d] hover:bg-black/5"}`}>
                {TAB_COPY[tab]}
              </button>
            );
          })}
        </div>

        {/* Tab panel. Mobile: bounded height, only this scrolls so the card stays
            put. Desktop: grows naturally — the sticky card handles staying visible. */}
        <section
          aria-label={copy.customizeFanIdAria}
          className="mt-2 max-h-[min(46vh,420px)] space-y-4 overflow-y-auto rounded-2xl border border-[#c8ccd2] bg-white/75 p-4 shadow-sm md:max-h-none md:overflow-visible"
        >
          {activeTab === "stickers" && (
            <>
              <div>
                <p className="mb-2 text-xs font-bold text-[#5e636d]">{copy.cardEditionLabel}</p>
                <div className="flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Fan ID card edition">
                  {Object.values(FAN_ID_THEMES).map((theme) => {
                    const selected = (wiz.themeId ?? "chrome") === theme.id;
                    return (
                      <button key={theme.id} type="button" role="radio" aria-checked={selected} onClick={() => { setActiveStickerPack(theme.id as CustomStickerPackId); update({ themeId: theme.id as FanIdThemeId }); }}
                        className={`min-w-[84px] rounded-xl border-2 p-1.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b4302b] ${selected ? "border-[#b4302b] shadow-sm" : "border-transparent hover:border-[#c8ccd2]"}`}>
                        <span className="block h-9 rounded-lg border" style={{ backgroundImage: theme.surface, borderColor: theme.border }} />
                        <span className="mt-1 block truncate text-[10px] font-bold text-[#1c1e24]">{locale === "zh" ? theme.labelZh : theme.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <FanIdStickerEditor
                selectedThemeId={wiz.themeId ?? "chrome"}
                activePackId={activeStickerPack}
                stickers={customStickers}
                onPackChange={setActiveStickerPack}
                onChange={(next) => { saveCustomStickers(next); setSelectedStickerId(next.at(-1)?.id ?? null); }}
              />
              {customStickers.length > 0 && <button type="button" onClick={() => { saveCustomStickers([]); setSelectedStickerId(null); }} className="w-full text-xs font-bold text-[#b4302b]">{copy.stickerClearPlaced}</button>}
            </>
          )}

          {activeTab === "style" && (
            <>
              <div>
                <p className="mb-2 text-xs font-bold text-[#5e636d]">{locale === "zh" ? "卡片版式" : "Card layout"}</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["idol", "idol-user", "user"] as const).map((mode) => {
                    const labels = locale === "zh"
                      ? { idol: "偶像", "idol-user": "偶像 + 本人", user: "本人" }
                      : { idol: "Idol", "idol-user": "Idol + User", user: "User" };
                    const selected = cardMode === mode;
                    return (
                      <button key={mode} type="button" aria-pressed={selected} onClick={() => { setCardMode(mode); update({ cardMode: mode }); }} className={`rounded-xl border p-2 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b4302b] ${selected ? "border-[#b4302b] bg-[#b4302b]/5 text-[#b4302b] shadow-sm" : "border-[#c8ccd2] bg-white/70 text-[#5e636d] hover:border-[#9aa0aa]"}`}>
                        <span className="relative mx-auto mb-1.5 block h-9 w-7 rounded-md border border-current/35 bg-current/[0.06]">
                          <span className={`absolute rounded-full bg-current/70 ${mode === "user" ? "left-1.5 top-1.5 h-4 w-4" : "left-1 top-1 h-5 w-5"}`} />
                          {mode === "idol-user" && <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-current" />}
                          <span className="absolute bottom-1 left-1 right-1 h-px bg-current/35" />
                        </span>
                        <span className="block leading-tight">{labels[mode]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Photo-only toggle — keeps the photo + banners, hides the archetype block. */}
              <label className="flex items-center justify-between gap-3 rounded-xl border border-[#c8ccd2] bg-white/70 px-3 py-2.5">
                <span>
                  <span className="block text-xs font-bold text-[#1c1e24]">{locale === "zh" ? "只顯示照片" : "Photo only"}</span>
                  <span className="block text-[10px] text-[#9aa0aa]">{locale === "zh" ? "隱藏靈魂分析區塊" : "Hide the archetype block"}</span>
                </span>
                <button type="button" role="switch" aria-checked={wiz.hideArchetype === true} onClick={() => update({ hideArchetype: !wiz.hideArchetype })}
                  className={`relative h-6 w-10 shrink-0 rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b4302b] ${wiz.hideArchetype ? "bg-[#b4302b]" : "bg-[#c8ccd2]"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${wiz.hideArchetype ? "left-[18px]" : "left-0.5"}`} />
                </button>
              </label>
              <div>
                <p className="mb-2 text-xs font-bold text-[#5e636d]">{copy.wizFocusLabel}</p>
                <div className="grid grid-cols-4 gap-2">
                  {picks.map((pick) => (
                    <button key={pick.id} type="button" aria-pressed={pick.id === heroId} onClick={() => update({ heroId: pick.id })} className={`overflow-hidden rounded-xl border-2 p-1 transition ${pick.id === heroId ? "border-[#b4302b]" : "border-transparent hover:border-[#c8ccd2]"}`}>
                      <span className="block aspect-[3/4] overflow-hidden rounded-lg"><Thumb src={pick.image_url} seed={pick.id} label={pick.name_zh ?? pick.name} focusY={pick.image_focus} rounded="rounded-lg" /></span>
                      <span className="mt-1 block truncate text-[10px] font-bold">{pick.name_zh ?? pick.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "photo" && (
            <FanIdPhotoStudio cardSerial={wiz.serial} picks={picks} cardMode={cardMode} media={media} />
          )}

          {activeTab === "name" && (
            <>
              <label className="block text-xs font-bold text-[#5e636d]">
                {copy.wizFanNameLabel}
                <input value={wiz.fanName ?? ""} maxLength={30} onChange={(event) => update({ fanName: event.target.value })} placeholder={copy.passNamePlaceholder} className="mt-1.5 w-full rounded-xl border border-[#c8ccd2] bg-white px-3 py-2.5 text-sm font-normal text-[#1c1e24] outline-none focus:border-[#7c8088]" />
              </label>
              {photoRequired && <p className="text-center text-[11px] font-medium text-[#b4302b]">{locale === "zh" ? "加入本人照片後即可匯出這個版式。" : "Add your photo to export this layout."}</p>}
              <button type="button" disabled className="w-full rounded-xl border border-dashed border-[#c8ccd2] bg-[#f4f5f7] py-2 text-xs text-[#9aa0aa]">{copy.wizBiasSongComingSoon}</button>
            </>
          )}
        </section>

        {/* Persistent actions — always visible regardless of active tab */}
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button type="button" disabled={Boolean(exporting) || photoRequired} onClick={() => void runExport("download")} className={CARD_BTN_PRIMARY}>
              {exporting === "download" ? copy.wizExporting : copy.fourCutDownload}
            </button>
            <button type="button" disabled={Boolean(exporting) || photoRequired} onClick={() => void runExport("share")} className={CARD_BTN_SECONDARY} style={CARD_BTN_SECONDARY_STYLE}>
              {exporting === "share" ? copy.wizExporting : copy.fourCutShare}
            </button>
          </div>
          {exportFailed && <p role="alert" className="text-center text-xs text-[#b4302b]">{copy.wizExportFailedGeneric}</p>}
          <button type="button" onClick={() => setPhase("printing")} className="w-full text-xs text-[#7c8088] hover:text-[#1c1e24]">{copy.wizReplay}</button>
          <button type="button" onClick={complete} className="w-full rounded-xl bg-[#b4302b] py-3 font-bold text-white shadow-[0_5px_16px_rgba(180,48,43,.25)]">{onDone ? copy.fourCutDone : copy.wizDone}</button>
          {completionFailed && <p role="alert" className="text-center text-xs text-[#b4302b]">{copy.wizSaveFailed}</p>}
        </div>
      </div>
    </div>
  );
}
