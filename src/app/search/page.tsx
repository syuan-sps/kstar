import Link from "next/link";
import { searchArtists } from "@/lib/data";
import { getCopy } from "@/lib/copy";
import { getLocale } from "@/lib/i18n/server";
import { localizeArtists } from "@/lib/i18n/catalog";
import ArtistCard from "@/components/ArtistCard";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const locale = await getLocale();
  const copy = getCopy(locale);
  const { q = "" } = await searchParams;
  const artists = localizeArtists(await searchArtists(q), locale);

  return (
    <div className="space-y-8">
      <h1 className="font-orbitron text-xl font-bold text-[#1c1e24]">
        {copy.searchResultsFor(q)}
      </h1>

      {artists.length === 0 && (
        <div className="space-y-3">
          <p className="text-[#9aa0aa]">{copy.noResults}</p>
          <p className="text-sm text-[#5e636d]">{copy.noResultsHint}</p>
          <Link
            href="/#idols"
            className="inline-block rounded-full bg-[#b4302b] px-4 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(180,48,43,0.35)] transition hover:brightness-110"
          >
            {copy.searchBrowseDirectory}
          </Link>
        </div>
      )}

      {artists.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-[#5e636d]">{copy.artistsSection}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {artists.map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
