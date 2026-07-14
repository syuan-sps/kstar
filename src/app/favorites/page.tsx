import { getAllArtistsLite } from "@/lib/data";
import FavoritesList from "@/components/FavoritesList";

export default async function FavoritesPage() {
  const allArtists = await getAllArtistsLite();
  return <FavoritesList allArtists={allArtists} />;
}
