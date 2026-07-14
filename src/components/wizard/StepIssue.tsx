"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FacePhotoPicker from "@/components/FacePhotoPicker";
import FanIdCard from "@/components/FanIdCard";
import Thumb from "@/components/Thumb";
import type { ArchetypeResult } from "@/lib/archetypes";
import { copy } from "@/lib/copy";
import { exportNode } from "@/lib/exportImage";
import type { ArtistLite } from "@/lib/lite";
import { finishWizard, saveWizard, type WizardState } from "@/lib/wizardState";

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
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const completing = useRef(false);
  const [phase, setPhase] = useState<Phase>("printing");
  const [flash] = useState(() => typeof window !== "undefined" && localStorage.getItem("kstar:flashOk") === "1");
  const [showFace, setShowFace] = useState(true);
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
  if (!heroId || !wiz.issuedAt || !wiz.serial) {
    return <div role="alert" className="grid min-h-64 place-items-center text-sm text-[#b4302b]">追星證資料不完整，請返回重新選擇四位本命。</div>;
  }

  const card = (
    <FanIdCard
      ref={cardRef}
      picks={picks}
      heroId={heroId}
      result={result}
      fanName={wiz.fanName}
      showFace={showFace}
      facePhoto={facePhoto}
      issuedAt={wiz.issuedAt}
      serial={wiz.serial}
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
    if (!cardRef.current || exporting) return;
    setExporting(kind);
    setExportFailed(false);
    const options = kind === "story"
      ? { fileName: "kstar-fanid-story.png", kind: "share" as const, frame: { w: 1080, h: 1920, bg: "#14001c" } }
      : { fileName: "kstar-fanid-card.png", kind: "download" as const };
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

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="fanid-preview-shell relative">
        <div className="fanid-preview-scale">{card}</div>
      </div>

      <section className="w-full max-w-lg space-y-4 rounded-2xl border border-[#c8ccd2] bg-white/75 p-4 shadow-sm" aria-label="自訂追星證">
        <div>
          <p className="mb-2 text-xs font-bold text-[#5e636d]">選擇本命焦點</p>
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
          持卡人（選填）
          <input value={wiz.fanName ?? ""} maxLength={30} onChange={(event) => update({ fanName: event.target.value })} placeholder="輸入暱稱…" className="mt-1.5 w-full rounded-xl border border-[#c8ccd2] bg-white px-3 py-2.5 text-sm font-normal text-[#1c1e24] outline-none focus:border-[#7c8088]" />
        </label>

        <div>
          <p className="mb-2 text-xs font-bold text-[#5e636d]">卡片版本</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" aria-pressed={showFace} onClick={() => setShowFace(true)} className={`rounded-xl border px-3 py-2 text-xs font-bold ${showFace ? "border-[#b4302b] bg-[#b4302b]/5 text-[#b4302b]" : "border-[#c8ccd2]"}`}>Version A · 本人版</button>
            <button type="button" aria-pressed={!showFace} onClick={() => setShowFace(false)} className={`rounded-xl border px-3 py-2 text-xs font-bold ${!showFace ? "border-[#1c1e24] bg-[#1c1e24]/5" : "border-[#c8ccd2]"}`}>Version B · 純分享版</button>
          </div>
        </div>
        {showFace && <FacePhotoPicker value={facePhoto} onChange={setFacePhoto} />}

        <button type="button" disabled className="w-full rounded-xl border border-dashed border-[#c8ccd2] bg-[#f4f5f7] py-2 text-xs text-[#9aa0aa]">本命曲 ♪ · 咕卡 deco — 即將推出</button>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={Boolean(exporting)} onClick={() => void runExport("story")} className="rounded-xl bg-[#1c1e24] px-3 py-3 text-xs font-bold text-white disabled:opacity-50">{exporting === "story" ? "匯出中…" : "匯出限動 9:16"}</button>
          <button type="button" disabled={Boolean(exporting)} onClick={() => void runExport("card")} className="rounded-xl border border-[#1c1e24] px-3 py-3 text-xs font-bold disabled:opacity-50">{exporting === "card" ? "匯出中…" : "匯出卡片"}</button>
        </div>
        {exportFailed && <p role="alert" className="text-center text-xs text-[#b4302b]">圖片匯出失敗，請稍後重試或直接截圖。</p>}
        <button type="button" onClick={() => setPhase("printing")} className="w-full text-xs text-[#7c8088] hover:text-[#1c1e24]">↻ 重播製卡</button>
        <button type="button" onClick={complete} className="w-full rounded-xl bg-[#b4302b] py-3 font-bold text-white shadow-[0_5px_16px_rgba(180,48,43,.25)]">{copy.wizDone}</button>
        {completionFailed && <p role="alert" className="text-center text-xs text-[#b4302b]">無法儲存追星證，請確認瀏覽器儲存空間後再試一次。</p>}
      </section>
    </div>
  );
}
