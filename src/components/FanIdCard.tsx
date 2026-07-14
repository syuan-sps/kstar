"use client";

// 追星證 — a fixed-width, export-safe hero + lineup certificate. The component
// owns no controls and never reads the catalog; issuing flows pass CardArtist
// records and may capture the forwarded node through its ref.

import { forwardRef } from "react";
import Thumb from "@/components/Thumb";
import {
  ARCHETYPES,
  LAYER_COLOR,
  LAYER_ZH,
  expandCode,
  type ArchetypeResult,
} from "@/lib/archetypes";
import { pickTheme } from "@/lib/cardTheme";
import { copy } from "@/lib/copy";
import type { CardArtist } from "@/lib/lite";
import { frameRarity } from "@/lib/rarityFrame";
import { SCORE_LAYERS } from "@/lib/types";

interface FanIdCardCommonProps {
  fanName?: string;
  song?: { title: string; artist: string; artworkUrl: string } | null;
  showFace?: boolean;
  facePhoto?: string | null;
}

export interface FanIdCardSampleProps {
  sample: true;
}

export interface FanIdCardProductionProps extends FanIdCardCommonProps {
  sample?: false;
  picks: CardArtist[];
  heroId: string;
  result: ArchetypeResult;
  issuedAt: string;
  serial: string;
}

export type FanIdCardProps = FanIdCardSampleProps | FanIdCardProductionProps;

const INK = "#1c1e24";

// Deliberately illustrative, not catalog-backed. The labels make that status
// visible in the poster itself, while deterministic metadata keeps snapshots
// and landing renders stable.
const SAMPLE_FAN_ID: FanIdCardProductionProps = {
  picks: [
    { id: "sample-hero", name: "Sample Hero", name_zh: "示意本命" },
    { id: "sample-lineup-a", name: "Sample A", name_zh: "示意陣容 A" },
    { id: "sample-lineup-b", name: "Sample B", name_zh: "示意陣容 B" },
    { id: "sample-lineup-c", name: "Sample C", name_zh: "示意陣容 C" },
  ],
  heroId: "sample-hero",
  result: {
    code: "ApSr",
    archetype: ARCHETYPES.ApSr,
    leadLayer: "aesthetic",
    hiddenLayer: "performance",
    dualityLine: "示意卡面",
    colorStory: { accent: "#56789f", soft: "#a7c0dc", label: "丹寧藍 × 鉻銀" },
    scores: { aesthetic: 86, personality: 38, performance: 79, content: 31 },
    bars: { aesthetic: 92, personality: 44, performance: 84, content: 36 },
    high: { aesthetic: true, personality: false, performance: true, content: false },
    highCount: 2,
  },
  fanName: "小星 · 示意",
  issuedAt: "2026.07.13",
  serial: "0428",
};

