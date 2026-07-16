"use client";

// Browser-only ID-photo cropper. The resulting data URL stays in caller state;
// this component never uploads or writes the image to preferences.
import { useState } from "react";
import LocalPhotoEditor from "@/components/LocalPhotoEditor";
import type { FanIdCropPreset } from "@/lib/fanIdMedia";
import { useCopy } from "@/lib/i18n/LocaleProvider";

async function cropImage(source: string, area: FanIdCropPreset["croppedAreaPixels"]): Promise<string> {
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result));
    reader.onerror = () => setError(copy.facePhotoReadFailed);
    reader.readAsDataURL(file);
  }

  async function confirm(preset: FanIdCropPreset) {
    if (!raw || busy) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await cropImage(raw, preset.croppedAreaPixels));
      setRaw(null);
    } catch { setError(copy.photoProcessFailed); }
    finally { setBusy(false); }
  }

  if (raw) {
    return (
      <LocalPhotoEditor
        sourceUrl={raw}
        cropKind="user-portrait"
        busy={busy}
        label={copy.facePhotoChange}
        error={error}
        onCancel={() => { setRaw(null); setError(null); }}
        onConfirm={confirm}
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label className="cursor-pointer rounded-lg border border-[#c8ccd2] bg-white px-3 py-2 text-xs font-bold text-[#4a4f57]">
        {value ? copy.facePhotoChange : copy.facePhotoAdd}
        <input type="file" accept="image/jpeg,image/png" onChange={choose} className="hidden" />
      </label>
      {value && <button type="button" onClick={() => onChange(null)} className="text-xs text-[#9aa0aa] hover:text-[#b4302b]">{copy.removeBtn}</button>}
      {error && <span role="alert" className="text-xs text-[#b4302b]">{error}</span>}
    </div>
  );
}
