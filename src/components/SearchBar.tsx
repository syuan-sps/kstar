"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { copy } from "@/lib/copy";

export default function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
      className="flex items-center gap-2"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={copy.searchPlaceholder}
        aria-label={copy.search}
        className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm outline-none placeholder:text-white/40 focus:border-fuchsia-400/60"
      />
    </form>
  );
}
