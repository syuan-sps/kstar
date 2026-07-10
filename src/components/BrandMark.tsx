// KSTAR = liquid-mercury sculpture asset.
// SOULCUTS = quieter readable chrome type (neutral steel, no blue/purple fills).

type Mark = "kstar" | "soulcuts";

export default function BrandMark({
  mark = "kstar",
  className = "",
}: {
  mark?: Mark;
  className?: string;
  priority?: boolean;
}) {
  if (mark === "soulcuts") {
    return (
      <span className={`brand-mark brand-mark--soulcuts quiet-chrome ${className}`} aria-label="SOULCUTS">
        SOULCUTS
      </span>
    );
  }

  return (
    <span className={`brand-mark brand-mark--kstar ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/kstar-mercury.png"
        alt="KSTAR"
        className="brand-mark-img"
        draggable={false}
      />
    </span>
  );
}
