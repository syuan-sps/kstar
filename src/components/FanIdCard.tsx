"use client";

// 追星證 — a fixed-width, export-safe hero + lineup certificate. The component
// owns no controls and never reads the catalog; issuing flows pass CardArtist
// records and may capture the forwarded node through its ref.

import { forwardRef } from "react";
import Thumb from "@/components/Thumb";
import {
  ARCHETYPES,
  LAYER_COLOR,
  layerLabel,
  expandCode,
  type ArchetypeResult,
} from "@/lib/archetypes";
import { getFanIdTheme, type FanIdThemeId } from "@/lib/fanIdThemes";
import { useCopy, useLocale } from "@/lib/i18n/LocaleProvider";
import type { CardArtist } from "@/lib/lite";
import { frameRarity } from "@/lib/rarityFrame";
import { SCORE_LAYERS } from "@/lib/types";

interface FanIdCardCommonProps {
  themeId?: FanIdThemeId;
  fanName?: string;
  song?: { title: string; artist: string; artworkUrl: string } | null;
  showFace?: boolean;
  facePhoto?: string | null;
}

export interface FanIdCardSampleProps extends FanIdCardCommonProps {
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

// flat, low-contrast brushed-metal tone — no dramatic banding across text

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
    dualityLine: { zh: "示意卡面", en: "Sample card" },
    colorStory: { accent: "#56789f", soft: "#a7c0dc", label: { zh: "丹寧藍 × 鉻銀", en: "Denim Blue × Chrome Silver" } },
    scores: { aesthetic: 86, personality: 38, performance: 79, content: 31 },
    bars: { aesthetic: 92, personality: 44, performance: 84, content: 36 },
    high: { aesthetic: true, personality: false, performance: true, content: false },
    highCount: 2,
  },
  fanName: "小星 · 示意",
  issuedAt: "2026.07.13",
  serial: "0428",
};

const SAMPLE_FAN_NAME_EN = "Little Star · Sample";

