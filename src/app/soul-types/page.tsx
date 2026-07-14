import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";
import { getCopy } from "@/lib/copy";
import { SCORE_LAYERS } from "@/lib/types";
import { ARCHETYPES, layerLabel, LAYER_COLOR, COLOR_STORIES, LEGEND_STORY } from "@/lib/archetypes";

const GHOST = "#c8ccd2";

function highCount(code: string) {
  return code.split("").filter((ch) => ch === ch.toUpperCase()).length;
}

// Same accent logic as a live result (COLOR_STORIES follows the highest axis),
// just derived from the archetype's fixed code instead of a scored result.
function accentFor(code: string, count: number): string {
  if (count === 4) return LEGEND_STORY.accent;
  if (count === 0) return "#7c8088";
  const idx = code.split("").findIndex((ch) => ch === ch.toUpperCase());
  return COLOR_STORIES[SCORE_LAYERS[idx]].accent;
}

export default async function SoulTypesPage() {
  const locale = await getLocale();
  const copy = getCopy(locale);

  const tierLabels = [copy.tierOmnivore, copy.tierPurist, copy.tierDuality, copy.tierNearPerfect, copy.tierLegend];
  const tiers = [0, 1, 2, 3, 4].map((count) => ({
    count,
    codes: Object.keys(ARCHETYPES).filter((c) => highCount(c) === count),
  }));

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="font-orbitron text-2xl font-black chrome-text">{copy.soulTypesTitle}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#5e636d]">{copy.soulTypesIntro}</p>
      </div>

      {tiers.map(({ count, codes }) => (
        <section key={count}>
          <h2 className="mb-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#9aa0aa]">
            {tierLabels[count]}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {codes.map((code) => {
              const archetype = ARCHETYPES[code];
              const accent = accentFor(code, count);
              return (
                <div
                  key={code}
                  className="rounded-[16px] border-2 bg-white p-4 shadow-[2px_2px_0_rgba(124,128,136,0.2)]"
                  style={{ borderColor: `${accent}55` }}
                >
                  <div className="flex justify-center gap-1 font-orbitron text-xl font-black leading-none">
                    {code.split("").map((ch, i) => (
                      <span key={i} style={{ color: ch === ch.toUpperCase() ? LAYER_COLOR[SCORE_LAYERS[i]] : GHOST }}>
                        {ch}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-base font-black text-[#1c1e24]">{archetype.name[locale]}</div>
                    {locale === "zh" && (
                      <div className="font-orbitron text-[9px] uppercase tracking-[0.2em] text-[#9aa0aa]">
                        {archetype.enName}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-center text-xs leading-relaxed text-[#5e636d]">「{archetype.tagline[locale]}」</p>
                  {archetype.missing && (
                    <p className="mt-2 text-center text-[10px] font-semibold" style={{ color: accent }}>
                      {copy.soulTypesMissingLabel}: {layerLabel(locale, archetype.missing)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="text-center">
        <Link
          href="/"
          className="inline-block rounded-full bg-[#b4302b] px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_12px_rgba(180,48,43,0.4)] transition hover:brightness-110"
        >
          {copy.soulTypesCta}
        </Link>
      </div>
    </div>
  );
}
