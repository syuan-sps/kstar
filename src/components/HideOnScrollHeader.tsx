"use client";

// The header is ~95px on mobile (it wraps to a logo row + a full-width search
// row), which is a lot of permanent real estate on a 812px screen. It slides
// away while scrolling down and comes straight back on the first upward scroll,
// so search is always one small gesture away without holding the space open.
// Desktop keeps it pinned — there the height is cheap and the extra motion isn't.

import { useEffect, useRef, useState, type ReactNode } from "react";

// Ignore jitter/rubber-banding; only react to deliberate movement.
const DELTA = 6;
// Never hide near the very top, or the header flickers during small bounces.
const TOP_ZONE = 90;

export default function HideOnScrollHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    let queued = false;

    const evaluate = () => {
      queued = false;
      const y = window.scrollY;
      const moved = y - lastY.current;
      if (y <= TOP_ZONE) setHidden(false);
      else if (moved > DELTA) setHidden(true);       // scrolling down → get out of the way
      else if (moved < -DELTA) setHidden(false);     // scrolling up → come back
      if (Math.abs(moved) > DELTA || y <= TOP_ZONE) lastY.current = y;
    };

    // rAF-throttled: scroll fires far more often than we can usefully re-render.
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(evaluate);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-hidden={hidden ? "true" : undefined}
      className={`${className} transition-transform duration-300 ease-out ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } md:translate-y-0`}
    >
      {children}
    </header>
  );
}
