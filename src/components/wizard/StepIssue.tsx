"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FacePhotoPicker from "@/components/FacePhotoPicker";
import FanIdCard from "@/components/FanIdCard";
import Thumb from "@/components/Thumb";
import type { ArchetypeResult } from "@/lib/archetypes";
import { useCopy, useLocale } from "@/lib/i18n/LocaleProvider";
import { exportNode } from "@/lib/exportImage";
import type { ArtistLite } from "@/lib/lite";
import { finishWizard, saveWizard, type WizardState } from "@/lib/wizardState";
import { FAN_ID_THEMES, type FanIdThemeId } from "@/lib/fanIdThemes";

type Phase = "printing" | "customize";
type ExportKind = "story" | "card";

export default function StepIssue({
  wiz,
  picks,
  result,
  onWizardChange,
}: {
  wiz: WizardState;
  picks: ArtistLite[];
  result: ArchetypeResult;
  onWizardChange: (state: WizardState) => void;
}) {
  const copy = useCopy();
  const locale = useLocale();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const completing = useRef(false);
  const [phase, setPhase] = useState<Phase>("printing");
  const [flash] = useState(() => typeof window !== "undefined" && localStorage.getItem("kstar:flashOk") === "1");
  const [cardMode, setCardMode] = useState<"idol" | "idol-user" | "user">(wiz.cardMode ?? "idol-user");
  const [stickersEnabled, setStickersEnabled] = useState(wiz.stickersEnabled === true);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [exporting, setExporting] = useState<ExportKind | null>(null);
  const [exportFailed, setExportFailed] = useState(false);
  const [completionFailed, setCompletionFailed] = useState(false);

  useEffect(() => {
    if (phase !== "printing") return;
    const timer = setTimeout(() => setPhase("customize"), 2400);
    return () => clearTimeout(timer);
  }, [phase]);

  const heroId = picks.some((pick) => pick.id === wiz.heroId) ? wiz.heroId! : picks[0]?.id;
  const photoRequired = cardMode !== "idol" && !facePhoto;
  if (!heroId || !wiz.issuedAt || !wiz.serial) {
    return <div role="alert" className="grid min-h-64 place-items-center text-sm text-[#b4302b]">{copy.wizIncompleteAlert}</div>;
  }

  const card = (
    <FanIdCard
      ref={cardRef}
      picks={picks}
      heroId={heroId}
      result={result}
      fanName={wiz.fanName}
      facePhoto={facePhoto}
      cardMode={cardMode}
      issuedAt={wiz.issuedAt}
      serial={wiz.serial}
      themeId={wiz.themeId}
      stickersEnabled={stickersEnabled}
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

  function update(patch: Partial<WizardState>) {
    onWizardChange(saveWizard(patch));
  }

  async function runExport(kind: ExportKind) {
    if (!cardRef.current || exporting || photoRequired) return;
    setExporting(kind);
    setExportFailed(false);
    const options = kind === "story"
      ? { fileName: "kstar-fanid-story.png", kind: "share" as const, frame: { w: 1080, h: 1920, bg: "#14001c" }, locale }
      : { fileName: "kstar-fanid-card.png", kind: "download" as const, locale };
    const { ok } = await exportNode(cardRef.current, options);
    if (!ok) setExportFailed(true);
    setExporting(null);
  }

  function complete() {
    if (completing.current) return;
    completing.current = true;
    setCompletionFailed(false);
    if (!finishWizard(wiz)) {
      completing.current = false;
      setCompletionFailed(true);
      return;
    }
    router.push("/");
  }

  const stickerToggleCopy = locale === "zh"
    ? {
        title: "貼紙裝飾",
        subtitle: "加入主題貼紙邊框",
        selected: "已開啟",
        unselected: "已關閉",
      }
    : {
        title: "Sticker bomb",
        subtitle: "Add a curated decorated edge",
        selected: "On",
        unselected: "Off",
      };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="fanid-preview-shell relative">
        <div className="fanid-preview-scale">{card}</div>
      </div>

      <section className="w-full max-w-lg space-y-4 rounded-2xl border border-[#c8ccd2] bg-white/75 p-4 shadow-sm" aria-label={copy.customizeFanIdAria}>
        <div>
          <p className="mb-2 text-xs font-bold text-[#5e636d]">Card edition</p>
          <div className="flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Fan ID card edition">
            {Object.values(FAN_ID_THEMES).map((theme) => {
              const selected = (wiz.themeId ?? "chrome") === theme.id;
              return (
                <button key={theme.id} type="button" role="radio" aria-checked={selected} onClick={() => update({ themeId: theme.id as FanIdThemeId })}
                  className={`min-w-[84px] rounded-xl border-2 p-1.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b4302b] ${selected ? "border-[#b4302b] shadow-sm" : "border-transparent hover:border-[#c8ccd2]"}`}>
                  <span className="block h-9 rounded-lg border" style={{ backgroundImage: theme.surface, borderColor: theme.border }} />
                  <span className="mt-1 block truncate text-[10px] font-bold text-[#1c1e24]">{theme.label}</span>
                </button>
              );
            })}
          </div>
        </div>
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

        <label className="block text-xs font-bold text-[#5e636d]">
          {copy.wizFanNameLabel}
          <input value={wiz.fanName ?? ""} maxLength={30} onChange={(event) => update({ fanName: event.target.value })} placeholder={copy.passNamePlaceholder} className="mt-1.5 w-full rounded-xl border border-[#c8ccd2] bg-white px-3 py-2.5 text-sm font-normal text-[#1c1e24] outline-none focus:border-[#7c8088]" />
        </label>

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
        <button
          type="button"
          data-sticker-toggle
          aria-pressed={stickersEnabled}
          onClick={() => {
            const next = !stickersEnabled;
            setStickersEnabled(next);
            update({ stickersEnabled: next });
          }}
          className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b4302b] ${stickersEnabled ? "border-[#b4302b] bg-[#b4302b]/7 shadow-sm" : "border-[#c8ccd2] bg-white/70 hover:border-[#9aa0aa]"}`}
        >
          <span className="min-w-0 flex-1">
            <span className={`block text-xs font-bold ${stickersEnabled ? "text-[#b4302b]" : "text-[#1c1e24]"}`}>{stickerToggleCopy.title}</span>
            <span className="mt-1 block text-[11px] text-[#5e636d]">{stickerToggleCopy.subtitle}</span>
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-2">
            <span
              aria-hidden="true"
              data-sticker-toggle-thumbnail
              className={`relative h-10 w-8 overflow-hidden rounded-[11px] border shadow-[inset_0_1px_0_rgba(255,255,255,.75)] ${stickersEnabled ? "border-[#b4302b]/35 bg-[linear-gradient(180deg,rgba(255,255,255,.92),rgba(180,48,43,.08))]" : "border-[#c8ccd2] bg-[linear-gradient(180deg,#ffffff,#f4f5f7)]"}`}
            >
              <span className="absolute inset-[3px] rounded-[8px] border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,.88),rgba(28,30,36,.04))]" />
              <span className="absolute inset-x-1.5 top-1.5 h-1 rounded-full bg-black/10" />
              <span className="absolute inset-x-1 bottom-1.5 h-4 rounded-[5px] border border-black/5 bg-black/[0.055]" />
              {stickersEnabled && (
                <>
                  <span data-sticker-toggle-thumb-accent className="absolute left-0.5 top-1 h-2.5 w-2.5 rounded-full border border-white/80 bg-[#ffd6ea] shadow-[0_1px_3px_rgba(180,48,43,.18)]" />
                  <span data-sticker-toggle-thumb-accent className="absolute right-0 top-3 block h-2 w-2 rotate-12 rounded-[4px] border border-white/70 bg-[#fff0a8] shadow-[0_1px_3px_rgba(28,30,36,.18)]" />
                  <span data-sticker-toggle-thumb-accent className="absolute bottom-1 right-0.5 h-2 w-2 rounded-full border border-white/80 bg-[#cfd9ff] shadow-[0_1px_3px_rgba(28,30,36,.16)]" />
                </>
              )}
            </span>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] ${stickersEnabled ? "border-[#b4302b]/30 bg-[#b4302b] text-white" : "border-[#c8ccd2] bg-white text-[#5e636d]"}`}>
              {stickersEnabled ? stickerToggleCopy.selected : stickerToggleCopy.unselected}
            </span>
          </span>
        </button>
        {cardMode !== "idol" && <FacePhotoPicker value={facePhoto} onChange={setFacePhoto} />}
        {photoRequired && <p className="text-center text-[11px] font-medium text-[#b4302b]">{locale === "zh" ? "加入本人照片後即可匯出這個版式。" : "Add your photo to export this layout."}</p>}

        <button type="button" disabled className="w-full rounded-xl border border-dashed border-[#c8ccd2] bg-[#f4f5f7] py-2 text-xs text-[#9aa0aa]">{copy.wizBiasSongComingSoon}</button>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={Boolean(exporting) || photoRequired} onClick={() => void runExport("story")} className="rounded-xl bg-[#1c1e24] px-3 py-3 text-xs font-bold text-white disabled:opacity-40">{exporting === "story" ? copy.wizExporting : copy.wizExportStory}</button>
          <button type="button" disabled={Boolean(exporting) || photoRequired} onClick={() => void runExport("card")} className="rounded-xl border border-[#1c1e24] px-3 py-3 text-xs font-bold disabled:opacity-40">{exporting === "card" ? copy.wizExporting : copy.wizExportCard}</button>
        </div>
        {exportFailed && <p role="alert" className="text-center text-xs text-[#b4302b]">{copy.wizExportFailedGeneric}</p>}
        <button type="button" onClick={() => setPhase("printing")} className="w-full text-xs text-[#7c8088] hover:text-[#1c1e24]">{copy.wizReplay}</button>
        <button type="button" onClick={complete} className="w-full rounded-xl bg-[#b4302b] py-3 font-bold text-white shadow-[0_5px_16px_rgba(180,48,43,.25)]">{copy.wizDone}</button>
        {completionFailed && <p role="alert" className="text-center text-xs text-[#b4302b]">{copy.wizSaveFailed}</p>}
      </section>
    </div>
  );
}
