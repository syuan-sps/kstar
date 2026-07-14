"use client";

// Browser-only ID-photo cropper. The resulting data URL stays in caller state;
// this component never uploads or writes the image to preferences.
import { useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { useCopy } from "@/lib/i18n/LocaleProvider";

type Area = { x: number; y: number; width: number; height: number };

async function cropImage(source: string, area: Area): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const candidate = new Image();
    candidate.onload = () => resolve(candidate);
    candidate.onerror = reject;
    candidate.src = source;
  });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width));
  canvas.height = Math.max(1, Math.round(area.height));
  const context = canvas.getContext("2d");
  if (!context) return source;
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

export default function FacePhotoPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (photo: string | null) => void;
}) {
  const copy = useCopy();
  const [raw, setRaw] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFailed(false);
    const reader = new FileReader();
    reader.onload = () => { setRaw(String(reader.result)); setCrop({ x: 0, y: 0 }); setZoom(1); };
    reader.onerror = () => setFailed(true);
    reader.readAsDataURL(file);
  }

  async function confirm() {
    if (!raw || !area || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      onChange(await cropImage(raw, area));
      setRaw(null);
    } catch { setFailed(true); }
    finally { setBusy(false); }
  }

  if (raw) {
    return (
      <div className="space-y-3 rounded-xl border border-[#c8ccd2] bg-white/70 p-3">
        <div className="relative mx-auto h-[260px] w-[208px] overflow-hidden rounded-xl bg-[#1c1e24]">
          <Cropper image={raw} crop={crop} zoom={zoom} aspect={3 / 4} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_all, pixels) => setArea(pixels)} />
        </div>
        <input aria-label={copy.photoZoomAria} type="range" min={1} max={3} step={0.05} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-full accent-[#b4302b]" />
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={confirm} className="flex-1 rounded-lg bg-[#1c1e24] py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? copy.cropBusy : copy.cropConfirmBtn}</button>
          <button type="button" onClick={() => setRaw(null)} className="rounded-lg border border-[#c8ccd2] px-4 text-xs font-bold">{copy.cancel}</button>
        </div>
        {failed && <p role="alert" className="text-xs text-[#b4302b]">{copy.photoProcessFailed}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label className="cursor-pointer rounded-lg border border-[#c8ccd2] bg-white px-3 py-2 text-xs font-bold text-[#4a4f57]">
        {value ? copy.facePhotoChange : copy.facePhotoAdd}
        <input type="file" accept="image/jpeg,image/png" onChange={choose} className="hidden" />
      </label>
      {value && <button type="button" onClick={() => onChange(null)} className="text-xs text-[#9aa0aa] hover:text-[#b4302b]">{copy.removeBtn}</button>}
      {failed && <span role="alert" className="text-xs text-[#b4302b]">{copy.facePhotoReadFailed}</span>}
    </div>
  );
}
