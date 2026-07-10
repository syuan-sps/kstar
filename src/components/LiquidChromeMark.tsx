// Liquid candy-chrome wordmark — FLOW-ref energy via bubbly type + sky-reflect metal.
// Pure presentational; size via className / style.

type Mark = "kstar" | "soulcuts";

const LABELS: Record<Mark, string> = {
  kstar: "KSTAR",
  soulcuts: "SOULCUTS",
};

export default function LiquidChromeMark({
  mark = "kstar",
  className = "",
  as: Tag = "div",
  starHole = false,
}: {
  mark?: Mark;
  className?: string;
  as?: "div" | "h1" | "span";
  /** FLOW-style star cutout vibe on the last letter (decorative) */
  starHole?: boolean;
}) {
  const label = LABELS[mark];
  return (
    <Tag
      className={`liquid-chrome-mark liquid-chrome-mark--${mark} ${starHole ? "has-star-hole" : ""} ${className}`}
      aria-label={label}
    >
      <span className="lcm-shadow" aria-hidden="true">{label}</span>
      <span className="lcm-face">{label}</span>
      <span className="lcm-sheen" aria-hidden="true" />
      {starHole && <span className="lcm-star" aria-hidden="true">✦</span>}
    </Tag>
  );
}
