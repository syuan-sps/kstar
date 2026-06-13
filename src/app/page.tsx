import { getAllArtistsLite } from "@/lib/data";
import { copy } from "@/lib/copy";
import MyFourCuts from "@/components/MyFourCuts";
import IdolDirectory from "@/components/IdolDirectory";

export default async function Home() {
  const artists = await getAllArtistsLite();

  return (
    <>
      {/* ── Desktop: 인생네컷 centerpiece — THE selling point ──── */}
      <div className="hidden md:block relative" style={{ height: "calc(100vh - 3.5rem - 2.5rem)" }}>
        {/* Floating chrome objects — corners only, behind the four-cut (z-0) */}
        <svg aria-hidden="true" width="60" height="60" viewBox="0 0 24 24" className="pointer-events-none absolute bottom-8 left-8 z-0" style={{ opacity: 0.08 }}>
          <defs>
            <linearGradient id="chromeHeart" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#666666" /><stop offset="45%" stopColor="#ffffff" /><stop offset="100%" stopColor="#999999" />
            </linearGradient>
          </defs>
          <path d="M12,21 C12,21 3,14 3,8.5 C3,5.5 5.2,4 7.2,4 C9,4 10.5,5 12,7 C13.5,5 15,4 16.8,4 C18.8,4 21,5.5 21,8.5 C21,14 12,21 12,21 Z" fill="url(#chromeHeart)" />
        </svg>
        <svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" className="pointer-events-none absolute right-10 top-10 z-0" style={{ opacity: 0.12 }}>
          <defs>
            <linearGradient id="chromeSpark2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#666666" /><stop offset="45%" stopColor="#ffffff" /><stop offset="100%" stopColor="#999999" />
            </linearGradient>
          </defs>
          <path d="M12,0 C13.4,9.2 14.8,10.6 24,12 C14.8,13.4 13.4,14.8 12,24 C10.6,14.8 9.2,13.4 0,12 C9.2,10.6 10.6,9.2 12,0 Z" fill="url(#chromeSpark2)" />
        </svg>
        <svg aria-hidden="true" width="80" height="48" viewBox="0 0 40 24" className="pointer-events-none absolute bottom-10 right-12 z-0" style={{ opacity: 0.06 }}>
          <defs>
            <linearGradient id="chromeChain" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#666666" /><stop offset="45%" stopColor="#ffffff" /><stop offset="100%" stopColor="#999999" />
            </linearGradient>
          </defs>
          <g fill="none" stroke="url(#chromeChain)" strokeWidth="2.5">
            <ellipse cx="14" cy="12" rx="9" ry="6" /><ellipse cx="26" cy="12" rx="9" ry="6" />
          </g>
        </svg>

        {/* Hero text */}
        <div className="absolute left-1/2 top-[20%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-0">
          <div className="chrome-text font-orbitron text-5xl font-black tracking-widest opacity-30 select-none uppercase">
            {copy.taglineEn}
          </div>
        </div>

        {/* Personalized 인생네컷 — pinned to the center of the desktop */}
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <MyFourCuts allArtists={artists} frameClassName="w-[clamp(320px,38vh,480px)]" />
        </div>

        {/* Scroll hint toward the directory */}
        <a
          href="#idols"
          className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 text-xs text-[#56789f]/60 transition hover:text-[#56789f]"
        >
          ↓ 偶像圖鑑
        </a>
      </div>

      {/* ── Mobile: hero + tagline ────────────────────────────── */}
      <div className="space-y-8 md:hidden">
        <MyFourCuts allArtists={artists} className="pt-2" />

        <section className="rounded-2xl border border-[#c8ccd2]/25 bg-[#7c8088]/8 p-6 text-center">
          <h1 className="chrome-text font-orbitron text-2xl font-black tracking-tight">
            {copy.taglineEn}
          </h1>
          <p className="mt-2 text-sm text-[#5e636d]">{copy.tagline}</p>
        </section>
      </div>

      {/* ── 偶像圖鑑 — browse everyone, slot anyone into your four cuts ── */}
      <div className="mt-8 md:mt-0">
        <IdolDirectory artists={artists} />
      </div>
    </>
  );
}
