"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

export default function HomeLogoLink({ children, className }: { children: ReactNode; className?: string }) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    try {
      localStorage.setItem("kstar:onboarding", "done");
    } catch {
      // Navigation still works when browser storage is unavailable.
    }
  }

  return <Link href="/" className={className} onClick={handleClick}>{children}</Link>;
}
