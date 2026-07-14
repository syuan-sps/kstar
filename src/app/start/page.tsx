import { Suspense } from "react";
import type { Metadata } from "next";
import { getAllArtistsLite } from "@/lib/data";
import { getCopy } from "@/lib/copy";
import { getLocale } from "@/lib/i18n/server";
import { localizeLites } from "@/lib/i18n/catalog";
import StartFlow from "@/components/wizard/StartFlow";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const c = getCopy(locale);
  return { title: `${c.appName} · ${c.startPageTitleSuffix}` };
}

export default async function StartPage() {
  const locale = await getLocale();
  const artists = localizeLites(await getAllArtistsLite(), locale);
  return (
    <Suspense fallback={null}>
      <StartFlow allArtists={artists} />
    </Suspense>
  );
}
