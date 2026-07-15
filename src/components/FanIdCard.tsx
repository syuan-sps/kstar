"use client";

// 追星證 — Premium Mirror Chrome Fan ID. Matches the Figma Make redesign
// (2026-07-15): a brushed-silver membership card with a living specular
// highlight that follows the pointer, plus a slow ambient chrome shimmer.
// Data-driven from the same archetype/pick props as the rest of the 追星靈魂
// flow — no new data model, just the new metallic presentation.
import { forwardRef, useRef } from "react";
import type { CardArtist } from "@/lib/lite";
import type { ArchetypeResult } from "@/lib/archetypes";
import Thumb from "@/components/Thumb";

export interface FanIdCardProps {
  hero: CardArtist; // 本命 — spotlighted idol
  result: ArchetypeResult;
  fanName?: string; // 粉絲人 — the card holder's handle
  tags?: string[]; // e.g. ["#本命", "#生活", "#Aesthetic Soul"]
  globalRankPct?: number; // e.g. 2.8 → "2.8% 全球排名" — omit entirely until real rank data exists
  issuedAt?: string; // YYYY-MM-DD, defaults to today
  serial?: string; // 4-digit stable id, e.g. "0013"
  showFace?: boolean; // Version A (本人, face shown) vs Version B (純分享, face hidden) — default true
  facePhoto?: string | null; // cropped data-URL of the fan's own photo; omitted → placeholder avatar
}

// Generic "add your photo" placeholder — used for both the idol slot (via Thumb's own
// gradient fallback) and the user's face slot when no facePhoto has been uploaded yet.
function FacePlaceholder({ size }: { size: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full border border-dashed border-black/25 bg-black/[0.04] text-black/35"
      style={{ width: size, height: size }}
      aria-label="尚未上傳照片"
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
    </div>
  );
}

const sparkles = [
  { src: "/fanid/star4.svg", top: "-6%", left: "88%", size: 44, rotate: -4, opacity: 0.85 },
  { src: "/fanid/sphere.svg", top: "12%", left: "104%", size: 20, rotate: 0, opacity: 0.8 },
  { src: "/fanid/heart.svg", top: "26%", left: "100%", size: 20, rotate: 8, opacity: 0.6 },
  { src: "/fanid/star4.svg", top: "92%", left: "-6%", size: 36, rotate: 12, opacity: 0.85 },
  { src: "/fanid/bow.svg", top: "68%", left: "-10%", size: 30, rotate: -6, opacity: 0.65 },
  { src: "/fanid/sphere.svg", top: "84%", left: "-4%", size: 14, rotate: 0, opacity: 0.55 },
];

