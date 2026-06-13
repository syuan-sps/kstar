import { getAllArtists } from "@/lib/data";
import { copy } from "@/lib/copy";
import MyFourCuts from "@/components/MyFourCuts";
import IdolDirectory from "@/components/IdolDirectory";

export default async function Home() {
  const artists = await getAllArtists();

  return (
    <>
      {/* ── Desktop: 인생네컷 centerpiece — THE selling point ──── */}
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

        {/* Scroll hint toward the directory */}
        <a
          href="#idols"
          className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 text-xs text-pink-300/60 transition hover:text-pink-200"
        >
          ↓ 偶像圖鑑
        </a>
      </div>

      {/* ── Mobile: hero + tagline ────────────────────────────── */}
      <div className="space-y-8 md:hidden">
        <MyFourCuts className="pt-2" />

        <section className="rounded-2xl border border-[#ff00cc]/25 bg-[#ff00cc]/5 p-6 text-center">
          <h1 className="font-orbitron text-2xl font-black tracking-tight text-[#ff00cc]">
            {copy.taglineEn}
          </h1>
          <p className="mt-2 text-sm text-white/60">{copy.tagline}</p>
        </section>
      </div>

      {/* ── 偶像圖鑑 — browse everyone, slot anyone into your four cuts ── */}
      <div className="mt-8 md:mt-0">
        <IdolDirectory artists={artists} />
      </div>
    </>
  );
}
