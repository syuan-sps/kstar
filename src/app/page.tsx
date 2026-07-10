import { getAllArtistsLite } from "@/lib/data";
import { copy } from "@/lib/copy";
import MyFourCuts from "@/components/MyFourCuts";
import IdolDirectory from "@/components/IdolDirectory";

export default async function Home() {
  const artists = await getAllArtistsLite();

  return (
    <>
      {/* ── Desktop: liquid-chrome brand plane + 인생네컷 centerpiece ──── */}
      <div
        className="hero-plane hidden md:block relative"
        style={{ height: "calc(100vh - 3.5rem - 2.5rem)" }}
      >
        {/* Soft holographic sky wash behind the strip */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 holo-sky opacity-70" />

        {/* Brand lockup — hero-level signal (refs: LOVER SOUL / SOME THINGS COSMIC) */}
        <div className="hero-brand">
          <div className="chrome-text chrome-text-live hero-mark">{copy.appName}</div>
          <div className="hero-sub">{copy.taglineEn}</div>
          <div className="hero-meta">
            <span className="tech-hairline flex-1 max-w-[72px]" />
            <span className="tech-serial">✦ SOULCUTS · 2026</span>
            <span className="tech-hairline flex-1 max-w-[72px]" />
          </div>
        </div>

        {/* Accent sparkles — denser near brand, not competing with the strip */}
        <span aria-hidden="true" className="hero-spark" style={{ left: "14%", top: "22%" }}>✦</span>
        <span aria-hidden="true" className="hero-spark" style={{ right: "16%", top: "18%", fontSize: 16, animationDelay: "1.2s" }}>✧</span>
        <span aria-hidden="true" className="hero-spark" style={{ left: "18%", bottom: "22%", fontSize: 14, animationDelay: "0.6s", color: "transparent", background: "linear-gradient(135deg,#b4302b,#c4b5d8)", WebkitBackgroundClip: "text" }}>✦</span>
        <span aria-hidden="true" className="hero-spark" style={{ right: "20%", bottom: "26%", fontSize: 18, animationDelay: "2s", background: "linear-gradient(135deg,#ffffff,#56789f,#a7c0dc)", WebkitBackgroundClip: "text" }}>✧</span>

        {/* Personalized 인생네컷 — pinned to the center */}
        <div className="absolute left-1/2 top-[54%] z-20 -translate-x-1/2 -translate-y-1/2 fourcuts-pop-in">
          <MyFourCuts allArtists={artists} frameClassName="w-[clamp(300px,36vh,460px)]" />
        </div>

        <a href="#idols" className="hero-scroll">
          ↓ 偶像圖鑑
        </a>
      </div>

      {/* ── Mobile: hero + tagline ────────────────────────────── */}
      <div className="space-y-6 md:hidden">
        <div className="relative overflow-hidden rounded-2xl border border-[#c8ccd2]/40 px-5 py-7 text-center holo-sky">
          <div className="chrome-text chrome-text-live font-orbitron text-[1.85rem] font-black tracking-[0.08em] uppercase">
            {copy.appName}
          </div>
          <p className="mt-2 font-orbitron text-[10px] font-bold tracking-[0.28em] text-[#5e636d]">
            {copy.taglineEn}
          </p>
          <div className="mx-auto mt-3 flex max-w-[220px] items-center gap-2">
            <span className="tech-hairline flex-1" />
            <span className="tech-serial">✦ SOULCUTS</span>
            <span className="tech-hairline flex-1" />
          </div>
          <p className="mt-3 text-xs text-[#5e636d]">{copy.tagline}</p>
        </div>
        <MyFourCuts allArtists={artists} className="pt-1" />
      </div>

      {/* ── 偶像圖鑑 — browse everyone, slot anyone into your four cuts ── */}
      <div className="mt-8 md:mt-0">
        <IdolDirectory artists={artists} />
      </div>
    </>
  );
}
