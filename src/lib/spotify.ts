// Spotify Web API client using the Client Credentials flow (server-side only).
// Used by the ingestion script for CATALOG data only — NOT for similarity,
// since Related-Artists / Audio-Features are unavailable to new apps.

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API = "https://api.spotify.com/v1";

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: { total: number };
  images: { url: string }[];
}

interface SpotifyTrack {
  id: string;
  name: string;
  album: { name: string; release_date: string; images: { url: string }[] };
  popularity: number;
  preview_url: string | null;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) {
    return cachedToken.value;
  }
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not set");
  }
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Spotify token error: ${res.status}`);
  const json = await res.json();
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return cachedToken.value;
}

async function api<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 429) {
    const retry = Number(res.headers.get("retry-after") ?? "1");
    await new Promise((r) => setTimeout(r, (retry + 1) * 1000));
    return api<T>(path);
  }
  if (!res.ok) throw new Error(`Spotify API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export async function searchArtist(name: string): Promise<SpotifyArtist | null> {
  const q = encodeURIComponent(name);
  const json = await api<{ artists: { items: SpotifyArtist[] } }>(
    `/search?q=${q}&type=artist&limit=1`,
  );
  return json.artists.items[0] ?? null;
}

export async function getArtistTopTracks(
  artistId: string,
  market = "TW",
): Promise<SpotifyTrack[]> {
  const json = await api<{ tracks: SpotifyTrack[] }>(
    `/artists/${artistId}/top-tracks?market=${market}`,
  );
  return json.tracks;
}

export type { SpotifyArtist, SpotifyTrack };