const FanIdCard = forwardRef<HTMLDivElement, FanIdCardProps>(function FanIdCard(
  {
    hero,
    result,
    fanName,
    tags = ["#本命", "#生活", "#Aesthetic Soul"],
    globalRankPct,
    issuedAt,
    serial = "0013",
    showFace = true,
    facePhoto,
  },
  ref,
) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const date = issuedAt ?? new Date().toISOString().slice(0, 10);
  const year = date.slice(0, 4);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = surfaceRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }

  return (
    <div ref={ref} className="relative w-[358px]" onMouseMove={onMouseMove}>
      {sparkles.map((s, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={s.src}
          alt=""
          aria-hidden
          className="pointer-events-none absolute animate-[chrome-float_7s_ease-in-out_infinite]"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            transform: `rotate(${s.rotate}deg)`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}

      <div
        ref={surfaceRef}
        className="group relative overflow-hidden rounded-[28px] shadow-[0_0_0_1px_rgba(255,255,255,0.75),0_0_0_2px_rgba(0,0,0,0.28),0_35px_70px_rgba(0,0,0,0.9),0_15px_30px_rgba(0,0,0,0.55)]"
        style={{
          backgroundImage:
            "linear-gradient(112deg, #7a7a7a 8%, #e0e0e0 15%, #c8c8c8 22%, #fff 28%, #ececec 33%, #d2d2d2 40%, #a8a8a8 47%, #c5c5c5 53%, #ebebeb 60%, #fff 65%, #d8d8d8 72%, #b2b2b2 78%, #cccccc 85%, #888 92%)",
        }}
      >
        {/* pointer-tracked specular sheen */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(220px circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.65), rgba(255,255,255,0.12) 40%, transparent 70%)",
          }}
        />
        {/* ambient chrome shimmer sweep */}
        <div className="pointer-events-none absolute inset-0 animate-[fanid-shimmer_5s_ease-in-out_infinite] bg-[linear-gradient(100deg,transparent_35%,rgba(255,255,255,0.55)_50%,transparent_65%)]" />

        {/* header */}
        <div className="relative flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[rgba(18,18,18,0.94)] to-[rgba(36,36,36,0.9)] px-4 pb-[11px] pt-[10px]">
          <div className="flex items-center gap-2">
            <div
              className="flex size-[22px] items-center justify-center rounded-[5px]"
              style={{ backgroundImage: "linear-gradient(135deg, #666 0%, #eee 38%, #aaa 55%, #e8e8e8 100%)" }}
            >
              <span className="text-[10px] font-black tracking-[-0.2px] text-[#111]">K★</span>
            </div>
            <span
              className="bg-clip-text text-[10px] font-semibold uppercase tracking-[2px] text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, #777 0%, #ddd 25%, #aaa 50%, #fff 75%, #999 100%)" }}
            >
              追星團 · Kstar Fan ID
            </span>
          </div>
          <div className="flex items-center gap-1 text-right font-mono text-[8px] leading-none">
            <span className="text-[#666]">KS-{year}</span>
            <span className="font-bold text-[#b5b5b5]">#{serial}</span>
          </div>
        </div>

        {/* code + rank */}
        <div className="relative px-4 pb-2 pt-4">
          <div className="flex items-end justify-between">
            <div>
              <p
                className="bg-clip-text text-[36px] font-black leading-[36px] tracking-[1.8px] text-transparent"
                style={{ backgroundImage: "linear-gradient(171deg, #2a2a2a 8%, #0d0d0d 25%, #4a4a4a 43%, #161616 58%, #3d3d3d 73%, #1a1a1a 92%)" }}
              >
                {result.archetype.code}
              </p>
              <p className="text-[14px] font-bold text-[#181818]">{result.archetype.name.zh}</p>
            </div>
            {globalRankPct != null && (
              <div className="flex flex-col items-end gap-2">
                <div
                  className="relative rounded-full px-3 py-[6px] shadow-[0_3px_10px_rgba(0,0,0,0.45)]"
                  style={{ backgroundImage: "linear-gradient(90deg, #0f0f0f, #222, #0f0f0f)" }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="bg-clip-text text-[15px] font-black text-transparent"
                      style={{ backgroundImage: "linear-gradient(90deg, #b8b8b8, #fff, #ccc)" }}
                    >
                      {globalRankPct}%
                    </span>
                    <span className="text-[9px] font-medium tracking-[0.36px] text-[#777]">全球排名</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* hero + 我的照片 row — the two people this card is about, given real presence */}
          <div className="mt-4 flex items-center justify-between gap-3">
            {/* 本命 idol — always shows a photo or Thumb's own gradient-initials placeholder */}
            <div className="flex items-center gap-2.5">
              <div className="size-16 shrink-0 overflow-hidden rounded-full ring-2 ring-black/10 shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
                <Thumb src={hero.image_url} seed={hero.id} label={hero.name_zh ?? hero.name} rounded="rounded-full" focusY={hero.image_focus} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-semibold tracking-[0.25px] text-[#5a5a5a]">✦ 最愛爱豆</span>
                <span className="max-w-[92px] truncate text-[13px] font-bold text-[#181818]">{hero.name_zh ?? hero.name}</span>
              </div>
            </div>

            {/* 我的照片 — the fan's own face. Version A (showFace) shows the upload or a
                placeholder; Version B swaps in a privacy glyph so no face slot ever appears. */}
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[9px] font-semibold tracking-[0.25px] text-[#5a5a5a]">{showFace ? "我的照片" : "純分享版"}</span>
                {fanName && <span className="max-w-[92px] truncate text-[13px] font-bold text-[#181818]">{fanName}</span>}
              </div>
              {showFace ? (
                facePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={facePhoto} alt="本人" className="size-16 shrink-0 rounded-full object-cover ring-2 ring-white/80 shadow-[0_2px_6px_rgba(0,0,0,0.25)]" />
                ) : (
                  <FacePlaceholder size={64} />
                )
              ) : (
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full border border-black/15 bg-black/[0.04] text-black/35" aria-label="純分享版 · 未顯示本人照片">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3l18 18M10.6 5.1A9.6 9.6 0 0 1 12 5c5 0 9 4 10 7-.4 1.2-1.2 2.5-2.3 3.6M6.3 6.3C4.2 7.8 2.7 9.9 2 12c1 3 5 7 10 7 1.4 0 2.7-.3 3.9-.8" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* stat bar — single clear 本命指數 read, not a duplicated pair */}
        <div className="relative px-4 pb-3">
          <div className="flex items-center justify-between text-[9px] font-bold tracking-[0.36px] text-[#3a3a3a]">
            <span>本命指數</span>
            <span className="text-[#5a5a5a]">67%</span>
          </div>
          <div className="mt-1.5 h-[6px] w-full overflow-hidden rounded-full bg-black/10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.2),inset_0_-1px_0_rgba(255,255,255,0.35)]">
            <div
              className="h-full w-[67%] rounded-full shadow-[0_0_6px_rgba(255,255,255,0.35)]"
              style={{ backgroundImage: "linear-gradient(90deg, #3d3d3d 0%, #7a7a7a 20%, #ccc 40%, #fff 52%, #c0c0c0 64%, #888 80%, #3d3d3d 100%)" }}
            />
          </div>
        </div>

        {/* tags + fan handle */}
        <div className="relative px-4 pb-3">
          <div className="rounded-2xl border border-white/[0.38] bg-black/[0.06] p-[13px] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(0,0,0,0.06)]">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/[0.68] px-[9px] py-[3px] text-[10px] font-semibold text-[#1a1a1a] shadow-[0_1px_0_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)]"
                  style={{ backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.38))" }}
                >
                  {t}
                </span>
              ))}
            </div>
            {fanName && (
              <p className="mt-2 flex items-center gap-2 text-[9px] text-[#4a4a4a]">
                粉絲人：
                <span
                  className="bg-clip-text font-bold tracking-[1.1px] text-transparent"
                  style={{ backgroundImage: "linear-gradient(90deg, #2d2d2d, #5a5a5a, #2d2d2d)" }}
                >
                  {fanName}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* footer: barcode + QR */}
        <div className="relative flex items-end justify-between gap-3 border-t border-white/[0.18] px-4 pb-5 pt-[13px]">
          <div className="flex-1">
            <div className="flex h-9 items-end gap-[1.5px]">
              {Array.from({ length: 48 }).map((_, i) => (
                <span
                  key={i}
                  className="w-[2px] rounded-[0.5px] bg-black/70"
                  style={{ height: `${21 + ((i * 37) % 15)}px` }}
                />
              ))}
            </div>
            <p className="mt-1.5 text-center font-mono text-[7.5px] tracking-[0.75px] text-[#555]">
              {date} · KS-{serial}
            </p>
          </div>
          <div
            className="size-[60px] shrink-0 rounded-[14px] bg-white p-[5px] shadow-[0_3px_5px_rgba(0,0,0,0.25)]"
            aria-hidden
          >
            <img src="/qr-start.svg" alt="" className="h-full w-full" />
          </div>
        </div>

        {/* bottom foil edge */}
        <div
          className="h-[5px] w-full"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #555 0%, #999 7%, #eee 14%, #fff 21%, #ddd 29%, #aaa 36%, #666 43%, #eee 50%, #fff 57%, #ccc 64%, #888 71%, #eee 79%, #fff 86%, #bbb 93%, #555 100%)",
          }}
        />

        {/* inset chrome bevel */}
        <div className="pointer-events-none absolute inset-0 rounded-[28px] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.92),inset_0_-1.5px_0_rgba(0,0,0,0.16),inset_1.5px_0_0_rgba(255,255,255,0.55),inset_-1.5px_0_0_rgba(0,0,0,0.1)]" />
      </div>
    </div>
  );
});

export default FanIdCard;
