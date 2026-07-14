import { getAllArtistsLite } from "@/lib/data";
import { getLocale } from "@/lib/i18n/server";
import { localizeLites } from "@/lib/i18n/catalog";
import FavoritesList from "@/components/FavoritesList";

export default async function FavoritesPage() {
  const locale = await getLocale();
  const allArtists = localizeLites(await getAllArtistsLite(), locale);
  return <FavoritesList allArtists={allArtists} />;
}
