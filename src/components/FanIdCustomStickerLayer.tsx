import { getCustomStickerAsset, type PlacedCustomSticker } from "@/lib/fanIdCustomStickers";

export default function FanIdCustomStickerLayer({ stickers }: { stickers: readonly PlacedCustomSticker[] }) {
  if (stickers.length === 0) return null;

  return (
    <div aria-hidden="true" data-fanid-custom-sticker-layer className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {stickers.map((sticker) => {
        const asset = getCustomStickerAsset(sticker.assetId);
        if (!asset) return null;
        return (
          <img
            key={sticker.id}
            alt=""
            draggable={false}
            data-fanid-custom-sticker={sticker.assetId}
            src={asset.src}
            className="absolute h-auto max-w-none select-none"
            style={{
              left: `${sticker.x}%`,
              top: `${sticker.y}%`,
              width: `${sticker.scale * 100}%`,
              transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}
