"use client";

// 追星證 — a fixed-width, export-safe hero + lineup certificate. The component
// owns no controls and never reads the catalog; issuing flows pass CardArtist
// records and may capture the forwarded node through its ref.

import { forwardRef, useRef } from "react";
import Thumb from "@/components/Thumb";
import FanIdCustomStickerLayer from "@/components/FanIdCustomStickerLayer";
import { FanIdStickerCanvasEditor, type CustomStickerCanvasEditorProps } from "@/components/FanIdStickerEditor";
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
import { SCORE_LAYERS, type FanIdCardMode } from "@/lib/types";
import type { PlacedCustomSticker } from "@/lib/fanIdCustomStickers";

interface FanIdCardCommonProps {
  themeId?: FanIdThemeId;
  cardMode?: FanIdCardMode;
  fanName?: string;
  showFace?: boolean;
  facePhoto?: string | null;
  idolPhoto?: string | null;
  userPortraitPhoto?: string | null;
  userAvatarPhoto?: string | null;
  customStickers?: readonly PlacedCustomSticker[];
  customStickerEditor?: CustomStickerCanvasEditorProps;
  /** "Photo only" layout — hides the 追星靈魂 / FAN SIGNAL block, keeping the photo + banners. */
  hideArchetype?: boolean;
  /** Static details inside the card's structural rails; enabled by default. */
}

export interface FanIdCardSampleProps extends FanIdCardCommonProps {
  sample: true;
}

export interface FanIdCardProductionProps extends FanIdCardCommonProps {
  sample?: false;
  picks: CardArtist[];
  heroId: string;
  /** Absent until the visitor takes the quiz — the archetype slot then shows an
      unlock invitation instead of a result. Never faked: a placeholder code
      would leak into the aria-label and the rarity badge. */
  result?: ArchetypeResult;
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
  const {
    picks,
    heroId,
    result,
    fanName,
    issuedAt,
    serial,
  } = card;
  const {
    showFace,
    facePhoto,
    idolPhoto,
    userPortraitPhoto,
    userAvatarPhoto,
    customStickers = [],
    customStickerEditor,
    cardMode = "idol",
    hideArchetype = false,
  } = props;
  const hero = picks.find((p) => p.id === heroId) ?? picks[0];
  const theme = getFanIdTheme(props.themeId);
  const isUserHero = cardMode === "user";
  const showOwnerBadge = cardMode === "idol-user" || (cardMode === "idol" && showFace === true);
  const effectiveUserPortrait = userPortraitPhoto ?? facePhoto ?? null;
  const effectiveUserAvatar = userAvatarPhoto ?? facePhoto ?? null;
  const portraitSrc = isUserHero
    ? effectiveUserPortrait
    : idolPhoto ?? hero.image_url ?? null;
  const photoSource = portraitSrc === null
    ? "missing"
    : isUserHero || idolPhoto !== null && idolPhoto !== undefined ? "custom" : "catalog";
  const avatarSource = effectiveUserAvatar ? "custom" : "missing";
  const portraitLabel = isUserHero ? (fanName || copy.fanIdSelfLabel) : (hero.name_zh ?? hero.name);
  const modeLabel = cardMode === "idol" ? "IDOL EDITION" : cardMode === "idol-user" ? "DUO EDITION" : "SELF EDITION";
  const rarity = result ? frameRarity(result.code, locale) : null;
  const complement = result ? expandCode(result.code) : null;
  const complementType = complement ? ARCHETYPES[complement] : null;
  const date = issuedAt;
  const rootRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const archetypeRef = useRef<HTMLElement>(null);

  // The sticker canvas deliberately always spans the VISIBLE card. It used to
  // keep the taller full-card height in photo-only mode and let the card clip
  // the overflow, which silently deleted any sticker placed low on the card the
  // moment you toggled. Sticker coordinates are percentages, so tracking the
  // visible box keeps every sticker on the card and in the same relative spot.

