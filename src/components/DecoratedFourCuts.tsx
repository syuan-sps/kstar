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
import { FanIdStickerCanvasEditor, type CustomStickerCanvasEditorProps } from "@/components/FanIdStickerEditor";

type Props = {
  artists: CardArtist[];
  themeId?: FanIdThemeId;
  caption?: string;
  stickers: readonly PlacedCustomSticker[];
  /** When present, stickers are interactive (drag/resize/rotate) instead of static. */
  editor?: CustomStickerCanvasEditorProps;
  className?: string;
  /** Per-idol custom photos from the photo studio. */
  photoOverrides?: Readonly<Record<string, string>>;
};

const DecoratedFourCuts = forwardRef<HTMLDivElement, Props>(function DecoratedFourCuts(
  { artists, themeId, caption, stickers, editor, className = "", photoOverrides },
  ref,
) {
  const theme = getFanIdTheme(themeId);
  // First production-frame fit test. The PNG itself is transparent outside and
  // through the photo window, while the Four Cuts grid is held fully inside the
  // window's measured safe area. Keep this isolated to Chrome until the user
  // approves the treatment for the remaining editions.
  const useCollectorFrame = theme.id === "chrome";
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
          {/* 16.5% / 14.5% places the live grid within the asset's fully open
              photo window, leaving every frame detail clear of the photos. */}
          <div className="absolute left-[16.5%] top-[14.5%] z-0 w-[67%]">
            <FourCuts artists={artists} className="w-full" linked={!editor} caption={caption} photoOverrides={photoOverrides} />
          </div>
          <img
            src="/four-cuts/frames/collector/chrome-alloy.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 h-full w-full select-none"
          />
        </>
      ) : (
        <>
          {/* The exact Fan ID metal band (rivets + edition-accent sheen), sized to the strip. */}
          <MetalFrame accent={theme.accent} band={11} radius={26} rivets />
          <FourCuts artists={artists} className="w-full" linked={!editor} caption={caption} photoOverrides={photoOverrides} />
        </>
      )}

      {/* Sticker layer spans the whole mat so decals can sit on the border too.
          The canvas editor derives % coords from this node's box (inset-0). */}
      {editor
        ? <FanIdStickerCanvasEditor {...editor} />
        : <FanIdCustomStickerLayer stickers={stickers} />}
    </div>
  );
});

export default DecoratedFourCuts;
