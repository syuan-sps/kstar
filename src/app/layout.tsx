import type { Metadata } from "next";
import { Suspense } from "react";
import { Noto_Sans_TC, Orbitron } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getCopy } from "@/lib/copy";
import { getLocale } from "@/lib/i18n/server";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { getAllArtistsLite } from "@/lib/data";
import LangToggle from "@/components/LangToggle";
import LangSync from "@/components/LangSync";
import SearchBar from "@/components/SearchBar";
import BgDecor from "@/components/BgDecor";
import ChromeSparkle from "@/components/ChromeSparkle";
import Taskbar from "@/components/Taskbar";
import Onboarding from "@/components/Onboarding";
import IntroSplash from "@/components/IntroSplash";
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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const c = getCopy(locale);
  return {
    title: locale === "en" ? `${c.appName} · K-pop Discovery` : `${c.appName} · K-pop 推薦`,
    description: c.tagline,
    alternates: {
      canonical: "/",
      languages: { "zh-Hant": "/", en: "/?lang=en" },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const copy = getCopy(locale);
  const liteArtists = await getAllArtistsLite();
  return (
    <html lang={locale === "en" ? "en" : "zh-Hant-TW"} className={`${notoTC.variable} ${orbitron.variable} h-full antialiased`}>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
          attributes onto <body> before React hydrates — ignore that one-level
          attribute mismatch; real mismatches deeper in the tree still surface. */}
      <body className="relative min-h-full flex flex-col pb-10" suppressHydrationWarning>
        <LocaleProvider locale={locale}>
        <Suspense fallback={null}>
          <LangSync />
        </Suspense>
        {/* Photobooth splash for first-time visitors — mounts before Onboarding so its
            effect runs first and can hold the picker until the handoff. */}
        <IntroSplash />
        <Onboarding allArtists={liteArtists} />
        {/* Decorative background — fixed, behind everything */}
        <BgDecor />
        {/* Y2K Silvercore layer — silver ✦ floating above the pink world */}
        <ChromeSparkle density="low" zone="background" />

        <header className="relative z-20 sticky top-0 border-b border-[#c8ccd2]/20 bg-[#f4f5f7]/85 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
            <Link href="/" className="shrink-0 text-lg font-black tracking-tight">
              <span className="font-orbitron chrome-text">
                {copy.appName}
              </span>
            </Link>
            <div className="flex-1">
              <Suspense fallback={null}>
                <SearchBar />
              </Suspense>
            </div>
            <Link
              href="/#idols"
              className="shrink-0 rounded-full border border-[#c8ccd2]/30 px-3 py-1.5 text-sm font-medium text-[#1c1e24] hover:bg-[#7c8088]/10"
            >
              ✦ {copy.navDirectory}
            </Link>
            <Link
              href="/favorites"
              className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-[#5e636d] hover:bg-[#7c8088]/10"
            >
              ♥ {copy.myFavorites}
            </Link>
            <LangToggle />
          </div>
        </header>
        <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        <footer className="relative z-10 border-t border-[#c8ccd2]/15 px-4 py-6 text-center text-xs text-[#9aa0aa]">
          {copy.appName} · {copy.footerCredit}
          {" · "}
          <a href="/submit" className="font-orbitron text-[10px] font-bold tracking-widest text-[#7c8088] hover:text-[#b4302b]">{copy.footerSubmit}</a>
        </footer>
        <Taskbar />
        </LocaleProvider>
        <Analytics />
      </body>
    </html>
  );
}
