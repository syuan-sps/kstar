"use client";

import { useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import type { FanIdCropKind, FanIdCropPreset } from "@/lib/fanIdMedia";
import { cropAspect } from "@/lib/fanIdMedia";
import { useCopy } from "@/lib/i18n/LocaleProvider";

type CropPosition = FanIdCropPreset["crop"];
type CropArea = FanIdCropPreset["croppedAreaPixels"];

interface LocalPhotoEditorProps {
  sourceUrl: string;
  cropKind: FanIdCropKind;
  initialPreset?: FanIdCropPreset;
  busy?: boolean;
  label: string;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (preset: FanIdCropPreset) => void;
}

const DEFAULT_CROP: CropPosition = { x: 0, y: 0 };

function hasPositiveDimensions(area: CropArea | null): area is CropArea {
  return Boolean(area && area.width > 0 && area.height > 0);
}

export default function LocalPhotoEditor({
  sourceUrl,
  cropKind,
  initialPreset,
  busy = false,
  label,
  error = null,
  onCancel,
  onConfirm,
}: LocalPhotoEditorProps) {
  const copy = useCopy();
  const [crop, setCrop] = useState<CropPosition>(() => initialPreset?.crop ?? DEFAULT_CROP);
  const [zoom, setZoom] = useState(() => initialPreset?.zoom ?? 1);
  const [area, setArea] = useState<CropArea | null>(() => initialPreset?.croppedAreaPixels ?? null);
  const [cropperKey, setCropperKey] = useState(0);

  useEffect(() => {
    setCrop(initialPreset?.crop ?? DEFAULT_CROP);
    setZoom(initialPreset?.zoom ?? 1);
    setArea(initialPreset?.croppedAreaPixels ?? null);
  }, [sourceUrl, initialPreset]);

  const avatar = cropKind === "user-avatar";
  const viewportClassName = avatar ? "h-[240px] w-[240px] rounded-full" : "h-[273px] w-[240px] rounded-xl";

  function reset() {
    setCrop(DEFAULT_CROP);
    setZoom(1);
    setArea(null);
    setCropperKey((value) => value + 1);
  }

  function confirm() {
    if (!hasPositiveDimensions(area)) return;
    onConfirm({ crop, zoom, croppedAreaPixels: area });
  }

  return (
    <div data-fanid-photo-editor data-crop-kind={cropKind} className="space-y-3 rounded-xl border border-[#c8ccd2] bg-white/70 p-3">
      <p className="text-xs font-bold text-[#4a4f57]">{label}</p>
      <div data-fanid-photo-crop className={`relative mx-auto overflow-hidden bg-[#1c1e24] ${viewportClassName}`}>
        <Cropper
          key={cropperKey}
          image={sourceUrl}
          crop={crop}
          zoom={zoom}
          aspect={cropAspect(cropKind)}
          cropShape={avatar ? "round" : "rect"}
          showGrid
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_croppedArea, croppedAreaPixels) => setArea(croppedAreaPixels)}
        />
      </div>
      <input
        data-fanid-photo-zoom
        aria-label={copy.photoZoomAria}
        type="range"
        min={1}
        max={3}
        step={0.05}
        value={zoom}
        onChange={(event) => setZoom(Number(event.target.value))}
        className="w-full accent-[#b4302b]"
      />
      <div className="flex gap-2">
        <button data-fanid-photo-reset type="button" onClick={reset} className="rounded-lg border border-[#c8ccd2] px-4 py-2 text-xs font-bold">Reset</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-[#c8ccd2] px-4 py-2 text-xs font-bold">{copy.cancel}</button>
        <button
          data-fanid-photo-confirm
          type="button"
          disabled={busy || !hasPositiveDimensions(area)}
          onClick={confirm}
          className="flex-1 rounded-lg bg-[#1c1e24] py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {busy ? copy.cropBusy : copy.cropConfirmBtn}
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-[#b4302b]">{error}</p>}
    </div>
  );
}
