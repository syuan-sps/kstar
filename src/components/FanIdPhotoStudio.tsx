"use client";

import { useEffect, useRef, useState } from "react";
import LocalPhotoEditor from "@/components/LocalPhotoEditor";
import type { useFanIdLocalMedia } from "@/hooks/useFanIdLocalMedia";
import {
  classifyFanIdStorageError,
  makeFanIdMediaKey,
  type FanIdCardMode,
  type FanIdCropKind,
  type FanIdCropPreset,
  type FanIdMediaRecord,
  type FanIdMediaRole,
} from "@/lib/fanIdMedia";
import { FanIdPhotoError, prepareFanIdPhotoSource, renderFanIdPhotoCrop } from "@/lib/fanIdPhotoProcessing";
import { useCopy } from "@/lib/i18n/LocaleProvider";
import type { CardArtist } from "@/lib/lite";

interface FanIdPhotoStudioProps {
  cardSerial: string;
  picks: readonly CardArtist[];
  cardMode: FanIdCardMode;
  media: ReturnType<typeof useFanIdLocalMedia>;
}

type EditorDraft = {
  role: FanIdMediaRole;
  cropKind: FanIdCropKind;
  source: Blob;
  sourceWidth: number;
  sourceHeight: number;
  sourceUrl: string;
  existingRecord: FanIdMediaRecord | null;
  sourceReplaced: boolean;
};

