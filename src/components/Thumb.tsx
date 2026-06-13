// Image with a deterministic gradient fallback (local catalog has no images).

const GRADIENTS = [
  "from-[#c8ccd2] via-[#9aa0aa] to-[#7c8088]",
  "from-[#9aa0aa] via-[#7c8088] to-[#c8ccd2]",
  "from-[#c8ccd2] to-[#7c8088]",
  "from-[#7c8088] via-[#9aa0aa] to-[#c8ccd2]",
  "from-[#9aa0aa] to-[#c8ccd2]",
  "from-[#c8ccd2] via-[#7c8088] to-[#9aa0aa]",
];

function pick(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

export default function Thumb({
  src,
  seed,
  label,
  rounded = "rounded-2xl",
  focusY,
}: {
  src?: string | null;
  seed: string;
  label: string;
  rounded?: string;
  focusY?: number | null;  // vertical focal point 0..1 — keeps faces at a consistent height across crops
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={label}
        className={`h-full w-full object-cover ${rounded}`}
        style={{ objectPosition: `center ${Math.round((focusY ?? 0.3) * 100)}%` }}
      />
    );
  }
  const initials = label.replace(/[^A-Za-z0-9가-힣一-鿿]/g, "").slice(0, 2).toUpperCase();
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${pick(seed)} ${rounded} text-2xl font-black text-white/90`}
    >
      {initials || "♪"}
    </div>
  );
}
