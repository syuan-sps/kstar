import { getAllArtistsLite } from "@/lib/data";
import { isPortalConfigured } from "@/lib/supabase";
import SubmitFlow, { type SubmitArtist } from "./SubmitFlow";

export const metadata = { title: "投稿偶像照片 · KSTAR" };

export default async function SubmitPage({ searchParams }: { searchParams: Promise<{ idol?: string }> }) {
  if (!isPortalConfigured()) {
    return (
      <main className="mx-auto max-w-md px-6 py-20 text-center text-[#5e636d]">
        <p className="font-orbitron text-sm font-bold tracking-widest text-[#7c8088]">✦ 投稿功能尚未啟用 ✦</p>
        <p className="mt-3 text-sm">此站台目前未設定投稿後端。</p>
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
