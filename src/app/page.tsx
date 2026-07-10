import { getAllArtistsLite } from "@/lib/data";
import MyFourCuts from "@/components/MyFourCuts";
import IdolDirectory from "@/components/IdolDirectory";
import BrandMark from "@/components/BrandMark";
import PosterFrame from "@/components/PosterFrame";
import HeroActions from "@/components/HeroActions";

export default async function Home() {
  const artists = await getAllArtistsLite();

  return (
    <>
      <section
        className="relative hidden md:flex flex-col items-center justify-center gap-5"
        style={{ height: "calc(100vh - 3.5rem - 2.5rem)", minHeight: 620 }}
      >
        <PosterFrame className="fourcuts-pop-in" serial="10072026" index="01">
          <div className="hero-stack">
            <BrandMark mark="kstar" className="bm-hero" />
            <div className="hero-chip-row">
              <BrandMark mark="soulcuts" />
              <span className="sticker-chip sticker-chip--zh">靈魂四格</span>
            </div>
            <div className="hero-strip-wrap">
              <MyFourCuts allArtists={artists} frameClassName="w-full" stripOnly />
            </div>
          </div>
        </PosterFrame>

        <HeroActions allArtists={artists} />

        <a href="#idols" className="hero-scroll-candy z-20">
          ↓ 偶像圖鑑
        </a>
      </section>

      <div className="space-y-5 md:hidden">
        <PosterFrame serial="10072026" index="01" className="w-full">
          <div className="hero-stack">
            <BrandMark mark="kstar" className="bm-hero" />
            <div className="hero-chip-row">
              <BrandMark mark="soulcuts" />
              <span className="sticker-chip sticker-chip--zh">靈魂四格</span>
            </div>
          </div>
        </PosterFrame>
        <MyFourCuts allArtists={artists} className="pt-1" />
      </div>

      <div className="mt-8 md:mt-0">
        <IdolDirectory artists={artists} />
      </div>
    </>
  );
}
