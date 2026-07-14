"use client";

import { useRouter } from "next/navigation";
import { writeLocaleCookie, type Locale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function LangToggle() {
  const locale = useLocale();
  const router = useRouter();

  const set = (next: Locale) => {
    if (next === locale) return;
    writeLocaleCookie(next);
    router.refresh();
  };

  const seg = (value: Locale, label: string) => (
    <button
      type="button"
      onClick={() => set(value)}
      aria-pressed={locale === value}
      className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
        locale === value
          ? "bg-[#1c1e24] text-white"
          : "text-[#5e636d] hover:text-[#1c1e24]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      role="group"
      aria-label="Language / 語言"
      className="flex shrink-0 items-center gap-0.5 rounded-full border border-[#c8ccd2]/30 p-0.5"
    >
      {seg("zh", "中")}
      {seg("en", "EN")}
    </div>
  );
}
