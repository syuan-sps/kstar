// 美學分析 — visible style breakdown on the artist page.
// Shows 繁中 trait chips, colour-palette swatches, and a style read (when present).

import type { Artist } from "@/lib/types";

// 繁中 colour name → hex for swatches. Unknown names fall back to a silver tint.
const COLOR_HEX: Record<string, string> = {
  "黑": "#1a1a1a", "白": "#ffffff", "金": "#d4af37", "銀": "#c8ccd4",
  "酒紅": "#7b1e2b", "深紅": "#7b1e2b", "金屬灰": "#9aa0a8", "金屬銀": "#c0c4cc",
  "金屬色": "#bfc3c9", "金屬金": "#d4af37", "粉紅": "#ffc2d6", "粉": "#ffc2d6",
  "嫩粉": "#ffd0e0", "薄紫": "#cbb6e8", "嫩紫": "#d9c2f0", "薰衣草": "#cdb4e6",
  "天藍": "#a9d8ff", "海軍藍": "#1f3a5f", "灰藍": "#8aa0b6", "霧藍": "#9fb3c8",
  "冰藍": "#cfe9ff", "丹寧藍": "#3b5b86", "棕": "#7a5a3a", "暖棕": "#9c6b3f",
  "米": "#ece0c8", "米白": "#f3efe6", "奶油色": "#f5ecd6", "大地色": "#b08d57",
  "嫩黃": "#fff1a8", "電光黃": "#f5f02a", "珊瑚": "#ff8a73", "蜜桃": "#ffd0b0",
  "橘": "#ff7a30", "紫": "#7d4bd1", "緋紅": "#c11e3a", "紅": "#e23b4e",
  "畫布白": "#f6f2e9", "柔粉": "#ffd6e0", "濕亮銀": "#d7dbe0", "覆盆莓": "#b03060",
  "森林綠": "#2f5d3a", "橄欖綠": "#7d8b4e", "玫瑰": "#e26a8a", "玫瑰粉": "#e88aa6",
  "暖黑": "#1a1414", "淺金": "#e9d8a6", "霓虹": "#39ff14", "裸粉": "#f3d6cf",
  "透膚黑": "#2a2a2a", "透白": "#fbfbf7",
};

const FALLBACK = "#b9bdc4";

export default function AestheticSection({ artist }: { artist: Artist }) {
  const aes = artist.profile?.aesthetic;
  if (!aes) return null;

  return (
    <section className="rounded-3xl border-2 border-[#c8ccd2]/30 bg-gradient-to-b from-white/95 to-[#eceef1]/90 p-5 text-[#1c1e24] shadow-[4px_4px_0_rgba(124,128,136,0.3)]">
      <div className="flex items-center gap-2">
        <span className="text-base">✦</span>
        <h2 className="font-orbitron text-sm font-black uppercase tracking-[0.15em] text-[#1c1e24]">
          美學分析
        </h2>
      </div>

      {/* vibe headline */}
      <p className="mt-2 text-lg font-black text-[#1c1e24]">{aes.vibe}</p>

      {/* trait chips */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {aes.style_tags.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="rounded-full bg-[#7c8088]/12 px-3 py-1 text-xs font-semibold text-[#1c1e24]"
          >
            {t}
          </span>
        ))}
      </div>

      {/* colour palette swatches */}
      <div className="mt-4">
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5e636d]">
          色彩
        </div>
        <div className="flex flex-wrap gap-3">
          {aes.color_palette.map((c, i) => (
            <div key={`${c}-${i}`} className="flex items-center gap-1.5">
              <span
                className="h-4 w-4 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: COLOR_HEX[c] ?? FALLBACK }}
              />
              <span className="text-xs text-[#5e636d]">{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 官方/私服 dual-track blocks (researched idols) — otherwise legacy single read */}
      {aes.official || aes.personal ? (
        <>
          {aes.official && <StyleTrack label="官方造型" icon="◆" data={aes.official} />}
          {aes.personal && <StyleTrack label="私服風格" icon="◇" data={aes.personal} />}
        </>
      ) : (
        aes.analysis && (
          <p className="mt-4 border-t border-[#c8ccd2]/15 pt-3 text-sm leading-relaxed text-[#1c1e24]">
            {aes.analysis}
          </p>
        )
      )}
    </section>
  );
}

function StyleTrack({
  label,
  icon,
  data,
}: {
  label: string;
  icon: string;
  data: { style_tags: string[]; analysis: string };
}) {
  return (
    <div className="mt-4 border-t border-[#c8ccd2]/15 pt-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5e636d]">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {data.style_tags.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="rounded-full bg-[#7c8088]/12 px-3 py-1 text-xs font-semibold text-[#1c1e24]"
          >
            {t}
          </span>
        ))}
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-[#1c1e24]">{data.analysis}</p>
    </div>
  );
}
