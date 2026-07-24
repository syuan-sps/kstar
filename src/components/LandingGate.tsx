"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Must start false so the first client render matches the server, which has no
  // localStorage to read. Seeding this from localStorage made a first-time
  // visitor's client render `null` against a server render of the whole page —
  // a hydration mismatch that made React throw the server HTML away.
  const [redirecting, setRedirecting] = useState(false);

  // useLayoutEffect, not useEffect: this runs after hydration but before paint,
  // so the redirect still happens without a visible flash of the home page.
  useLayoutEffect(() => {
    let onboarded = true;
    try { onboarded = Boolean(localStorage.getItem("kstar:onboarding")); } catch { /* treat as onboarded */ }
    if (!onboarded) {
      setRedirecting(true);
      router.replace("/start");
    }
  }, [router]);

  if (redirecting) return null;
  return children;
}
