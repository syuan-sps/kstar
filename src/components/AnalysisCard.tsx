// Shared card shell for analysis sections — same design language as AestheticSection:
// ✦ header, vibe headline, trait chips, optional analysis paragraph.

export default function AnalysisCard({
  title,
  vibe,
  tags,
  analysis,
}: {
  title: string;
  vibe: string;
  tags?: string[];
  analysis?: string;
}) {
  return (
    <section className="rounded-3xl border-2 border-[#ff00cc]/30 bg-gradient-to-b from-white/95 to-[#fff0f8]/90 p-5 text-[#1a0028] shadow-[4px_4px_0_rgba(255,0,204,0.18)]">
      <div className="flex items-center gap-2">
        <span className="text-base">✦</span>
        <h2 className="font-orbitron text-sm font-black uppercase tracking-[0.15em] text-[#cc0099]">
          {title}
        </h2>
      </div>

      <p className="mt-2 text-lg font-black text-[#1a0028]">{vibe}</p>

      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-[#ff00cc]/12 px-3 py-1 text-xs font-semibold text-[#cc0099]"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {analysis && (
        <p className="mt-4 border-t border-[#ff00cc]/15 pt-3 text-sm leading-relaxed text-[#3a1030]">
          {analysis}
        </p>
      )}
    </section>
  );
}
