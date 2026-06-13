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
    <section className="rounded-3xl border-2 border-[#c8ccd2]/30 bg-gradient-to-b from-white/95 to-[#eceef1]/90 p-5 text-[#1c1e24] shadow-[4px_4px_0_rgba(124,128,136,0.3)]">
      <div className="flex items-center gap-2">
        <span className="text-base">✦</span>
        <h2 className="font-orbitron text-sm font-black uppercase tracking-[0.15em] text-[#1c1e24]">
          {title}
        </h2>
      </div>

      <p className="mt-2 text-lg font-black text-[#1c1e24]">{vibe}</p>

      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-[#7c8088]/12 px-3 py-1 text-xs font-semibold text-[#1c1e24]"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {analysis && (
        <p className="mt-4 border-t border-[#c8ccd2]/15 pt-3 text-sm leading-relaxed text-[#1c1e24]">
          {analysis}
        </p>
      )}
    </section>
  );
}
