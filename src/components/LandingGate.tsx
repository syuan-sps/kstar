"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [redirecting] = useState(() => typeof window !== "undefined" && !localStorage.getItem("kstar:onboarding"));

  useLayoutEffect(() => {
    if (redirecting) router.replace("/start");
  }, [redirecting, router]);

  if (redirecting) return null;
  return children;
}