export default function FanIdPhotoStudio({ cardSerial, picks, cardMode, media }: FanIdPhotoStudioProps) {
  const copy = useCopy();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputs = useRef(new Map<string, HTMLInputElement>());
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const cropRenderRequestRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<EditorDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draftSource = draft?.source;
  useEffect(() => {
    if (!draftSource) return;
    const sourceUrl = URL.createObjectURL(draftSource);
    let active = true;
    queueMicrotask(() => {
      if (active) setDraft((current) => current && current.source === draftSource ? { ...current, sourceUrl } : current);
    });
    return () => {
      active = false;
      URL.revokeObjectURL(sourceUrl);
    };
  }, [draftSource]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (draft && !dialog.open) dialog.showModal();
    if (!draft && dialog.open) dialog.close();
  }, [draft]);

  const mediaError = media.errorCode === "storage-full"
    ? copy.fanIdPhotoStorageFull
    : media.errorCode === "storage-unavailable" ? copy.fanIdPhotoStorageUnavailable : null;

  function recordFor(role: FanIdMediaRole): FanIdMediaRecord | null {
    return media.records.get(makeFanIdMediaKey(cardSerial, role)) ?? null;
  }

  function messageFor(errorValue: unknown): string {
    if (errorValue instanceof FanIdPhotoError) {
      if (errorValue.code === "unsupported-type") return copy.fanIdPhotoUnsupportedType;
      if (errorValue.code === "file-too-large") return copy.fanIdPhotoTooLarge;
      if (errorValue.code === "decoded-image-too-large") return copy.fanIdPhotoDecodedTooLarge;
      return copy.fanIdPhotoDecodeFailed;
    }
    return classifyFanIdStorageError(errorValue) === "storage-full"
      ? copy.fanIdPhotoStorageFull
      : copy.fanIdPhotoStorageUnavailable;
  }

  function clearDraft() {
    cropRenderRequestRef.current += 1;
    setBusy(false);
    setError(null);
    setDraft(null);
    requestAnimationFrame(() => restoreFocusRef.current?.focus());
  }

  function openExisting(role: FanIdMediaRole, cropKind: FanIdCropKind, opener: HTMLElement) {
    const existingRecord = recordFor(role);
    if (!existingRecord) return;
    restoreFocusRef.current = opener;
    setError(null);
    setDraft({
      role,
      cropKind,
      source: existingRecord.source,
      sourceWidth: existingRecord.sourceWidth,
      sourceHeight: existingRecord.sourceHeight,
      sourceUrl: "",
      existingRecord,
      sourceReplaced: false,
    });
  }

  async function choose(role: FanIdMediaRole, cropKind: FanIdCropKind, file: File, opener: HTMLElement) {
    restoreFocusRef.current = opener;
    setBusy(true);
    setError(null);
    try {
      const prepared = await prepareFanIdPhotoSource(file);
      setDraft({
        role,
        cropKind,
        source: prepared.blob,
        sourceWidth: prepared.width,
        sourceHeight: prepared.height,
        sourceUrl: "",
        existingRecord: recordFor(role),
        sourceReplaced: true,
      });
    } catch (errorValue) {
      setError(messageFor(errorValue));
    } finally {
      setBusy(false);
    }
  }

  async function confirm(preset: FanIdCropPreset) {
    if (!draft || busy) return;
    const requestId = cropRenderRequestRef.current + 1;
    cropRenderRequestRef.current = requestId;
    setBusy(true);
    setError(null);
    try {
      const preview = await renderFanIdPhotoCrop(draft.source, preset, draft.cropKind);
      if (cropRenderRequestRef.current !== requestId) return;
      const prior = draft.existingRecord;
      const crops = draft.sourceReplaced ? {} : { ...(prior?.crops ?? {}) };
      const previews = draft.sourceReplaced ? {} : { ...(prior?.previews ?? {}) };
      crops[draft.cropKind] = preset;
      previews[draft.cropKind] = preview;
      await media.save({
        key: makeFanIdMediaKey(cardSerial, draft.role),
        cardSerial,
        role: draft.role,
        source: draft.source,
        sourceWidth: draft.sourceWidth,
        sourceHeight: draft.sourceHeight,
        crops,
        previews,
        updatedAt: (prior?.updatedAt ?? 0) + 1,
      });
      if (cropRenderRequestRef.current !== requestId) return;
      clearDraft();
    } catch (errorValue) {
      if (cropRenderRequestRef.current === requestId) {
        setError(messageFor(errorValue));
        setBusy(false);
      }
    }
  }

  function launchChooser(key: string, opener: HTMLButtonElement) {
    restoreFocusRef.current = opener;
    fileInputs.current.get(key)?.click();
  }

  function destinationTitle(editorDraft: EditorDraft): string {
    if (editorDraft.role.kind === "idol") {
      const idolId = editorDraft.role.idolId;
      const idol = picks.find((pick) => pick.id === idolId);
      return idol?.name_zh ?? idol?.name ?? idolId;
    }
    return editorDraft.cropKind === "user-avatar" ? copy.fanIdUserAvatar : copy.fanIdUserPortrait;
  }

  const primaryUserKind: FanIdCropKind = cardMode === "idol-user" ? "user-avatar" : "user-portrait";
  const userCropKinds: readonly FanIdCropKind[] = cardMode === "idol-user"
    ? ["user-avatar", "user-portrait"]
    : ["user-portrait", "user-avatar"];
  const userSrc = primaryUserKind === "user-avatar"
    ? media.userAvatarSrc ?? media.userPortraitSrc
    : media.userPortraitSrc ?? media.userAvatarSrc;
  const hasCustom = media.records.size > 0;
  const dialogTitle = draft ? destinationTitle(draft) : "";

  return (
    <section data-fanid-photo-studio className="w-full max-w-lg rounded-2xl border border-[#c8ccd2] bg-white/75 p-4 shadow-sm">
      <details open={open} onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}>
        <summary className="cursor-pointer list-none font-bold text-[#1c1e24]">
          {copy.fanIdPhotosTitle}
          <span className="ml-2 text-xs font-medium text-[#5e636d]">{hasCustom ? copy.fanIdPhotosSummaryCustom : copy.fanIdPhotosSummaryOriginal}</span>
        </summary>
        <div className="mt-4 space-y-4">
          <p data-fanid-photo-local-note className="text-xs text-[#4a4f57]">{copy.fanIdPhotoStoredLocal}</p>
          <p className="text-xs text-[#4a4f57]">{copy.fanIdPhotoPermissionNote}</p>
          {(busy || media.status === "loading") && <p role="status" aria-live="polite" className="text-xs text-[#4a4f57]">{copy.processing}</p>}
          {(error ?? mediaError) && <p role="alert" className="text-xs text-[#b4302b]">{error ?? mediaError}</p>}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {picks.slice(0, 4).map((pick) => {
              const role: FanIdMediaRole = { kind: "idol", idolId: pick.id };
              const record = recordFor(role);
              const key = `idol:${pick.id}`;
              return <div key={pick.id} data-fanid-idol-photo={pick.id} className="space-y-2 rounded-xl border border-[#d9dde2] p-2">
                <div className="aspect-[4/4.55] overflow-hidden rounded-lg bg-[#eef0f3]">
                  {(media.idolPreviewSources[pick.id] ?? pick.image_url) ? <img className="h-full w-full object-cover" src={media.idolPreviewSources[pick.id] ?? pick.image_url ?? ""} alt={pick.name_zh ?? pick.name} /> : null}
                </div>
                <p className="truncate text-xs font-bold">{pick.name_zh ?? pick.name}</p>
                <p className="text-[11px] text-[#5e636d]">{record ? copy.fanIdPhotoCustomLocal : copy.fanIdPhotoOriginal}</p>
                <input ref={(node) => { if (node) fileInputs.current.set(key, node); else fileInputs.current.delete(key); }} className="hidden" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ""; if (file && restoreFocusRef.current) void choose(role, "idol-portrait", file, restoreFocusRef.current); }} />
                <button type="button" onClick={(event) => launchChooser(key, event.currentTarget)} className="w-full rounded-lg border border-[#c8ccd2] px-2 py-1 text-xs font-bold">{copy.fanIdPhotoReplace}</button>
                {record && <><button type="button" onClick={(event) => openExisting(role, "idol-portrait", event.currentTarget)} className="w-full rounded-lg border border-[#c8ccd2] px-2 py-1 text-xs font-bold">{copy.fanIdPhotoAdjust}</button><button type="button" onClick={() => void media.remove(role)} className="w-full text-xs text-[#b4302b]">{copy.fanIdPhotoUseOriginal}</button></>}
              </div>;
            })}
          </div>

          <div data-fanid-user-photo className="rounded-xl border border-[#d9dde2] p-3">
            <div className="flex items-start gap-3">
              <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-[#eef0f3]">{userSrc && <img className="h-full w-full object-cover" src={userSrc} alt={copy.fanIdUserPhoto} />}</div>
              <div className="min-w-0 flex-1"><p className="font-bold">{copy.fanIdUserPhoto}</p><p className="mt-1 text-xs text-[#5e636d]">{recordFor({ kind: "user" }) ? copy.fanIdPhotoCustomLocal : copy.fanIdPhotoOriginal}</p></div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {userCropKinds.map((kind) => {
                const label = kind === "user-portrait" ? copy.fanIdUserPortrait : copy.fanIdUserAvatar;
                const key = `user:${kind}`;
                const record = recordFor({ kind: "user" });
                return <div key={kind}>
                  <input ref={(node) => { if (node) fileInputs.current.set(key, node); else fileInputs.current.delete(key); }} className="hidden" type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ""; if (file && restoreFocusRef.current) void choose({ kind: "user" }, kind, file, restoreFocusRef.current); }} />
                  <button type="button" onClick={(event) => launchChooser(key, event.currentTarget)} className="w-full rounded-lg border border-[#c8ccd2] px-2 py-1 text-xs font-bold">{copy.fanIdPhotoReplace} {label}</button>
                  {record?.crops[kind] && <button type="button" onClick={(event) => openExisting({ kind: "user" }, kind, event.currentTarget)} className="mt-2 w-full rounded-lg border border-[#c8ccd2] px-2 py-1 text-xs font-bold">{copy.fanIdPhotoAdjust} {label}</button>}
                </div>;
              })}
            </div>
            {recordFor({ kind: "user" }) && <button type="button" onClick={() => void media.remove({ kind: "user" })} className="mt-3 text-xs text-[#b4302b]">{copy.fanIdPhotoRemove}</button>}
          </div>
          {hasCustom && <button data-fanid-photo-clear-all type="button" onClick={() => { if (window.confirm(copy.fanIdPhotoRemoveAllConfirm)) void media.clearAll(); }} className="text-xs font-bold text-[#b4302b]">{copy.fanIdPhotoRemoveAll}</button>}
        </div>
      </details>

      <dialog ref={dialogRef} aria-labelledby="fanid-photo-editor-title" onCancel={(event) => { event.preventDefault(); if (!busy) clearDraft(); }} className="m-0 w-full max-w-lg rounded-t-2xl border border-[#c8ccd2] bg-white p-4 shadow-2xl backdrop:bg-black/40 max-sm:fixed max-sm:bottom-0 sm:fixed sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
        {draft?.sourceUrl && <><h2 id="fanid-photo-editor-title" data-fanid-photo-destination className="mb-3 text-sm font-bold text-[#1c1e24]">{dialogTitle}</h2><LocalPhotoEditor sourceUrl={draft.sourceUrl} cropKind={draft.cropKind} initialPreset={draft.sourceReplaced ? undefined : draft.existingRecord?.crops[draft.cropKind]} busy={busy} label={copy.fanIdPhotoUseFraming} error={error} onCancel={clearDraft} onConfirm={(preset) => void confirm(preset)} /></>}
      </dialog>
    </section>
  );
}
