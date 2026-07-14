import { NextRequest, NextResponse } from "next/server";
import type { Artist, Weights } from "@/lib/types";
import { displayTrait } from "@/lib/cardMeta";
import type { Locale } from "@/lib/i18n/config";

// Dominant layer label per locale.
const LAYER_TEXT: Record<keyof Weights, { zh: string; en: string }> = {
  aesthetic:   { zh: "美學風格", en: "aesthetic style" },
  personality: { zh: "個性特質", en: "personality traits" },
  performance: { zh: "表演風格", en: "performance style" },
  content:     { zh: "內容品味", en: "content taste" },
};

function dominantLayer(weights: Weights): keyof Weights {
  return (Object.entries(weights) as [keyof Weights, number][])
    .sort((a, b) => b[1] - a[1])[0][0];
}

function buildPrompt(source: Artist, candidate: Artist, weights: Weights, locale: Locale): string {
  const layer = dominantLayer(weights);
  const sp = source.profile;
  const cp = candidate.profile;

  if (locale === "en") {
    const srcProfile = sp
      ? `Aesthetic: ${sp.aesthetic.vibe} (${sp.aesthetic.style_tags.slice(0,3).join(", ")}); Personality: ${sp.personality.energy_type}, ${sp.personality.fan_interaction}; Performance: ${sp.performance.dance_style} dance style, ${sp.performance.stage_persona}; Content: ${sp.content.topics.slice(0,3).join(", ")}`
      : `Genres: ${source.genres.join(", ")}`;
    const canProfile = cp
      ? `Aesthetic: ${cp.aesthetic.vibe} (${cp.aesthetic.style_tags.slice(0,3).join(", ")}); Personality: ${cp.personality.energy_type}, ${cp.personality.fan_interaction}; Performance: ${cp.performance.dance_style} dance style, ${cp.performance.stage_persona}; Content: ${cp.content.topics.slice(0,3).join(", ")}`
      : `Genres: ${candidate.genres.join(", ")}`;

    return `You are a K-pop analyst. Write one sentence (12-18 words) explaining why fans of ${source.name} would also like ${candidate.name}.
Focus on: ${LAYER_TEXT[layer].en}. Reply with only that one sentence, no extra punctuation or explanation.

${source.name} profile: ${srcProfile}
${candidate.name} profile: ${canProfile}`;
  }

  const srcProfile = sp
    ? `美學：${sp.aesthetic.vibe}（${sp.aesthetic.style_tags.slice(0,3).join("、")}）；個性：${sp.personality.energy_type}，${sp.personality.fan_interaction}；表演：${sp.performance.dance_style}舞風，${sp.performance.stage_persona}；內容：${sp.content.topics.slice(0,3).join("、")}`
    : `曲風：${source.genres.join("、")}`;
  const canProfile = cp
    ? `美學：${cp.aesthetic.vibe}（${cp.aesthetic.style_tags.slice(0,3).join("、")}）；個性：${cp.personality.energy_type}，${cp.personality.fan_interaction}；表演：${cp.performance.dance_style}舞風，${cp.performance.stage_persona}；內容：${cp.content.topics.slice(0,3).join("、")}`
    : `曲風：${candidate.genres.join("、")}`;

  return `你是K-pop分析師。請用繁體中文寫一句話（10至15字），說明喜歡${source.name}（${source.name_zh ?? source.name}）的粉絲為什麼也會喜歡${candidate.name}（${candidate.name_zh ?? candidate.name}）。
重點放在：${LAYER_TEXT[layer].zh}。只回覆那一句話，不加多餘標點或解釋。

${source.name} 資料：${srcProfile}
${candidate.name} 資料：${canProfile}`;
}

function localFallback(source: Artist, candidate: Artist, topTraits: string[], locale: Locale): string {
  if (locale === "en") {
    if (topTraits.length > 0) {
      return `Similar traits: ${topTraits.slice(0, 2).map((t) => displayTrait("en", t) ?? t).join(", ")}`;
    }
    const shared = source.genres.filter((g) => candidate.genres.includes(g));
    return shared.length ? `Same genre: ${shared[0]}` : "Fellow fan favorite";
  }
  if (topTraits.length > 0) {
    return `相似特質：${topTraits.slice(0, 2).map((t) => displayTrait("zh", t) ?? t).join("、")}`;
  }
  const shared = source.genres.filter((g) => candidate.genres.includes(g));
  return shared.length ? `相同曲風：${shared[0]}` : "同為人氣偶像";
}

export async function POST(req: NextRequest) {
  const { source, candidate, weights, topTraits, locale: rawLocale } = await req.json() as {
    source: Artist;
    candidate: Artist;
    weights: Weights;
    topTraits: string[];
    locale?: Locale;
  };
  const locale: Locale = rawLocale === "en" ? "en" : "zh";

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ reason: localFallback(source, candidate, topTraits, locale) });
  }

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic();
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 60,
      messages: [{ role: "user", content: buildPrompt(source, candidate, weights, locale) }],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();
    return NextResponse.json({ reason: text || localFallback(source, candidate, topTraits, locale) });
  } catch {
    return NextResponse.json({ reason: localFallback(source, candidate, topTraits, locale) });
  }
}
