import { getAllArtistsLite } from "@/lib/data";
import { getCopy } from "@/lib/copy";
import { getLocale } from "@/lib/i18n/server";
import { localizeLites } from "@/lib/i18n/catalog";
import MyFourCuts from "@/components/MyFourCuts";
import IdolDirectory from "@/components/IdolDirectory";
import LandingGate from "@/components/LandingGate";
import ClaimChip from "@/components/ClaimChip";

export default async function Home() {
  const locale = await getLocale();
  const copy = getCopy(locale);
  const artists = localizeLites(await getAllArtistsLite(), locale);

  return (
    <LandingGate>
      {/* ── Desktop: 인생네컷 centerpiece — THE selling point ──── */}
      <div className="hidden md:flex md:flex-col md:items-center md:justify-center md:gap-2 relative" style={{ height: "calc(100vh - 3.5rem - 2.5rem)" }}>
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

        {/* Hero text — a normal flow sibling above the four-cut group, so it can
            never overlap the "你的人生四格" heading regardless of screen size:
            block stacking guarantees the gap, unlike two independently
            percentage-positioned absolute elements. */}
        <div className="relative z-0 shrink-0 pointer-events-none text-center" aria-hidden="true">
          <div className="chrome-text font-orbitron text-3xl md:text-4xl lg:text-5xl font-black tracking-widest opacity-30 select-none uppercase whitespace-nowrap">
            {copy.taglineEn}
          </div>
        </div>

        {/* Personalized 인생네컷 */}
        <div className="relative z-20 shrink-0 flex flex-col items-center">
          <MyFourCuts allArtists={artists} frameClassName="w-[clamp(320px,38vh,480px)]" />
          <div className="mt-3 flex justify-center"><ClaimChip /></div>
        </div>

        {/* Scroll hint toward the directory */}
        <a
          href="#idols"
          className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 text-xs text-[#56789f]/60 transition hover:text-[#56789f]"
        >
          ↓ {copy.navDirectory}
        </a>
      </div>

      {/* ── Mobile: hero + tagline ────────────────────────────── */}
      <div className="space-y-8 md:hidden">
        <MyFourCuts allArtists={artists} className="pt-2" />
        <div className="flex justify-center"><ClaimChip /></div>
      </div>

      {/* ── 偶像圖鑑 — browse everyone, slot anyone into your four cuts ── */}
      <div className="mt-8 md:mt-0">
        <IdolDirectory artists={artists} />
      </div>
    </LandingGate>
  );
}
