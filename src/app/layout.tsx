import type { Metadata } from "next";
import { Suspense } from "react";
import { Noto_Sans_TC, Orbitron } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { copy } from "@/lib/copy";
import { getAllArtistsLite } from "@/lib/data";
import SearchBar from "@/components/SearchBar";
import BgDecor from "@/components/BgDecor";
import ChromeSparkle from "@/components/ChromeSparkle";
import Taskbar from "@/components/Taskbar";
import IntroSplash from "@/components/IntroSplash";
import FanIdEntry, { HeaderFanIdButton } from "@/components/FanIdEntry";
import HomeLogoLink from "@/components/HomeLogoLink";
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

export const metadata: Metadata = {
  title: `${copy.appName} · K-pop 推薦`,
  description: copy.tagline,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const liteArtists = await getAllArtistsLite();
  return (
    <html lang="zh-Hant-TW" className={`${notoTC.variable} ${orbitron.variable} h-full antialiased`}>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
          attributes onto <body> before React hydrates — ignore that one-level
          attribute mismatch; real mismatches deeper in the tree still surface. */}
      <body className="relative min-h-full flex flex-col pb-10" suppressHydrationWarning>
        <IntroSplash />
        <FanIdEntry allArtists={liteArtists} />
        {/* Decorative background — fixed, behind everything */}
        <BgDecor />
        {/* Y2K Silvercore layer — silver ✦ floating above the pink world */}
        <ChromeSparkle density="low" zone="background" />

        <header className="relative z-20 sticky top-0 border-b border-[#c8ccd2]/20 bg-[#f4f5f7]/85 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2 md:flex-nowrap md:gap-4 md:px-4 md:py-3">
            <HomeLogoLink className="shrink-0 text-lg font-black tracking-tight">
              <span className="font-orbitron chrome-text">
                {copy.appName}
              </span>
            </HomeLogoLink>
            <div className="order-3 w-full min-w-0 md:order-none md:w-auto md:flex-1">
              <Suspense fallback={null}>
                <SearchBar />
              </Suspense>
            </div>
            <nav aria-label="主要導覽" className="order-2 ml-auto flex shrink-0 items-center gap-1 md:contents">
              <Link
                href="/#idols"
                aria-label="偶像圖鑑"
                title="偶像圖鑑"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#c8ccd2]/30 text-sm font-medium text-[#1c1e24] hover:bg-[#7c8088]/10 md:flex md:h-auto md:w-auto md:gap-1 md:px-3 md:py-1.5"
              >
                <span aria-hidden="true">✦</span><span className="hidden md:inline">偶像圖鑑</span>
              </Link>
              <HeaderFanIdButton />
              <Link
                href="/favorites"
                aria-label={copy.myFavorites}
                title={copy.myFavorites}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-medium text-[#5e636d] hover:bg-[#7c8088]/10 md:flex md:h-auto md:w-auto md:gap-1 md:px-3 md:py-1.5"
              >
                <span aria-hidden="true">♥</span><span className="hidden md:inline">{copy.myFavorites}</span>
              </Link>
            </nav>
          </div>
        </header>
        <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        <footer className="relative z-10 border-t border-[#c8ccd2]/15 px-4 py-6 text-center text-xs text-[#9aa0aa]">
          {copy.appName} · 以曲風與後設資料推薦 · 資料來源 Spotify
          {" · "}
          <a href="/submit" className="font-orbitron text-[10px] font-bold tracking-widest text-[#7c8088] hover:text-[#b4302b]">✦ 投稿偶像照片</a>
        </footer>
        <Taskbar />
        <Analytics />
      </body>
    </html>
  );
}
