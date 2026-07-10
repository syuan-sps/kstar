// Asset-based brand marks — liquid-mercury KSTAR sculpture + quieter chrome SOULCUTS.
// Plain <img> (not next/image) so transparent PNGs stay crisp in intro overlays.

type Mark = "kstar" | "soulcuts";

const SRC: Record<Mark, { src: string; alt: string }> = {
  kstar: { src: "/brand/kstar-mercury.png", alt: "KSTAR" },
  soulcuts: { src: "/brand/soulcuts-chrome.png", alt: "SOULCUTS" },
};

export default function BrandMark({
  mark = "kstar",
  className = "",
}: {
  mark?: Mark;
  className?: string;
  priority?: boolean;
}) {
  const m = SRC[mark];
  return (
    <span className={`brand-mark brand-mark--${mark} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.src} alt={m.alt} className="brand-mark-img" draggable={false} />
    </span>
  );
}
