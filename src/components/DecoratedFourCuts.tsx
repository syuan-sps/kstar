"use client";

// The 人生四格 strip dressed up with the SAME editions the Fan ID card uses: the
// edition's surface gradient becomes the paper mat, its border the frame edge.
// Plus washi-tape corners (tinted from the edition), a caption/date stamp, and a
// sticker layer over the same FourCuts grid. Pure presentation; state lives in the
// overlay/studio. Ref-forwarded so the whole node can be rasterised by exportNode.
import { forwardRef } from "react";
import type { CardArtist } from "@/lib/lite";
import { getFanIdTheme, type FanIdThemeId } from "@/lib/fanIdThemes";
import type { PlacedCustomSticker } from "@/lib/fanIdCustomStickers";
import FourCuts from "@/components/FourCuts";
import FanIdCustomStickerLayer from "@/components/FanIdCustomStickerLayer";
import MetalFrame from "@/components/MetalFrame";
import FourCutCleanLining from "@/components/FourCutCharmLayer";
import { FanIdStickerCanvasEditor, type CustomStickerCanvasEditorProps } from "@/components/FanIdStickerEditor";
import { getCardFrame, getFourCutsFramePlacement, type CardFrameTreatmentId } from "@/lib/cardFrameAssets";

type Props = {
  artists: CardArtist[];
  themeId?: FanIdThemeId;
  /** Optional physical holder, independent from the visual card edition. */
  frameTreatmentId?: CardFrameTreatmentId | null;
  caption?: string;
  stickers: readonly PlacedCustomSticker[];
  /** When present, stickers are interactive (drag/resize/rotate) instead of static. */
  editor?: CustomStickerCanvasEditorProps;
  className?: string;
  /** Per-idol custom photos from the photo studio. */
  photoOverrides?: Readonly<Record<string, string>>;
};

const DecoratedFourCuts = forwardRef<HTMLDivElement, Props>(function DecoratedFourCuts(
  { artists, themeId, frameTreatmentId, caption, stickers, editor, className = "", photoOverrides },
  ref,
) {
  const theme = getFanIdTheme(themeId);
  const collectorFrame = getCardFrame(frameTreatmentId, "fourCuts");
  const collectorPlacement = getFourCutsFramePlacement(frameTreatmentId);
  const useCollectorFrame = collectorFrame !== null && collectorPlacement !== null;
  return (
    <div
      ref={ref}
      className={`relative inline-block ${useCollectorFrame ? "aspect-[4/5]" : ""} ${className}`}
      style={useCollectorFrame ? undefined : {
        backgroundColor: theme.surfaceColor,
        backgroundImage: theme.surface,
        borderRadius: 26,
        padding: "18px 16px 16px",
      }}
    >
      {useCollectorFrame ? (
        <>
          {/* Each production frame has a measured photo-safe opening. The bare
              grid avoids a second grey card shell inside the holder. */}
          <div
            className="absolute z-0"
            style={{ left: collectorPlacement.left, top: collectorPlacement.top, width: collectorPlacement.width }}
          >
            <FourCuts artists={artists} collector className="w-full" linked={!editor} caption={caption} photoOverrides={photoOverrides} />
          </div>
          <img
            src={collectorFrame}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 h-full w-full select-none"
          />
        </>
      ) : (
        <>
          {/* A quiet Fan ID-style collector sleeve: only corner hardware, so the
              photos stay dominant while the edition colour lives in the rail. */}
          <MetalFrame accent={theme.accent} band={11} radius={26} rivets="corners" />
          <FourCuts artists={artists} className="relative z-10 w-full" linked={!editor} caption={caption} photoOverrides={photoOverrides} />
        </>
      )}

      <FourCutCleanLining accent={theme.accent} />

      {/* Sticker layer spans the whole mat so decals can sit on the border too.
          The canvas editor derives % coords from this node's box (inset-0). */}
      {editor
        ? <FanIdStickerCanvasEditor {...editor} />
        : <FanIdCustomStickerLayer stickers={stickers} />}
    </div>
  );
});

export default DecoratedFourCuts;
