// FLOW-style technical poster frame — hairlines, serials, sparkles, barcode.
// Wraps hero / intro brand planes. Pure presentational.

import type { ReactNode } from "react";

export default function PosterFrame({
  children,
  className = "",
  serial = "KSTAR · 2026",
  index = "01",
}: {
  children: ReactNode;
  className?: string;
  serial?: string;
  index?: string;
}) {
  return (
    <div className={`poster-frame ${className}`}>
      <div className="poster-frame-inner">
        <div className="poster-meta poster-meta-top">
          <span className="poster-chip">FLOW</span>
          <span className="poster-index">{index}</span>
          <span className="poster-date">{serial.replace(/\s/g, "")}</span>
        </div>
        <span className="poster-spark poster-spark-tl" aria-hidden="true">✦</span>
        <span className="poster-spark poster-spark-tr" aria-hidden="true">✧</span>
        <span className="poster-spark poster-spark-bl" aria-hidden="true">✦</span>
        <span className="poster-spark poster-spark-br" aria-hidden="true">✧</span>
        <div className="poster-body">{children}</div>
        <div className="poster-meta poster-meta-bot">
          <span className="poster-bars" aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
          </span>
          <span className="poster-chip soft">SOULCUTS</span>
          <span className="poster-cross" aria-hidden="true">⊕</span>
        </div>
      </div>
    </div>
  );
}
