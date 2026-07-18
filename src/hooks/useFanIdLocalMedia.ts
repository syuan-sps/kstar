"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  classifyFanIdStorageError,
  collectFanIdPreviewKinds,
  type FanIdMediaRecord,
  type FanIdMediaRole,
} from "@/lib/fanIdMedia";
import {
  getFanIdMediaRecord,
  putFanIdMediaRecord,
  removeAllFanIdMediaForCard,
  removeFanIdMediaRecord,
} from "@/lib/fanIdMediaStore";

type StorageErrorCode = "storage-unavailable" | "storage-full";

interface UseFanIdLocalMediaResult {
  status: "loading" | "ready" | "error";
  records: ReadonlyMap<string, FanIdMediaRecord>;
  idolPreviewSources: Readonly<Record<string, string>>;
  userPortraitSrc: string | null;
  userAvatarSrc: string | null;
  errorCode: StorageErrorCode | null;
  refresh: () => Promise<void>;
  save: (record: FanIdMediaRecord) => Promise<void>;
  remove: (role: FanIdMediaRole) => Promise<void>;
  clearAll: () => Promise<void>;
}

interface LocalMediaState {
  status: UseFanIdLocalMediaResult["status"];
  records: ReadonlyMap<string, FanIdMediaRecord>;
  idolPreviewSources: Readonly<Record<string, string>>;
  userPortraitSrc: string | null;
  userAvatarSrc: string | null;
  errorCode: StorageErrorCode | null;
}

const EMPTY_STATE: LocalMediaState = {
  status: "ready",
  records: new Map(),
  idolPreviewSources: {},
  userPortraitSrc: null,
  userAvatarSrc: null,
  errorCode: null,
};

export function previewBlobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read Fan ID preview"));
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Unable to read Fan ID preview"));
    };
    reader.readAsDataURL(blob);
  });
}

async function readPreviewSources(records: readonly FanIdMediaRecord[]): Promise<Pick<
  LocalMediaState,
  "idolPreviewSources" | "userPortraitSrc" | "userAvatarSrc"
>> {
  const previews = await Promise.allSettled(
    records.flatMap((record) =>
      collectFanIdPreviewKinds(record).map(async (kind) => ({
        record,
        kind,
        source: await previewBlobToDataUrl(record.previews[kind]!),
      })),
    ),
  );
  const idolPreviewSources: Record<string, string> = {};
  let userPortraitSrc: string | null = null;
  let userAvatarSrc: string | null = null;

  for (const preview of previews) {
    if (preview.status !== "fulfilled") continue;
    const { record, kind, source } = preview.value;
    if (record.role.kind === "idol" && kind === "idol-portrait") {
      idolPreviewSources[record.role.idolId] = source;
    }
    if (record.role.kind === "user" && kind === "user-portrait") userPortraitSrc = source;
    if (record.role.kind === "user" && kind === "user-avatar") userAvatarSrc = source;
  }

  return { idolPreviewSources, userPortraitSrc, userAvatarSrc };
}

export function useFanIdLocalMedia(input: {
  cardSerial: string | null;
  idolIds: readonly string[];
}): UseFanIdLocalMediaResult {
  const { cardSerial } = input;
  const idolIdsKey = input.idolIds.slice(0, 4).join("\u0000");
  const idolIds = useMemo(() => input.idolIds.slice(0, 4), [idolIdsKey]);
  const [state, setState] = useState<LocalMediaState>(EMPTY_STATE);

  const refresh = useCallback(async () => {
    if (cardSerial === null) {
      setState(EMPTY_STATE);
      return;
    }

    setState((current) => ({ ...current, status: "loading", errorCode: null }));
    try {
      const roles: FanIdMediaRole[] = [
        { kind: "user" },
        ...idolIds.map((idolId) => ({ kind: "idol" as const, idolId })),
      ];
      const records = (await Promise.all(
        roles.map((role) => getFanIdMediaRecord(cardSerial, role)),
      )).filter((record): record is FanIdMediaRecord => record !== null);
      const previewSources = await readPreviewSources(records);

      setState({
        status: "ready",
        records: new Map(records.map((record) => [record.key, record])),
        errorCode: null,
        ...previewSources,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        errorCode: classifyFanIdStorageError(error),
      }));
    }
  }, [cardSerial, idolIds]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(async (record: FanIdMediaRecord) => {
    if (cardSerial === null) return;
    try {
      await putFanIdMediaRecord(record);
      await refresh();
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        errorCode: classifyFanIdStorageError(error),
      }));
    }
  }, [cardSerial, refresh]);

  const remove = useCallback(async (role: FanIdMediaRole) => {
    if (cardSerial === null) return;
    try {
      await removeFanIdMediaRecord(cardSerial, role);
      await refresh();
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        errorCode: classifyFanIdStorageError(error),
      }));
    }
  }, [cardSerial, refresh]);

  const clearAll = useCallback(async () => {
    if (cardSerial === null) return;
    try {
      await removeAllFanIdMediaForCard(cardSerial);
      await refresh();
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        errorCode: classifyFanIdStorageError(error),
      }));
    }
  }, [cardSerial, refresh]);

  return { ...state, refresh, save, remove, clearAll };
}