  function attachRoot(node: HTMLDivElement | null) {
    rootRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  }

  return (
    <div
      ref={attachRoot}
      data-sample={sample ? "true" : undefined}
      data-card-mode={cardMode}
      data-theme={theme.id}
      aria-label={result ? `${copy.fanIdName} ${result.code}` : copy.fanIdName}
      className="relative box-border w-[328px] overflow-hidden rounded-[28px] p-[11px] text-[#1c1e24] shadow-[0_1px_0_rgba(255,255,255,.9),0_0_0_1px_rgba(28,30,36,.42),0_28px_64px_rgba(28,30,36,.34)]"
      style={{ backgroundImage: theme.surface, color: theme.text }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[4px] z-30 h-[5px] w-16 -translate-x-1/2 rounded-full border border-black/20 bg-white/55 shadow-[inset_0_1px_2px_rgba(28,30,36,.2)]" />

      <div
        ref={surfaceRef}
        className="relative overflow-hidden rounded-[22px] border border-white/70 bg-[#eef0f3] shadow-[0_0_0_1px_rgba(28,30,36,.26),inset_0_0_0_1px_rgba(255,255,255,.72)]"
        style={{ backgroundImage: theme.surface }}
      >
        <header className="relative z-10 flex h-[54px] items-center justify-between overflow-hidden border-b border-white/10 px-3.5" style={{ backgroundImage: theme.header }}>
          <div>
            {/* nowrap: exports skip font embedding, so the fallback face is wider
                and these wrapped — "ID" dropped onto the edition line. */}
            <p className="whitespace-nowrap font-orbitron text-[10px] font-black tracking-[0.14em] text-white">KStar · FAN ID</p>
            <p className="mt-1 whitespace-nowrap font-mono text-[6.5px] tracking-[0.18em] text-white/45">{modeLabel} · {theme.label.toUpperCase()}</p>
          </div>
          <div className="text-right font-mono text-[7px] leading-[1.45] text-white/55">
            {sample && <>{copy.fanIdSampleTag}<br /></>}
            KS-{date.slice(0, 4)} · #{serial}
          </div>
        </header>

        <main className="relative z-10 p-3">
          <div aria-hidden="true" className="pointer-events-none absolute left-1 top-8 flex flex-col gap-1.5 opacity-55">
            {[0, 1, 2, 3].map((dot) => <span key={dot} className="h-1 w-1 rounded-full" style={{ backgroundColor: theme.accent }} />)}
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute right-1 top-8 font-orbitron text-[10px]" style={{ color: theme.accent }}>✦</div>

          <section data-fanid-entry="hero" data-photo-source={photoSource} className="relative aspect-[4/4.55] overflow-hidden rounded-[18px] border border-white/80 bg-[#dfe3e8] shadow-[0_0_0_1px_rgba(28,30,36,.32),0_12px_30px_rgba(28,30,36,.22)]">
            {portraitSrc ? (
              <Thumb src={portraitSrc} seed={hero.id} label={portraitLabel} focusY={isUserHero || idolPhoto !== null && idolPhoto !== undefined ? undefined : hero.image_focus} rounded="rounded-none" />
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
            </div>

            {showOwnerBadge && (
              <div data-avatar-source={avatarSource} className="absolute bottom-3 right-3 z-20 h-[64px] w-[64px] rounded-full border border-white/80 p-[3px] shadow-[0_8px_18px_rgba(0,0,0,.35)]" style={{ background: `linear-gradient(145deg,#fff,${theme.accent})` }}>
                <div className="relative h-full w-full overflow-hidden rounded-full bg-[#dfe3e8]">
                  {effectiveUserAvatar ? <img src={effectiveUserAvatar} alt={copy.fanIdSelfLabel} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center font-orbitron text-sm text-[#5e636d]">+</span>}
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center font-orbitron text-[5px] tracking-[0.12em] text-white">OWNER</span>
                </div>
              </div>
            )}
          </section>

          {/* One node either way: the sticker-canvas measurement above depends on
              archetypeRef existing. Without a quiz result the slot becomes an
              invitation, so the card reads as unfinished rather than as a card
              with a section quietly missing. data-export-hide keeps the pitch
              out of the downloaded PNG. */}
          <section
            ref={archetypeRef}
            data-fanid-archetype={result ? "true" : "locked"}
            // Hidden here means hidden in the PNG too: photo-only parks this
            // block at absolute top-0 behind `invisible`, so if the export ever
            // loses that style it would print straight over the photo.
            data-export-hide={!result || hideArchetype ? "true" : undefined}
            className={`${hideArchetype ? "invisible absolute left-3 right-3 top-0" : "relative z-10 mt-2.5"} rounded-[16px] ${result
              ? "border border-white/75 bg-white/[0.82] px-3 py-3 shadow-[0_0_0_1px_rgba(28,30,36,.16),0_8px_18px_rgba(28,30,36,.12),inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-sm"
              : "border-2 border-dashed px-3 py-4 text-center"}`}
            style={result ? undefined : { borderColor: "#b4302b", backgroundColor: "rgba(180,48,43,0.05)" }}
          >
            {!result && (
              <>
                <p className="font-mono text-[6px] tracking-[0.18em]" style={{ color: "#b4302b" }}>{copy.fanIdUnlockKicker}</p>
                <p className="mt-1.5 text-[12px] font-black text-[#1c1e24]">{copy.fanIdUnlockTitle}</p>
                <p className="mt-1 text-[8px] text-[#7c8088]">{copy.fanIdUnlockBody}</p>
              </>
            )}
            {result && (<>
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
              <span className="whitespace-nowrap rounded-full border px-2 py-1 font-mono text-[7px] font-bold" style={{ borderColor: `${theme.accent}88`, color: theme.accent, backgroundColor: `${theme.accent}12` }}>✦ {rarity?.label}</span>
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
            </>)}
          </section>

          <footer className="mt-2.5 grid grid-cols-[1fr_auto] gap-3 rounded-[13px] border border-black/10 bg-black/[0.045] px-3 py-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-4 w-[76px] opacity-75" style={{ backgroundImage: `repeating-linear-gradient(90deg,${INK} 0 1px,transparent 1px 2px,${INK} 2px 4px,transparent 4px 7px)` }} />
                <span className="font-mono text-[6px] tracking-[0.1em] text-[#7c8088]">#{serial}</span>
              </div>
              <p className="mt-1.5 truncate text-[9px] text-[#4a4a4a]">{copy.fanIdHolder} · <b className="text-[#1a1a1a]">{fanName || copy.fanIdHolderPlaceholder}</b></p>
              <p className="mt-0.5 truncate text-[7px] text-[#7c8088]">BIAS · {hero.name_zh ?? hero.name}</p>
              <p className="mt-1 font-mono text-[6px] tracking-[0.04em] text-[#9aa0aa]">{copy.fanIdIssuedLine(date)}</p>
            </div>
            <div className="text-center">
              <img src="/qr-start.svg" alt={copy.fanIdScanMe} className="h-[43px] w-[43px] rounded-[6px] border border-black/10 bg-white p-0.5" />
              <p className="mt-0.5 text-[5.5px] text-[#7c8088]">{copy.fanIdScanMe}</p>
            </div>
          </footer>
        </main>
        <div
          data-fanid-sticker-canvas
          className="absolute inset-x-0 top-0 z-40"
          style={{ height: "100%" }}
        >
          {customStickerEditor
            ? <FanIdStickerCanvasEditor {...customStickerEditor} stickers={customStickers} />
            : <FanIdCustomStickerLayer stickers={customStickers} />}
        </div>
      </div>
    </div>
  );
});

FanIdCard.displayName = "FanIdCard";

export default FanIdCard;
