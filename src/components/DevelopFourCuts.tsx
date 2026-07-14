"use client";

// Camera-print on the select→reveal transition: a chrome instant-camera
// "develops" the user's four real picks, then hands off to the Step 2 reveal.
// ~4.2s. Visuals/timing live in globals.css (the ".dev-*" block).

import { useEffect } from "react";
import type { CardArtist } from "@/lib/lite";
import Thumb from "@/components/Thumb";

// Matches the CSS timeline: feed + development, a short completed-strip hold,
// then a soft stage fade into the Step 2 reveal.
const DONE_MS = 4200;

export default function DevelopFourCuts({
  artists,
  onDone,
}: {
  artists: CardArtist[];
  onDone: () => void;
}) {
  useEffect(() => {
    // The camera-print plays on every 沖洗照片 tap — the user explicitly triggered
    // it — including under prefers-reduced-motion, where it used to be skipped.
    const t = setTimeout(onDone, DONE_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="dev-splash" aria-hidden="true">
      <div className="dev-stage">
        <div className="dev-cam">
          <span className="dev-rec" />
          <div className="dev-lens">
            <span className="dev-glint" />
          </div>
          <div className="dev-cam-label">KSTAR PHOTO</div>
        </div>
        <div className="dev-output">
          <div className="dev-strip">
            <div className="dev-grid">
              {artists.slice(0, 4).map((a, i) => (
                <div key={a.id} className={`dev-cut dev-cut${i}`}>
                  <Thumb src={a.image_url} seed={a.id} label={a.name} rounded="rounded-md" focusY={a.image_focus} />
                </div>
              ))}
            </div>
            <div className="dev-cap">✦ KSTAR · 2026 ✦</div>
            <span className="dev-develop-sweep" />
          </div>
        </div>
        <div className="dev-mouth" />
        <div className="dev-exposure" />
      </div>
    </div>
  );
}
