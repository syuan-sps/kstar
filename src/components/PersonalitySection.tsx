import type { Artist } from "@/lib/types";

export default function PersonalitySection({ artist }: { artist: Artist }) {
  const p = artist.profile?.personality;
  if (!p?.vibe) return null;

  return (
    <section className="rounded-3xl border-2 border-[#ff00cc]/30 bg-gradient-to-b from-white/95 to-[#fff0f8]/90 p-5 text-[#1a0028] shadow-[4px_4px_0_rgba(255,0,204,0.18)]">
      <div className="flex items-center gap-2">
        <span className="text-base">✦</span>
        <h2 className="font-orbitron text-sm font-black uppercase tracking-[0.15em] text-[#cc0099]">
          個性分析
        </h2>
      </div>

      <p className="mt-2 text-lg font-black text-[#1a0028]">{p.vibe}</p>

      {p.trait_tags && p.trait_tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.trait_tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-[#ff00cc]/12 px-3 py-1 text-xs font-semibold text-[#cc0099]"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {p.mbti && (
        <div className="mt-4">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#990066]/70">
            MBTI
          </div>
          <span className="rounded-full bg-[#7700cc]/10 px-3 py-1 text-xs font-semibold text-[#7700cc]">
            {p.mbti}
          </span>
        </div>
      )}

      {p.analysis && (
        <p className="mt-4 border-t border-[#ff00cc]/15 pt-3 text-sm leading-relaxed text-[#3a1030]">
          {p.analysis}
        </p>
      )}
    </section>
  );
}
