import type { Metadata } from "next";
import { getAllArtistsLite } from "@/lib/data";
import { isPortalConfigured } from "@/lib/supabase";
import { getCopy } from "@/lib/copy";
import { getLocale } from "@/lib/i18n/server";
import SubmitFlow, { type SubmitArtist } from "./SubmitFlow";

export async function generateMetadata(): Promise<Metadata> {
  const copy = getCopy(await getLocale());
  return { title: copy.submitPageTitle };
}

export default async function SubmitPage({ searchParams }: { searchParams: Promise<{ idol?: string }> }) {
  const locale = await getLocale();
  const copy = getCopy(locale);
  if (!isPortalConfigured()) {
    return (
      <main className="mx-auto max-w-md px-6 py-20 text-center text-[#5e636d]">
        <p className="font-orbitron text-sm font-bold tracking-widest text-[#7c8088]">{copy.submitNotConfiguredTitle}</p>
        <p className="mt-3 text-sm">{copy.submitNotConfiguredBody}</p>
      </main>
    );
  }
  const lite = await getAllArtistsLite();
  const artists: SubmitArtist[] = lite.map((a) => ({
    id: a.id, name: a.name, name_zh: a.name_zh ?? null, group: a.group ?? null,
    image_url: a.image_url ?? null, image_focus: a.image_focus ?? null,
    hasPhoto: Boolean(a.image_url),
  }));
  const { idol } = await searchParams;
  return (
    <SubmitFlow
      artists={artists}
      turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
      initialIdolId={typeof idol === "string" ? idol : null}
    />
  );
}