const FanIdCard = forwardRef<HTMLDivElement, FanIdCardProps>(function FanIdCard(
  props,
  ref,
) {
  const sample = props.sample === true;
  const card = sample ? SAMPLE_FAN_ID : props;
  const { picks, heroId, result, fanName, song, showFace, facePhoto, issuedAt, serial } = card;
  const hero = picks.find((p) => p.id === heroId) ?? picks[0];
  const lineup = picks.filter((p) => p.id !== hero.id);
  const theme = pickTheme(hero.id);
  const rarity = frameRarity(result.code);
  const complement = expandCode(result.code);
  const complementType = ARCHETYPES[complement];
  const date = issuedAt;

  return (
    <div
      ref={ref}
      data-sample={sample ? "true" : undefined}
      aria-label={`${copy.fanIdName} ${result.code}`}
      className="relative box-border w-[328px] overflow-hidden rounded-[14px] p-[14px] text-[#1c1e24]"
      style={{
        backgroundColor: "#f4f5f7",
        backgroundImage: [
          "repeating-linear-gradient(63deg,transparent 0 7px,rgba(124,128,136,0.055) 7px 8px)",
          "radial-gradient(110% 80% at 100% 0%,rgba(167,192,220,0.18),transparent 58%)",
          `radial-gradient(90% 55% at 0% 100%,${theme.accent}12,transparent 60%)`,
          "linear-gradient(165deg,#ffffff 0%,#eceef2 55%,#dfe2e7 100%)",
        ].join(","),
        border: "1px solid #aeb3bb",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.85),6px 6px 0 rgba(74,74,74,.28),0 12px 34px rgba(124,128,136,.25)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-orbitron text-[11px] font-black tracking-[0.12em] text-[#4a4f57]">
          ◆ {copy.fanIdName} · KSTAR FAN ID
        </span>
        <span className="text-right font-mono text-[8px] leading-[1.45] text-[#9aa0aa]">
          {sample && <>SAMPLE · 示意<br /></>}
          KS-{date.slice(0, 4)}<br />#{serial}
        </span>
      </div>

      <div className="mt-2.5 grid grid-cols-[1.15fr_1fr] gap-2.5">
        <div data-fanid-entry="hero" className="relative aspect-[3/3.4] overflow-hidden rounded-[10px] border border-[#c8ccd2] bg-[#e7eaef]">
          <Thumb
            src={hero.image_url}
            seed={hero.id}
            label={hero.name_zh ?? hero.name}
            focusY={hero.image_focus}
            rounded="rounded-none"
          />
          <span className="absolute left-1.5 top-1.5 text-sm">👑</span>
          {showFace && facePhoto && (
            <span className="absolute right-1.5 top-1.5 h-[46px] w-[34px] overflow-hidden rounded-[5px] border-2 border-white bg-white shadow-[0_2px_6px_rgba(28,30,36,.3)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={facePhoto} alt="本人" className="h-[37px] w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-white/90 text-center text-[6.5px] font-bold tracking-[0.1em] text-[#5e636d]">本人</span>
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1c1e24]/80 to-transparent px-2 pb-1.5 pt-5 text-[11px] font-bold text-white">
            本命 · {hero.name_zh ?? hero.name}
          </span>
        </div>

        <div
          data-fanid-archetype="true"
          className="flex min-w-0 w-full flex-col items-center justify-center gap-1.5 text-center"
        >
          <span className="flex w-full justify-center font-orbitron text-[29px] font-black leading-none tracking-[0.06em]">
            {result.code.split("").map((letter, index) => {
              const high = letter === letter.toUpperCase();
              return <span key={`${letter}-${index}`} style={{ color: high ? INK : "#9aa0aa", fontWeight: high ? 900 : 500 }}>{letter}</span>;
            })}
          </span>
          <span className="w-full text-[13px] font-black leading-tight">{result.archetype.zhName}</span>
          <span className="w-full font-orbitron text-[7.5px] font-bold leading-tight tracking-[0.08em] text-[#7c8088]">
            {result.archetype.enName}
          </span>
          <span className="max-w-full self-center whitespace-nowrap rounded-full border border-[#a8822f] bg-[#d8b45a]/10 px-2 py-0.5 font-mono text-[8px] font-bold text-[#a8822f]">
            ✦ {rarity.label}
          </span>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {lineup.slice(0, 3).map((artist) => (
          <div key={artist.id} data-fanid-entry="lineup" className="overflow-hidden rounded-[7px] border border-[#c8ccd2] bg-white">
            <div className="aspect-[3/4]">
              <Thumb
                src={artist.image_url}
                seed={artist.id}
                label={artist.name_zh ?? artist.name}
                focusY={artist.image_focus}
                rounded="rounded-none"
              />
            </div>
            <p className="truncate px-1 py-0.5 text-center text-[7px] font-bold text-[#5e636d]">{artist.name_zh ?? artist.name}</p>
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5 border-t border-[#c8ccd2] pt-2">
        {SCORE_LAYERS.map((layer) => (
          <div key={layer}>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#c8ccd2]/50">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(6, result.bars[layer])}%`, backgroundColor: LAYER_COLOR[layer] }}
              />
            </div>
            <p className="mt-0.5 text-center text-[7px] font-bold text-[#7c8088]">{LAYER_ZH[layer]}</p>
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex items-baseline gap-1.5 rounded-md border border-[#c8ccd2]/80 bg-white/55 px-2 py-1">
        <span className="shrink-0 text-[7px] font-bold tracking-[0.12em] text-[#9aa0aa]">互補型 · 發現</span>
        <span className="font-orbitron text-[9px] font-black text-[#4a4f57]">{complement}</span>
        <span className="truncate text-[8px] font-bold text-[#5e636d]">
          {complementType?.zhName ?? complement} · {complementType?.enName ?? ""}
        </span>
      </div>

      {fanName && (
        <p className="mt-2 border-t border-dashed border-[#c8ccd2] pt-2 text-[10px] text-[#5e636d]">
          {copy.fanIdHolder} · <b className="text-[#1c1e24]">{fanName}</b>
        </p>
      )}
      {song && (
        <p className={`${fanName ? "mt-1" : "mt-2 border-t border-dashed border-[#c8ccd2] pt-2"} flex items-center gap-1.5 text-[10px] text-[#5e636d]`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={song.artworkUrl} alt="" className="h-4 w-4 rounded-sm" />
          <span className="truncate">{copy.fanIdSong} · <b className="text-[#1c1e24]">{song.title}</b> — {song.artist} ♪</span>
        </p>
      )}

      <div className="mt-2.5 flex items-end justify-between border-t border-[#c8ccd2] pt-2.5">
        <div>
          <div
            className="h-3.5 w-24 opacity-70"
            style={{ backgroundImage: `repeating-linear-gradient(90deg,${INK} 0 1px,transparent 1px 2px,${INK} 2px 4px,transparent 4px 7px)` }}
          />
          <p className="mt-1.5 font-mono text-[7px] tracking-[0.04em] text-[#9aa0aa]">發證 {date} · KSTAR 發證中心</p>
        </div>
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/qr-start.svg" alt={copy.fanIdScanMe} className="h-[46px] w-[46px] rounded-[5px] border border-[#c8ccd2] bg-white p-0.5" />
          <p className="mt-0.5 text-[7px] text-[#9aa0aa]">{copy.fanIdScanMe}</p>
        </div>
      </div>
    </div>
  );
});

FanIdCard.displayName = "FanIdCard";

export default FanIdCard;
