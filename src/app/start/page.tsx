import { Suspense } from "react";
import { getAllArtistsLite } from "@/lib/data";
import StartFlow from "@/components/wizard/StartFlow";

export const metadata = { title: "KStar · 領取你的追星證" };

export default async function StartPage() {
  const artists = await getAllArtistsLite();
  return (
    <Suspense fallback={null}>
      <StartFlow allArtists={artists} />
    </Suspense>
  );
}