const FanIdCard = forwardRef<HTMLDivElement, FanIdCardProps>(function FanIdCard(
  props,
  ref,
) {
  const copy = useCopy();
  const locale = useLocale();
  const sample = props.sample === true;
  const card = sample
    ? {
        ...SAMPLE_FAN_ID,
        picks: locale === "en" ? SAMPLE_FAN_ID.picks.map((p) => ({ ...p, name_zh: null })) : SAMPLE_FAN_ID.picks,
        fanName: locale === "en" ? SAMPLE_FAN_NAME_EN : SAMPLE_FAN_ID.fanName,
      }
    : props;
  const { picks, heroId, result, fanName, song, showFace, facePhoto, issuedAt, serial } = card;
  const hero = picks.find((p) => p.id === heroId) ?? picks[0];
  const lineup = picks.filter((p) => p.id !== hero.id);
  const theme = getFanIdTheme(props.themeId);
  const rarity = frameRarity(result.code, locale);
  const complement = expandCode(result.code);
  const complementType = ARCHETYPES[complement];
  const date = issuedAt;

  return (
    <div
      ref={ref}
      data-sample={sample ? "true" : undefined}
      aria-label={`${copy.fanIdName} ${result.code}`}
      className="relative box-border w-[328px] overflow-hidden text-[#1c1e24] shadow-[0_0_0_1px_rgba(255,255,255,0.75),0_0_0_2px_rgba(0,0,0,0.22),0_24px_48px_rgba(0,0,0,0.35)]"
      style={{ backgroundImage: theme.surface, borderRadius: theme.radius, color: theme.text }}
    >
      {theme.stickers.map((src, index) => (
        <span
          key={src}
          aria-hidden="true"
          className="pointer-events-none absolute z-10 opacity-75"
          style={{
            width: index === 1 ? 42 : 48,
            top: index === 0 ? 82 : index === 1 ? 214 : undefined,
            right: index === 0 || index === 1 ? 8 : undefined,
            bottom: index === 2 ? 14 : undefined,
            left: index === 2 ? 8 : undefined,
            transform: index === 1 ? "rotate(8deg)" : index === 2 ? "rotate(-8deg)" : "rotate(6deg)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="h-auto w-full" />
        </span>
      ))}
      {/* dark header strip */}
      <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2" style={{ backgroundImage: theme.header }}>
        <span className="font-orbitron text-[11px] font-black tracking-[0.12em] text-white">
          ◆ {copy.fanIdName} · KSTAR FAN ID
        </span>
        <span className="text-right font-mono text-[8px] leading-[1.45] text-[#9a9a9a]">
          {sample && <>{copy.fanIdSampleTag}<br /></>}
          KS-{date.slice(0, 4)}<br />#{serial}
        </span>
      </div>

      <div className="p-[14px]">

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
              <img src={facePhoto} alt={copy.fanIdSelfLabel} className="h-[37px] w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-white/90 text-center text-[6.5px] font-bold tracking-[0.1em] text-[#5e636d]">{copy.fanIdSelfLabel}</span>
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1c1e24]/80 to-transparent px-2 pb-1.5 pt-5 text-[11px] font-bold text-white">
            {copy.fanIdHeroPrefix} · {hero.name_zh ?? hero.name}
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
          <span className="w-full text-[13px] font-black leading-tight">{result.archetype.name[locale]}</span>
          <span className="w-full font-orbitron text-[7.5px] font-bold leading-tight tracking-[0.08em] text-[#7c8088]">
            {locale === "zh" ? result.archetype.enName : result.code}
          </span>
          <span className="max-w-full self-center whitespace-nowrap rounded-full border border-[#a8822f] bg-[#d8b45a]/10 px-2 py-0.5 font-mono text-[8px] font-bold text-[#a8822f]">
            ✦ {rarity.label}
          </span>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {lineup.slice(0, 3).map((artist) => (
          <div key={artist.id} data-fanid-entry="lineup" className="overflow-hidden border-2 shadow-[0_2px_5px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.5)]" style={{ borderColor: `${theme.accent}70`, backgroundImage: theme.surface, borderRadius: theme.radius }}>
            <div className="aspect-[3/4]">
              <Thumb
                src={artist.image_url}
                seed={artist.id}
                label={artist.name_zh ?? artist.name}
                focusY={artist.image_focus}
                rounded="rounded-none"
              />
            </div>
            <p className="truncate px-1 py-0.5 text-center text-[7px] font-bold text-[#3a3a3a]">{artist.name_zh ?? artist.name}</p>
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5 border-t border-black/10 pt-2">
        {SCORE_LAYERS.map((layer) => (
          <div key={layer}>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(6, result.bars[layer])}%`, backgroundColor: LAYER_COLOR[layer], boxShadow: `0 0 4px ${LAYER_COLOR[layer]}99` }}
              />
            </div>
            <p className="mt-0.5 text-center text-[7px] font-bold text-[#5a5a5a]">{layerLabel(locale, layer)}</p>
          </div>
        ))}
      </div>

      <div
        className="mt-1.5 flex items-baseline gap-1.5 rounded-md border border-white/[0.6] px-2 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
        style={{ backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.25))" }}
      >
        <span className="shrink-0 text-[7px] font-bold tracking-[0.12em] text-[#6a6a6a]">{copy.fanIdComplementLabel}</span>
        <span className="font-orbitron text-[9px] font-black text-[#2a2a2a]">{complement}</span>
        <span className="truncate text-[8px] font-bold text-[#4a4a4a]">
          {complementType?.name[locale] ?? complement}
          {locale === "zh" && complementType ? ` · ${complementType.enName}` : ""}
        </span>
      </div>

      {fanName && (
        <p className="mt-2 border-t border-dashed border-black/15 pt-2 text-[10px] text-[#4a4a4a]">
          {copy.fanIdHolder} · <b className="text-[#1a1a1a]">{fanName}</b>
        </p>
      )}
      {song && (
        <p className={`${fanName ? "mt-1" : "mt-2 border-t border-dashed border-black/15 pt-2"} flex items-center gap-1.5 text-[10px] text-[#4a4a4a]`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={song.artworkUrl} alt="" className="h-4 w-4 rounded-sm" />
          <span className="truncate">{copy.fanIdSong} · <b className="text-[#1a1a1a]">{song.title}</b> — {song.artist} ♪</span>
        </p>
      )}

      <div className="mt-2.5 flex items-end justify-between border-t border-black/10 pt-2.5">
        <div>
          <div
            className="h-3.5 w-24 opacity-70"
            style={{ backgroundImage: `repeating-linear-gradient(90deg,${INK} 0 1px,transparent 1px 2px,${INK} 2px 4px,transparent 4px 7px)` }}
          />
          <p className="mt-1.5 font-mono text-[7px] tracking-[0.04em] text-[#6a6a6a]">{copy.fanIdIssuedLine(date)}</p>
        </div>
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/qr-start.svg" alt={copy.fanIdScanMe} className="h-[46px] w-[46px] rounded-[5px] border border-black/10 bg-white p-0.5" />
          <p className="mt-0.5 text-[7px] text-[#6a6a6a]">{copy.fanIdScanMe}</p>
        </div>
      </div>
      </div>
    </div>
  );
});

FanIdCard.displayName = "FanIdCard";

export default FanIdCard;
