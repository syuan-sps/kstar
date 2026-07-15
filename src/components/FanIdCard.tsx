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
  cardMode?: "idol" | "idol-user" | "user";
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
  const { picks, heroId, result, fanName, song, showFace, facePhoto, issuedAt, serial, cardMode = "idol" } = card;
  const hero = picks.find((p) => p.id === heroId) ?? picks[0];
  const theme = getFanIdTheme(props.themeId);
  const isUserHero = cardMode === "user";
  const showOwnerBadge = cardMode === "idol-user" || (cardMode === "idol" && showFace === true);
  const portraitSrc = isUserHero ? facePhoto : hero.image_url;
  const portraitLabel = isUserHero ? (fanName || copy.fanIdSelfLabel) : (hero.name_zh ?? hero.name);
  const modeLabel = cardMode === "idol" ? "IDOL EDITION" : cardMode === "idol-user" ? "DUO EDITION" : "SELF EDITION";
  const rarity = frameRarity(result.code, locale);
  const complement = expandCode(result.code);
  const complementType = ARCHETYPES[complement];
  const date = issuedAt;

  return (
    <div
      ref={ref}
      data-sample={sample ? "true" : undefined}
      data-card-mode={cardMode}
      data-theme={theme.id}
      aria-label={`${copy.fanIdName} ${result.code}`}
      className="relative box-border w-[328px] overflow-hidden rounded-[28px] p-[7px] text-[#1c1e24] shadow-[0_1px_0_rgba(255,255,255,.9),0_0_0_1px_rgba(28,30,36,.42),0_28px_64px_rgba(28,30,36,.34)]"
      style={{
        backgroundImage: `linear-gradient(145deg,rgba(255,255,255,.96),rgba(255,255,255,.28) 18%,${theme.accent}70 44%,rgba(28,30,36,.58) 72%,rgba(255,255,255,.9)),${theme.surface}`,
        color: theme.text,
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-[2px] rounded-[26px] border border-white/80 shadow-[inset_0_0_0_1px_rgba(28,30,36,.18),inset_0_0_18px_rgba(255,255,255,.7)]" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[5px] z-30 h-[5px] w-16 -translate-x-1/2 rounded-full border border-black/20 bg-white/55 shadow-[inset_0_1px_2px_rgba(28,30,36,.2)]" />

      <div className="relative overflow-hidden rounded-[22px] border border-white/70 bg-[#eef0f3] shadow-[0_0_0_1px_rgba(28,30,36,.26),inset_0_0_0_1px_rgba(255,255,255,.72)]" style={{ backgroundImage: theme.surface }}>
        <header className="relative flex h-[54px] items-center justify-between overflow-hidden border-b border-white/10 px-3.5" style={{ backgroundImage: theme.header }}>
          <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: theme.accent }} />
          <div>
            <p className="font-orbitron text-[10px] font-black tracking-[0.14em] text-white">KSTAR · FAN ID</p>
            <p className="mt-1 font-mono text-[6.5px] tracking-[0.18em] text-white/45">{modeLabel} · {theme.label.toUpperCase()}</p>
          </div>
          <div className="text-right font-mono text-[7px] leading-[1.45] text-white/55">
            {sample && <>{copy.fanIdSampleTag}<br /></>}
            KS-{date.slice(0, 4)} · #{serial}
          </div>
        </header>

        <main className="relative p-3">
          <div aria-hidden="true" className="pointer-events-none absolute left-1 top-8 flex flex-col gap-1.5 opacity-55">
            {[0, 1, 2, 3].map((dot) => <span key={dot} className="h-1 w-1 rounded-full" style={{ backgroundColor: theme.accent }} />)}
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute right-1 top-8 font-orbitron text-[10px]" style={{ color: theme.accent }}>✦</div>

          <section data-fanid-entry="hero" className="relative aspect-[4/4.55] overflow-hidden rounded-[18px] border border-white/80 bg-[#dfe3e8] shadow-[0_0_0_1px_rgba(28,30,36,.32),0_12px_30px_rgba(28,30,36,.22)]">
            {portraitSrc ? (
              <Thumb src={portraitSrc} seed={hero.id} label={portraitLabel} focusY={isUserHero ? undefined : hero.image_focus} rounded="rounded-none" />
            ) : (
              <div className="grid h-full place-items-center bg-[linear-gradient(145deg,#dfe3e8,#f7f8fa)] px-8 text-center">
                <div>
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-dashed border-[#7c8088] font-orbitron text-lg text-[#7c8088]">+</div>
                  <p className="mt-2 text-[10px] font-bold text-[#5e636d]">{locale === "zh" ? "加入本人照片" : "Add your photo"}</p>
                </div>
              </div>
            )}
            <div aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-[13px] border border-white/35" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-[#101217]/90 via-[#101217]/50 to-transparent px-3 pb-3 pt-12 text-white">
              <div>
                <p className="font-mono text-[6px] tracking-[0.2em] text-white/55">{isUserHero ? "CARD HOLDER" : "SELECTED IDOL"}</p>
                <p className="mt-0.5 text-[13px] font-black">{portraitLabel}</p>
              </div>
              <span className="rounded-full border border-white/30 bg-black/25 px-2 py-1 font-orbitron text-[6px] tracking-[0.12em]">{modeLabel}</span>
            </div>

            {showOwnerBadge && (
              <div className="absolute bottom-3 right-3 z-20 h-[64px] w-[64px] rounded-full border border-white/80 p-[3px] shadow-[0_8px_18px_rgba(0,0,0,.35)]" style={{ background: `linear-gradient(145deg,#fff,${theme.accent})` }}>
                <div className="relative h-full w-full overflow-hidden rounded-full bg-[#dfe3e8]">
                  {facePhoto ? <img src={facePhoto} alt={copy.fanIdSelfLabel} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center font-orbitron text-sm text-[#5e636d]">+</span>}
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center font-orbitron text-[5px] tracking-[0.12em] text-white">OWNER</span>
                </div>
              </div>
            )}
          </section>

          <section data-fanid-archetype="true" className="relative z-10 -mt-2.5 rounded-[16px] border border-white/75 bg-white/[0.82] px-3 py-3 shadow-[0_0_0_1px_rgba(28,30,36,.16),0_8px_18px_rgba(28,30,36,.12),inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-[6px] tracking-[0.18em] text-[#7c8088]">FAN SOUL · ARCHETYPE</p>
                <div className="mt-1 flex items-end gap-2">
                  <span className="flex font-orbitron text-[27px] font-black leading-none tracking-[0.04em]">
                    {result.code.split("").map((letter, index) => {
                      const high = letter === letter.toUpperCase();
                      return <span key={`${letter}-${index}`} style={{ color: high ? INK : "#9aa0aa", fontWeight: high ? 900 : 500 }}>{letter}</span>;
                    })}
                  </span>
                  <span className="pb-0.5 text-[12px] font-black leading-tight">{result.archetype.name[locale]}</span>
                </div>
                <p className="mt-1 font-orbitron text-[6.5px] tracking-[0.1em] text-[#7c8088]">{locale === "zh" ? result.archetype.enName : result.code}</p>
              </div>
              <span className="whitespace-nowrap rounded-full border px-2 py-1 font-mono text-[7px] font-bold" style={{ borderColor: `${theme.accent}88`, color: theme.accent, backgroundColor: `${theme.accent}12` }}>✦ {rarity.label}</span>
            </div>

            <div className="mt-3 rounded-xl border border-black/10 bg-black/[0.035] px-2.5 py-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-orbitron text-[6px] font-bold tracking-[0.18em] text-[#5e636d]">FAN SIGNAL</span>
                <span className="font-mono text-[6px] text-[#9aa0aa]">4-AXIS PROFILE</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {SCORE_LAYERS.map((layer) => (
                  <div key={layer}>
                    <div className="h-1.5 overflow-hidden rounded-full bg-black/10">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(6, result.bars[layer])}%`, backgroundColor: LAYER_COLOR[layer] }} />
                    </div>
                    <p className="mt-1 text-center text-[6.5px] font-bold text-[#5a5a5a]">{layerLabel(locale, layer)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2 text-[7px] text-[#5e636d]">
              <span className="font-mono tracking-[0.12em]">{copy.fanIdComplementLabel}</span>
              <b className="font-orbitron text-[9px] text-[#1c1e24]">{complement}</b>
              <span className="truncate font-bold">{complementType?.name[locale] ?? complement}{locale === "zh" && complementType ? ` · ${complementType.enName}` : ""}</span>
            </div>
          </section>

          <footer className="mt-2.5 grid grid-cols-[1fr_auto] gap-3 rounded-[13px] border border-black/10 bg-black/[0.045] px-3 py-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-4 w-[76px] opacity-75" style={{ backgroundImage: `repeating-linear-gradient(90deg,${INK} 0 1px,transparent 1px 2px,${INK} 2px 4px,transparent 4px 7px)` }} />
                <span className="font-mono text-[6px] tracking-[0.1em] text-[#7c8088]">#{serial}</span>
              </div>
              <p className="mt-1.5 truncate text-[9px] text-[#4a4a4a]">{copy.fanIdHolder} · <b className="text-[#1a1a1a]">{fanName || "—"}</b></p>
              <p className="mt-0.5 truncate text-[7px] text-[#7c8088]">BIAS · {hero.name_zh ?? hero.name}</p>
              {song && <p className="mt-0.5 truncate text-[7px] text-[#7c8088]">♪ {song.title} — {song.artist}</p>}
              <p className="mt-1 font-mono text-[6px] tracking-[0.04em] text-[#9aa0aa]">{copy.fanIdIssuedLine(date)}</p>
            </div>
            <div className="text-center">
              <img src="/qr-start.svg" alt={copy.fanIdScanMe} className="h-[43px] w-[43px] rounded-[6px] border border-black/10 bg-white p-0.5" />
              <p className="mt-0.5 text-[5.5px] text-[#7c8088]">{copy.fanIdScanMe}</p>
            </div>
          </footer>
        </main>
      </div>

      <span aria-hidden="true" className="pointer-events-none absolute left-[3px] top-[88px] font-orbitron text-[9px] text-white/80">✦</span>
      <span aria-hidden="true" className="pointer-events-none absolute bottom-[54px] right-[3px] font-orbitron text-[10px]" style={{ color: theme.accent }}>✦</span>
    </div>
  );
});

FanIdCard.displayName = "FanIdCard";

export default FanIdCard;
