import { NextRequest, NextResponse } from "next/server";
import type { Artist, Weights } from "@/lib/types";
import { zhTrait } from "@/lib/cardMeta";

// Dominant layer label in zh-TW
const LAYER_ZH: Record<keyof Weights, string> = {
  aesthetic:   "美學風格",
  personality: "個性特質",
  performance: "表演風格",
  content:     "內容品味",
};

function dominantLayer(weights: Weights): keyof Weights {
  return (Object.entries(weights) as [keyof Weights, number][])
    .sort((a, b) => b[1] - a[1])[0][0];
}

function buildPrompt(source: Artist, candidate: Artist, weights: Weights): string {
  const layer = dominantLayer(weights);
  const sp = source.profile;
  const cp = candidate.profile;
  const srcProfile = sp
    ? `美學：${sp.aesthetic.vibe}（${sp.aesthetic.style_tags.slice(0,3).join("、")}）；個性：${sp.personality.energy_type}，${sp.personality.fan_interaction}；表演：${sp.performance.dance_style}舞風，${sp.performance.stage_persona}；內容：${sp.content.topics.slice(0,3).join("、")}`
    : `曲風：${source.genres.join("、")}`;
  const canProfile = cp
    ? `美學：${cp.aesthetic.vibe}（${cp.aesthetic.style_tags.slice(0,3).join("、")}）；個性：${cp.personality.energy_type}，${cp.personality.fan_interaction}；表演：${cp.performance.dance_style}舞風，${cp.performance.stage_persona}；內容：${cp.content.topics.slice(0,3).join("、")}`
    : `曲風：${candidate.genres.join("、")}`;

  return `你是K-pop分析師。請用繁體中文寫一句話（10至15字），說明喜歡${source.name}（${source.name_zh ?? source.name}）的粉絲為什麼也會喜歡${candidate.name}（${candidate.name_zh ?? candidate.name}）。
重點放在：${LAYER_ZH[layer]}。只回覆那一句話，不加多餘標點或解釋。

${source.name} 資料：${srcProfile}
${candidate.name} 資料：${canProfile}`;
}

function localFallback(source: Artist, candidate: Artist, topTraits: string[]): string {
  if (topTraits.length > 0) {
    return `相似特質：${topTraits.slice(0, 2).map(zhTrait).join("、")}`;
  }
  const shared = source.genres.filter((g) => candidate.genres.includes(g));
  return shared.length ? `相同曲風：${shared[0]}` : "同為人氣偶像";
}

export async function POST(req: NextRequest) {
  const { source, candidate, weights, topTraits } = await req.json() as {
    source: Artist;
    candidate: Artist;
    weights: Weights;
    topTraits: string[];
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ reason: localFallback(source, candidate, topTraits) });
  }

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic();
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 60,
      messages: [{ role: "user", content: buildPrompt(source, candidate, weights) }],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();
    return NextResponse.json({ reason: text || localFallback(source, candidate, topTraits) });
  } catch {
    return NextResponse.json({ reason: localFallback(source, candidate, topTraits) });
  }
}
