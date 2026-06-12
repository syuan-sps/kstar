import { searchArtists } from "@/lib/data";
import { copy } from "@/lib/copy";
import ArtistCard from "@/components/ArtistCard";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const artists = await searchArtists(q);

  return (
    <div className="space-y-8">
      <h1 className="font-orbitron text-xl font-bold text-white">
        {copy.searchResultsFor(q)}
      </h1>

      {artists.length === 0 && (
        <p className="text-white/50">{copy.noResults}</p>
      )}

      {artists.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-[#ff00cc]/70">{copy.artistsSection}</h2>
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
