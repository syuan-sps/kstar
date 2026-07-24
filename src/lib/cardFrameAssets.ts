/**
 * These are real, ratio-specific overlays rather than a generic CSS border.
 * A treatment is intentionally opt-in only after all of its corresponding
 * formats have been reviewed and alpha-cut for production.
 */
export type CardFrameFormat = "fourCuts" | "story" | "fanIdTall" | "fanIdCompact";
export type CardFrameTreatmentId = "chrome-alloy" | "chrome-clear-acrylic" | "dreamy-acrylic" | "kawaii-pink-metal";

export type FanIdBorderSkin = {
  src: string;
  /** Visible alpha bounds in source pixels. Mapping this box to the existing
      328×693 border guarantees the material skin cannot enter card content. */
  alphaBounds: readonly [number, number, number, number];
};

/**
 * A holder is deliberately larger than the live Fan ID. Its transparent
 * aperture is mapped to the complete card rectangle, so decoration never
 * lands on the photo, archetype block, or QR footer.
 */
export type FanIdHolderOverlay = {
  src: string;
  /** Offsets are in the live card's 328px coordinate space. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Extra space the preview shell reserves for the holder outside the card. */
  shell: { left: number; top: number; right: number; bottom: number };
  /** Collector caps can be tuned independently of the already-aligned rails. */
  topCap?: { height: number; offsetY: number };
};

type FourCutsPlacement = {
  left: string;
  top: string;
  width: string;
};

type FrameTreatment = {
  assets: Record<CardFrameFormat, string>;
  fourCutsPlacement: FourCutsPlacement;
};

const FRAME_TREATMENTS: Record<CardFrameTreatmentId, FrameTreatment> = {
  "chrome-alloy": {
    assets: {
      fourCuts: "/four-cuts/frames/collector/chrome-alloy.png",
      story: "/card-frames/chrome/story-9x16.png",
      fanIdTall: "/card-frames/chrome/fanid-tall.png",
      fanIdCompact: "/card-frames/chrome/fanid-compact.png",
    },
    fourCutsPlacement: { left: "16.5%", top: "14.5%", width: "67%" },
  },
  "chrome-clear-acrylic": {
    assets: {
      fourCuts: "/card-frames/chrome-clear-acrylic/four-cuts-4x5.png",
      story: "/card-frames/chrome-clear-acrylic/story-9x16.png",
      fanIdTall: "/card-frames/chrome-clear-acrylic/fanid-tall.png",
      fanIdCompact: "/card-frames/chrome-clear-acrylic/fanid-compact.png",
    },
    fourCutsPlacement: { left: "14%", top: "11%", width: "72%" },
  },
  "dreamy-acrylic": {
    assets: {
      fourCuts: "/card-frames/dreamy-acrylic/four-cuts-4x5.png",
      story: "/card-frames/dreamy-acrylic/story-9x16.png",
      fanIdTall: "/card-frames/dreamy-acrylic/fanid-tall.png",
      fanIdCompact: "/card-frames/dreamy-acrylic/fanid-compact.png",
    },
    fourCutsPlacement: { left: "14%", top: "10%", width: "72%" },
  },
  "kawaii-pink-metal": {
    assets: {
      fourCuts: "/card-frames/kawaii-pink-metal/four-cuts-4x5.png",
      story: "/card-frames/kawaii-pink-metal/story-9x16.png",
      fanIdTall: "/card-frames/kawaii-pink-metal/fanid-tall.png",
      fanIdCompact: "/card-frames/kawaii-pink-metal/fanid-compact.png",
    },
    fourCutsPlacement: { left: "12.5%", top: "11%", width: "75%" },
  },
};

export function getCardFrame(treatmentId: CardFrameTreatmentId | null | undefined, format: CardFrameFormat) {
  return treatmentId ? FRAME_TREATMENTS[treatmentId].assets[format] : null;
}

export function getFourCutsFramePlacement(treatmentId: CardFrameTreatmentId | null | undefined): FourCutsPlacement | null {
  return treatmentId ? FRAME_TREATMENTS[treatmentId].fourCutsPlacement : null;
}

/**
 * The first live fit uses only a tall Chrome Clear Acrylic skin. The compact
 * card intentionally stays on its established SVG border until its own thin
 * material skin has been generated and tested.
 */
export function getFanIdBorderSkin(
  treatmentId: CardFrameTreatmentId | null | undefined,
  compact: boolean,
): FanIdBorderSkin | null {
  if (treatmentId !== "chrome-clear-acrylic" || compact) return null;
  return {
    src: "/card-frames/chrome-clear-acrylic/fanid-tall.png",
    alphaBounds: [33, 52, 853, 1717],
  };
}

/** Full transparent foreground frame. It is deliberately separate from the
 * thin fallback skin: this artwork sits above the completed card while its
 * central alpha opening reveals every live card section below. */
export function getFanIdHolderOverlay(
  treatmentId: CardFrameTreatmentId | null | undefined,
  compact: boolean,
): FanIdHolderOverlay | null {
  // These are large treatments, therefore outer holders rather than skins
  // that replace the 11px card rim. Each aperture is measured independently
  // and scaled to the complete live-card rectangle below.
  if (compact) return null;
  const isCollectorChrome = treatmentId === "chrome-alloy";
  const isClearChrome = treatmentId === "chrome-clear-acrylic";
  if (!isCollectorChrome && !isClearChrome) return null;

  const source = isCollectorChrome
    ? { src: "/card-frames/chrome/fanid-tall.png", left: 99, right: 787, top: 166, bottom: 1644 }
    : { src: "/card-frames/chrome-clear-acrylic/fanid-tall.png", left: 128, right: 759, top: 175, bottom: 1604 };
  const sourceWidth = 887;
  const sourceHeight = 1774;
  const scaleX = 328 / (source.right - source.left);
  // The established, analysis-visible Fan ID renders at 691.5px tall. The
  // source window is slightly taller than that, so use an independent Y scale
  // instead of leaving a blank strip below the QR footer.
  const scaleY = 691.5 / (source.bottom - source.top);
  return {
    src: source.src,
    left: -(source.left * scaleX),
    top: -(source.top * scaleY),
    width: sourceWidth * scaleX,
    height: sourceHeight * scaleY,
    shell: {
      left: source.left * scaleX,
      top: source.top * scaleY,
      right: (sourceWidth - source.right) * scaleX,
      bottom: (sourceHeight - source.bottom) * scaleY,
    },
    // Reduce the empty headroom without moving either side rail or the bottom
    // KSTAR 2026 plaque. Values are in rendered CSS pixels.
    topCap: { height: isCollectorChrome ? 110 : 114, offsetY: 38 },
  };
}
