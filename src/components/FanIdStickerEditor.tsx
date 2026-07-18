"use client";

import { useRef, type PointerEvent } from "react";
import {
  CUSTOM_STICKER_PACKS,
  getCustomStickerAsset,
  getCustomStickerPack,
  makePlacedSticker,
  MAX_CUSTOM_STICKERS,
  MAX_CUSTOM_STICKER_SCALE,
  MIN_CUSTOM_STICKER_SCALE,
  normalizeCustomStickerRotation,
  type CustomStickerPackId,
  type PlacedCustomSticker,
} from "@/lib/fanIdCustomStickers";

type Update = (id: string, patch: Partial<PlacedCustomSticker>) => void;

export type CustomStickerEditorProps = Readonly<{
  selectedThemeId: CustomStickerPackId;
  activePackId: CustomStickerPackId;
  stickers: readonly PlacedCustomSticker[];
  onPackChange: (packId: CustomStickerPackId) => void;
  onChange: (stickers: PlacedCustomSticker[]) => void;
}>;

export type CustomStickerCanvasEditorProps = Readonly<{
  stickers: readonly PlacedCustomSticker[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onTransform: Update;
  onRemove: (id: string) => void;
}>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `decal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function FanIdStickerCanvasEditor({ stickers, selectedId, onSelect, onTransform, onRemove }: CustomStickerCanvasEditorProps) {
  const interaction = useRef<{ id: string; mode: "drag" | "resize" | "rotate"; pointerId: number; origin: PlacedCustomSticker } | null>(null);

  function position(event: PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  }

  function begin(event: PointerEvent<HTMLElement>, sticker: PlacedCustomSticker, mode: "drag" | "resize" | "rotate") {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    interaction.current = { id: sticker.id, mode, pointerId: event.pointerId, origin: sticker };
    onSelect(sticker.id);
  }

  function move(event: PointerEvent<HTMLElement>) {
    const current = interaction.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const point = position(event);
    if (!point) return;
    if (current.mode === "drag") {
      onTransform(current.id, point);
      return;
    }
    const dx = point.x - current.origin.x;
    const dy = point.y - current.origin.y;
    if (current.mode === "resize") {
      const distance = Math.hypot(dx, dy);
      onTransform(current.id, { scale: clamp(distance / 48, MIN_CUSTOM_STICKER_SCALE, MAX_CUSTOM_STICKER_SCALE) });
      return;
    }
    onTransform(current.id, { rotation: normalizeCustomStickerRotation(Math.round((Math.atan2(dy, dx) * 180) / Math.PI + 90)) });
  }

  function finish(event: PointerEvent<HTMLElement>) {
    if (interaction.current?.pointerId === event.pointerId) interaction.current = null;
  }

  return (
    <div data-fanid-custom-sticker-editor className="absolute inset-0 z-50 overflow-hidden" onPointerDown={() => onSelect(null)}>
      {stickers.map((sticker) => {
        const asset = getCustomStickerAsset(sticker.assetId);
        if (!asset) return null;
        const selected = sticker.id === selectedId;
        const common = {
          left: `${sticker.x}%`,
          top: `${sticker.y}%`,
          width: `${sticker.scale * 100}%`,
          transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
        };
        return (
          <div key={sticker.id} className="absolute" style={common}>
            <button
              type="button"
              aria-label={`Move ${asset.label}`}
              aria-pressed={selected}
              data-fanid-custom-sticker={sticker.assetId}
              onPointerDown={(event) => begin(event, sticker, "drag")}
              onPointerMove={move}
              onPointerUp={finish}
              onPointerCancel={finish}
              onKeyDown={(event) => {
                const step = event.shiftKey ? 5 : 1;
                if (event.key === "ArrowLeft") { event.preventDefault(); onTransform(sticker.id, { x: clamp(sticker.x - step, 0, 100) }); }
                else if (event.key === "ArrowRight") { event.preventDefault(); onTransform(sticker.id, { x: clamp(sticker.x + step, 0, 100) }); }
                else if (event.key === "ArrowUp") { event.preventDefault(); onTransform(sticker.id, { y: clamp(sticker.y - step, 0, 100) }); }
                else if (event.key === "ArrowDown") { event.preventDefault(); onTransform(sticker.id, { y: clamp(sticker.y + step, 0, 100) }); }
                else if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); onRemove(sticker.id); }
              }}
              className={`block w-full touch-none select-none rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${selected ? "ring-2 ring-[#1683ff] ring-offset-1" : ""}`}
            >
              <img alt="" draggable={false} src={asset.src} className="block h-auto w-full max-w-none select-none" />
            </button>
            {selected && (
              <>
                <button type="button" aria-label={`Resize ${asset.label}`} onClick={(event) => { if (event.detail === 0) onTransform(sticker.id, { scale: clamp(sticker.scale + .02, MIN_CUSTOM_STICKER_SCALE, MAX_CUSTOM_STICKER_SCALE) }); }} onPointerDown={(event) => begin(event, sticker, "resize")} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} className="absolute -bottom-2 -right-2 grid h-5 w-5 touch-none place-items-center rounded-full border border-white bg-[#1683ff] text-xs font-black text-white shadow">↗</button>
                <button type="button" aria-label={`Rotate ${asset.label}`} onClick={(event) => { if (event.detail === 0) onTransform(sticker.id, { rotation: normalizeCustomStickerRotation(sticker.rotation + 15) }); }} onPointerDown={(event) => begin(event, sticker, "rotate")} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} className="absolute -top-2 left-1/2 grid h-5 w-5 -translate-x-1/2 touch-none place-items-center rounded-full border border-white bg-[#1c1e24] text-[10px] font-black text-white shadow">↻</button>
                <button type="button" aria-label={`Remove ${asset.label}`} onClick={() => onRemove(sticker.id)} className="absolute -left-2 -top-2 grid h-5 w-5 place-items-center rounded-full border border-white bg-[#b4302b] text-xs font-black text-white shadow">×</button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function FanIdStickerEditor({ selectedThemeId, activePackId, stickers, onPackChange, onChange }: CustomStickerEditorProps) {
  const activePack = getCustomStickerPack(activePackId);
  const atLimit = stickers.length >= MAX_CUSTOM_STICKERS;
  return (
    <section data-fanid-sticker-shelf className="space-y-3 rounded-2xl border border-[#c8ccd2] bg-white/75 p-3">
      <div className="flex items-center justify-between gap-2">
        <div><p className="text-xs font-bold text-[#1c1e24]">Custom stickers</p><p className="mt-0.5 text-[11px] text-[#5e636d]">Place them anywhere — overlap is part of the fun.</p></div>
        <span className="rounded-full border border-[#c8ccd2] bg-white px-2 py-1 text-[10px] font-bold text-[#5e636d]">{stickers.length} / {MAX_CUSTOM_STICKERS}</span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Sticker packs">
        {Object.entries(CUSTOM_STICKER_PACKS).map(([packId, pack]) => {
          const active = activePackId === packId;
          return <button key={packId} role="tab" aria-selected={active} type="button" onClick={() => onPackChange(packId as CustomStickerPackId)} className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${active ? "border-[#1c1e24] bg-[#1c1e24] text-white" : "border-[#c8ccd2] bg-white text-[#5e636d]"}`}>{pack.label}{packId === selectedThemeId ? " · default" : ""}</button>;
        })}
      </div>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {activePack.assets.map((asset) => (
          <button key={asset.id} type="button" disabled={atLimit} onClick={() => onChange([...stickers, makePlacedSticker(asset, createId())])} title={asset.label} aria-label={`Add ${asset.label}`} className="aspect-square overflow-hidden rounded-lg border border-[#d9dde2] bg-white p-1 transition hover:border-[#1c1e24] disabled:cursor-not-allowed disabled:opacity-35">
            <img alt="" src={asset.src} draggable={false} className="h-full w-full object-contain" />
          </button>
        ))}
      </div>
    </section>
  );
}
