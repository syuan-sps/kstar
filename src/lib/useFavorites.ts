"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "kstar:favorites";
type FavSet = Record<string, true>;

function load(): FavSet {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); }
  catch { return {}; }
}

export function useFavorites() {
  const [favs, setFavs] = useState<FavSet>({});

  useEffect(() => {
    setFavs(load());
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setFavs(load()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: FavSet) => {
    setFavs(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const isFavorite = useCallback(
    (id: string) => Boolean(favs[`artist:${id}`]),
    [favs],
  );

  const toggle = useCallback(
    (id: string) => {
      const k = `artist:${id}`;
      const next = { ...favs };
      if (next[k]) delete next[k]; else next[k] = true;
      persist(next);
    },
    [favs, persist],
  );

  const list = Object.keys(favs).map((k) => k.replace("artist:", ""));

  return { isFavorite, toggle, list };
}
