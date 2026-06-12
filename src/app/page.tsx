import { getPopularArtists } from "@/lib/data";
import { copy } from "@/lib/copy";
import ArtistCard from "@/components/ArtistCard";
import MyFourCuts from "@/components/MyFourCuts";

export default async function Home() {
  const artists = await getPopularArtists(12);

  return (
    <>
      {/* ── Desktop: 인생네컷 centerpiece ─────────────────────── */}
      <div className="hidden md:block relative" style={{ height: "calc(100vh - 3.5rem - 2.5rem)" }}>
        {/* Hero text */}
        <div className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-0">
          <div className="font-orbitron text-5xl font-black tracking-widest text-[#ff00cc]/20 select-none uppercase">
            {copy.taglineEn}
          </div>
        </div>

        {/* Personalized 인생네컷 — pinned to the center of the desktop */}
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <MyFourCuts frameClassName="w-[clamp(320px,38vh,480px)]" />
        </div>
      </div>

      {/* ── Mobile: hero + card grid ──────────────────────────── */}
      <div className="space-y-8 md:hidden">
        {/* Personalized 인생네컷 */}
        <MyFourCuts className="pt-2" />

        <section className="rounded-2xl border border-[#ff00cc]/25 bg-[#ff00cc]/5 p-6 text-center">
          <h1 className="font-orbitron text-2xl font-black tracking-tight text-[#ff00cc]">
            {copy.taglineEn}
          </h1>
          <p className="mt-2 text-sm text-white/60">{copy.tagline}</p>
        </section>

        <section>
          <h2 className="mb-4 font-orbitron text-sm font-bold tracking-widest text-[#ff00cc]/70 uppercase">
            {copy.featuredArtists}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {artists.map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
