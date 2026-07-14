"use client";

// 補照片 CTA — cherry pill with a gentle ♥ heartbeat that deep-links a fan into
// the submission form for THIS idol (/submit?idol=<id>). Works whether or not a
// parent <Link> wraps it (preventDefault + stopPropagation). Caller positions it
// via `className`.

import { useRouter } from "next/navigation";
import { useCopy } from "@/lib/i18n/LocaleProvider";

export default function AddPhotoCTA({
  idolId,
  name,
  className = "",
}: {
  idolId: string;
  name: string;
  className?: string;
}) {
  const copy = useCopy();
  const router = useRouter();
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/submit?idol=${idolId}`);
      }}
      aria-label={copy.addPhotoAria(name)}
      title={copy.addPhoto}
      className={`inline-flex cursor-pointer items-center gap-1 rounded-full bg-[#b4302b] px-3 py-1.5 text-[11px] font-bold leading-none text-white shadow-[0_3px_10px_rgba(180,48,43,0.45)] transition hover:brightness-110 ${className}`}
    >
      <span aria-hidden className="cta-heartbeat text-[12px] leading-none">♥</span>
      {copy.addPhoto}
    </button>
  );
}
