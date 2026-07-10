import type { Metadata } from "next";
import { Suspense } from "react";
import { Noto_Sans_TC, Orbitron, Rubik_Bubbles, Fredoka } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { copy } from "@/lib/copy";
import { getAllArtistsLite } from "@/lib/data";
import SearchBar from "@/components/SearchBar";
import BgDecor from "@/components/BgDecor";
import ChromeSparkle from "@/components/ChromeSparkle";
import AmbientMotion from "@/components/AmbientMotion";
import Taskbar from "@/components/Taskbar";
import Onboarding from "@/components/Onboarding";
import IntroSplash from "@/components/IntroSplash";
import BrandMark from "@/components/BrandMark";
import { Analytics } from "@vercel/analytics/next";

const notoTC = Noto_Sans_TC({
  variable: "--font-noto-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const rubikBubbles = Rubik_Bubbles({
  variable: "--font-bubble",
  subsets: ["latin"],
  weight: "400",
});

const fredoka = Fredoka({
  variable: "--font-soft",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: `${copy.appName} · K-pop 推薦`,
  description: copy.tagline,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const liteArtists = await getAllArtistsLite();
  return (
    <html lang="zh-Hant-TW" className={`${notoTC.variable} ${orbitron.variable} ${rubikBubbles.variable} ${fredoka.variable} h-full antialiased`}>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
          attributes onto <body> before React hydrates — ignore that one-level
          attribute mismatch; real mismatches deeper in the tree still surface. */}
      <body className="relative min-h-full flex flex-col pb-10" suppressHydrationWarning>
        {/* Sync flashChoice → html[data-ambient] for ambient motion gating */}
        <AmbientMotion />
        {/* Photobooth splash for first-time visitors — mounts before Onboarding so its
            effect runs first and can hold the picker until the handoff. */}
        <IntroSplash />
        <Onboarding allArtists={liteArtists} />
        {/* Decorative background — fixed, behind everything; animates only under flash ambient */}
        <BgDecor />
        {/* Y2K Silvercore sparkles — float only when data-ambient="flash" */}
        <ChromeSparkle density="high" zone="background" />

        <header className="relative z-20 sticky top-0 border-b border-[#c8ccd2]/25 bg-[#f7f8fb]/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
            <Link href="/" className="shrink-0" aria-label="KStar home">
              <BrandMark mark="kstar" className="bm-nav" />
            </Link>
            <div className="flex-1">
              <Suspense fallback={null}>
                <SearchBar />
              </Suspense>
            </div>
            <Link
              href="/#idols"
              className="bubble-pill shrink-0 px-3.5 py-1.5 text-sm font-semibold text-[#1c1e24]"
            >
              ✦ 偶像圖鑑
            </Link>
            <Link
              href="/favorites"
              className="bubble-pill soft shrink-0 px-3.5 py-1.5 text-sm font-semibold text-[#5e636d]"
            >
              ♥ {copy.myFavorites}
            </Link>
          </div>
        </header>
        <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        <footer className="relative z-10 border-t border-[#c8ccd2]/15 px-4 py-6 text-center text-xs text-[#9aa0aa]">
          {copy.appName} · 以曲風與後設資料推薦 · 資料來源 Spotify
          {" · "}
          <a href="/submit" className="font-soft text-[11px] font-bold tracking-wide text-[#7c8088] hover:text-[#b4302b]">✦ 投稿偶像照片</a>
        </footer>
        <Taskbar />
        <Analytics />
      </body>
    </html>
  );
}
