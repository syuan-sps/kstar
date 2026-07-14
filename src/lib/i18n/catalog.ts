// Server-only catalog localization. Merges the AI-translated parallel files
// (src/data/catalog.en.json prose + token-glossary.en.json tags) onto a raw
// Artist/ArtistLite for EN display — the catalog itself is NEVER mutated and
// the similarity engine must always run on RAW artists (see CLAUDE.md).
//
// Until scripts/translate-catalog.mjs has run for a given idol/tag, the
// corresponding field is omitted rather than leaking Chinese into EN pages —
// consistent with displayTrait()'s hide-if-untranslated rule in cardMeta.ts.
import type { Artist, IdolProfile } from "../types";
import type { ArtistLite } from "../lite";
import type { Locale } from "./config";
import catalogEnRaw from "@/data/catalog.en.json";
import glossaryRaw from "@/data/token-glossary.en.json";

interface EnLayerProse {
  vibe?: string;
  analysis?: string;
  official_analysis?: string;
  personal_analysis?: string;
}
interface EnArtistProse {
  aesthetic?: EnLayerProse;
  personality?: EnLayerProse;
  performance?: EnLayerProse;
  content?: EnLayerProse;
  overview?: { vibe?: string; summary?: string };
}

const CATALOG_EN = catalogEnRaw as Record<string, EnArtistProse>;
const GLOSSARY = glossaryRaw as Record<string, string>;

function translateTags(tags: string[] | undefined): string[] | undefined {
  if (!tags) return tags;
  const out = tags.map((t) => GLOSSARY[t]).filter((t): t is string => !!t);
  return out.length ? out : undefined;
}

function localizeProfile(profile: IdolProfile | undefined, en: EnArtistProse | undefined): IdolProfile | undefined {
  if (!profile) return profile;

  // Untranslated prose is hidden ("" / undefined), never a raw-zh fallback —
  // decision: EN mode shows zero Chinese, even before the real translation
  // batch has run for a given idol.
  const aes = profile.aesthetic;
  const aesthetic: IdolProfile["aesthetic"] = {
    ...aes,
    style_tags: translateTags(aes.style_tags) ?? [],
    // color_palette stays RAW (zh) — AestheticSection resolves both the swatch
    // hex (needs the zh key) and the display label (via displayTrait) from it.
    color_palette: aes.color_palette,
    vibe: en?.aesthetic?.vibe ?? "",
    analysis: en?.aesthetic?.analysis,
    official: aes.official && {
      style_tags: translateTags(aes.official.style_tags) ?? [],
      analysis: en?.aesthetic?.official_analysis ?? "",
    },
    personal: aes.personal && {
      style_tags: translateTags(aes.personal.style_tags) ?? [],
      analysis: en?.aesthetic?.personal_analysis ?? "",
    },
  };

  const personality: IdolProfile["personality"] = {
    ...profile.personality,
    vibe: en?.personality?.vibe,
    trait_tags: translateTags(profile.personality.trait_tags),
    analysis: en?.personality?.analysis,
  };

  const performance: IdolProfile["performance"] = {
    ...profile.performance,
    vibe: en?.performance?.vibe,
    trait_tags: translateTags(profile.performance.trait_tags),
    analysis: en?.performance?.analysis,
  };

  const content: IdolProfile["content"] = {
    ...profile.content,
    vibe: en?.content?.vibe,
    trait_tags: translateTags(profile.content.trait_tags),
    analysis: en?.content?.analysis,
  };

  const overview = profile.overview && {
    ...profile.overview,
    vibe: en?.overview?.vibe ?? "",
    trait_tags: translateTags(profile.overview.trait_tags) ?? [],
    summary: en?.overview?.summary ?? "",
  };

  return { aesthetic, personality, performance, content, overview };
}

/** Localize a full Artist for display. zh passes through untouched — only
 *  call this at the UI hand-off boundary, never before computing similarity. */
export function localizeArtist(artist: Artist, locale: Locale): Artist {
  if (locale !== "en") return artist;
  const en = CATALOG_EN[artist.id];
  return {
    ...artist,
    name_zh: null,
    profile: localizeProfile(artist.profile, en),
  };
}

export function localizeArtists(artists: Artist[], locale: Locale): Artist[] {
  return locale === "en" ? artists.map((a) => localizeArtist(a, locale)) : artists;
}

/** Localize the lightweight card shape — only name_zh needs hiding. */
export function localizeLite(lite: ArtistLite, locale: Locale): ArtistLite {
  return locale === "en" ? { ...lite, name_zh: null } : lite;
}

export function localizeLites(lites: ArtistLite[], locale: Locale): ArtistLite[] {
  return locale === "en" ? lites.map((l) => localizeLite(l, locale)) : lites;
}
