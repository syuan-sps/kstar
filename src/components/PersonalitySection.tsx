"use client";

import type { Artist } from "@/lib/types";
import { useCopy } from "@/lib/i18n/LocaleProvider";

export default function PersonalitySection({ artist }: { artist: Artist }) {
  const copy = useCopy();
  const p = artist.profile?.personality;
  if (!p?.vibe) return null;

  return (
    <section className="rounded-3xl border-2 border-[#c8ccd2]/30 bg-gradient-to-b from-white/95 to-[#eceef1]/90 p-5 text-[#1c1e24] shadow-[4px_4px_0_rgba(124,128,136,0.3)]">
      <div className="flex items-center gap-2">
        <span className="text-base">✦</span>
        <h2 className="font-orbitron text-sm font-black uppercase tracking-[0.15em] text-[#1c1e24]">
          {copy.analysisPersonality}
        </h2>
      </div>

      <p className="mt-2 text-lg font-black text-[#1c1e24]">{p.vibe}</p>

      {p.trait_tags && p.trait_tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.trait_tags.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="rounded-full bg-[#7c8088]/12 px-3 py-1 text-xs font-semibold text-[#1c1e24]"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {p.mbti && (
        <div className="mt-4">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5e636d]">
            MBTI
          </div>
          <span className="rounded-full bg-[#7c8088]/10 px-3 py-1 text-xs font-semibold text-[#1c1e24]">
            {p.mbti}
          </span>
        </div>
      )}

      {p.analysis && (
        <p className="mt-4 border-t border-[#c8ccd2]/15 pt-3 text-sm leading-relaxed text-[#1c1e24]">
          {p.analysis}
        </p>
      )}
    </section>
  );
}
