// Temporary preview route for FanIdCard visual QA — not part of the wizard flow yet.
import FanIdCard from "@/components/FanIdCard";
import { ARCHETYPES, COLOR_STORIES, type ArchetypeResult } from "@/lib/archetypes";
import catalog from "@/data/catalog.json";

export default function PreviewFanId() {
  const jungkook = catalog.artists.find((a) => a.id === "jungkook")!;
  const noPhotoIdol = { ...jungkook, id: "no-photo-idol", name: "No Photo", name_zh: null, image_url: null };

  const result: ArchetypeResult = {
    code: "aPSr",
    archetype: ARCHETYPES.aPSr,
    leadLayer: "personality",
    hiddenLayer: "performance",
    dualityLine: { zh: "個性先收你，舞台再補一刀。", en: "" },
    colorStory: COLOR_STORIES.personality,
    scores: { aesthetic: 40, personality: 92, performance: 78, content: 35 },
    bars: { aesthetic: 40, personality: 92, performance: 78, content: 35 },
    high: { aesthetic: false, personality: true, performance: true, content: false },
    highCount: 2,
  };

  const shared = {
    result,
    fanName: "d1dsf",
    globalRankPct: 2.8,
    serial: "0013",
    issuedAt: "2026-01-15",
  };

  return (
    <div className="flex min-h-screen flex-wrap items-start justify-center gap-16 bg-black p-20">
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-white/60">A · 本人版 (with uploaded photo)</p>
        <FanIdCard hero={jungkook} showFace facePhoto="/idols/jungkook.jpg" {...shared} />
      </div>
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-white/60">A · 本人版 (no upload yet → placeholder)</p>
        <FanIdCard hero={jungkook} showFace {...shared} />
      </div>
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-white/60">B · 純分享版 (face hidden by choice)</p>
        <FanIdCard hero={jungkook} showFace={false} {...shared} />
      </div>
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-white/60">Idol with no photo (Thumb fallback)</p>
        <FanIdCard hero={noPhotoIdol} showFace={false} {...shared} />
      </div>
    </div>
  );
}
