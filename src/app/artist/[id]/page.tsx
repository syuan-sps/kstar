import { notFound } from "next/navigation";
import Link from "next/link";
import { getArtist, getAllArtists } from "@/lib/data";
import { similarArtists } from "@/lib/similarity";
import { personalReason } from "@/lib/cardMeta";
import { DEFAULT_WEIGHTS, type LayerFilter, type SimilarArtist, type Weights } from "@/lib/types";
import { getCopy } from "@/lib/copy";
import { getLocale } from "@/lib/i18n/server";
import { localizeArtist } from "@/lib/i18n/catalog";
import Thumb from "@/components/Thumb";
import AddPhotoCTA from "@/components/AddPhotoCTA";
import FavoriteButton from "@/components/FavoriteButton";
import AddToFourCutsButton from "@/components/AddToFourCutsButton";
import ProfileExplorer from "@/components/ProfileExplorer";

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const copy = getCopy(locale);
  const [artist, allArtists] = await Promise.all([getArtist(id), getAllArtists()]);
  if (!artist) notFound();

  // Precompute top-6 recommendations per layer server-side — the client
  // only switches between these lists (keeps the full catalog out of the payload).
  const LAYERS: LayerFilter[] = ["all", "aesthetic", "personality", "performance", "content"];
  const recsByLayer = Object.fromEntries(
    LAYERS.map((l) => {
      const w: Weights =
        l === "all"
          ? DEFAULT_WEIGHTS
          : { aesthetic: 0, personality: 0, performance: 0, content: 0, [l]: 1 };
      return [l, similarArtists(artist, allArtists, w, 6)];
    })
  ) as Record<LayerFilter, SimilarArtist[]>;

  // Personalized reason vs THIS page idol, per unique candidate (client
  // shows it only when this idol is one of the user's four picks).
  const personalBySrc: Record<string, string | null> = {};
  for (const l of LAYERS) {
    for (const s of recsByLayer[l]) {
      if (!(s.artist.id in personalBySrc)) {
        personalBySrc[s.artist.id] = personalReason(s.artist, [artist.id], allArtists, locale);
      }
    }
  }

  // Localize LAST — similarity + personalReason above always run on raw zh
  // artists; only the render below (and the reason-API prompt SimilarSection
  // builds from sourceArtist) should ever see EN-translated profile text.
  // id → romanized name, so the four-cut swap toast can name whoever gets
  // rotated out. Just names (not the catalog), matching FourCuts' own labels.
  const nameById: Record<string, string> = Object.fromEntries(allArtists.map((a) => [a.id, a.name]));

  const displayArtist = localizeArtist(artist, locale);
  const displayRecsByLayer = Object.fromEntries(
    LAYERS.map((l) => [l, recsByLayer[l].map((s) => ({ ...s, artist: localizeArtist(s.artist, locale) }))]),
  ) as Record<LayerFilter, SimilarArtist[]>;

  return (
    <div className="space-y-10">
      {/* Artist header */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-3xl ring-2 ring-[#c8ccd2]/40">
          <Thumb src={displayArtist.image_url} seed={displayArtist.id} label={displayArtist.name} rounded="rounded-3xl" focusY={displayArtist.image_focus} />
          {!displayArtist.image_url && (
            <AddPhotoCTA idolId={displayArtist.id} name={displayArtist.name} className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-orbitron text-3xl font-black text-[#1c1e24]">{displayArtist.name}</span>
            {displayArtist.instagram && (
              <a
                href={`https://instagram.com/${displayArtist.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`@${displayArtist.instagram}`}
                aria-label={copy.instagramLabel(displayArtist.instagram)}
                className="text-[#9aa0aa] transition hover:text-[#1c1e24]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4.5" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                </svg>
              </a>
            )}
          </div>
          {displayArtist.name_zh && displayArtist.name_zh !== displayArtist.name && (
            <div className="mt-1 text-[#5e636d]">{displayArtist.name_zh}</div>
          )}
          {displayArtist.group && (
            <div className="mt-0.5 text-sm text-[#5e636d]/70">{displayArtist.group}</div>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {displayArtist.genres.map((g) => (
              <span key={g} className="rounded-full bg-[#7c8088]/15 px-2.5 py-0.5 text-xs text-[#5e636d]">
                {g}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <FavoriteButton id={displayArtist.id} />
            <AddToFourCutsButton id={displayArtist.id} name={displayArtist.name} nameById={nameById} />
          </div>
        </div>
      </section>

      {/* Analysis cards + similar artists — shared 全部/美學/個性/表演/內容 filter */}
      <ProfileExplorer artist={displayArtist} recsByLayer={displayRecsByLayer} personalBySrc={personalBySrc} />

      <Link href="/" className="inline-block text-sm text-[#9aa0aa] hover:text-[#1c1e24]">
        ← {copy.backHome}
      </Link>
    </div>
  );
}
