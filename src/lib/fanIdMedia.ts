export type FanIdCardMode = "idol" | "idol-user" | "user";

export type FanIdMediaRole =
  | { kind: "idol"; idolId: string }
  | { kind: "user" };

export type FanIdCropKind = "idol-portrait" | "user-portrait" | "user-avatar";

export interface FanIdCropPreset {
  crop: { x: number; y: number };
  zoom: number;
  croppedAreaPixels: { x: number; y: number; width: number; height: number };
}

export interface FanIdMediaRecord {
  key: string;
  cardSerial: string;
  role: FanIdMediaRole;
  source: Blob;
  sourceWidth: number;
  sourceHeight: number;
  crops: Partial<Record<FanIdCropKind, FanIdCropPreset>>;
  previews: Partial<Record<FanIdCropKind, Blob>>;
  updatedAt: number;
}

export interface ResolvedFanIdCardPhotos {
  portraitSrc: string | null;
  avatarSrc: string | null;
  photoRequired: boolean;
}

export interface ResolveFanIdCardPhotosInput {
  mode: FanIdCardMode;
  catalogIdolSrc: string | null;
  idolOverrideSrc: string | null;
  userPortraitSrc: string | null;
  userAvatarSrc: string | null;
}

const CARD_SERIAL_PATTERN = /^[A-Za-z0-9-]{1,32}$/;
const IDOL_ID_PATTERN = /^[A-Za-z0-9-]{1,128}$/;
const CROP_KINDS: readonly FanIdCropKind[] = [
  "idol-portrait",
  "user-portrait",
  "user-avatar",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

function isValidCardSerial(cardSerial: string): boolean {
  return CARD_SERIAL_PATTERN.test(cardSerial);
}

function isValidIdolId(idolId: string): boolean {
  return IDOL_ID_PATTERN.test(idolId);
}

function isFanIdMediaRole(value: unknown): value is FanIdMediaRole {
  if (!isRecord(value) || typeof value.kind !== "string") return false;

  if (value.kind === "user") return Object.keys(value).every((key) => key === "kind");

  return value.kind === "idol" && typeof value.idolId === "string" && isValidIdolId(value.idolId);
}

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function isValidCropMap(value: unknown): value is Partial<Record<FanIdCropKind, FanIdCropPreset>> {
  if (!isRecord(value)) return false;

  return Object.entries(value).every(
    ([kind, preset]) => CROP_KINDS.includes(kind as FanIdCropKind) && isFanIdCropPreset(preset),
  );
}

function isValidPreviewMap(value: unknown): value is Partial<Record<FanIdCropKind, Blob>> {
  if (!isRecord(value)) return false;

  return Object.entries(value).every(
    ([kind, preview]) => CROP_KINDS.includes(kind as FanIdCropKind) && isBlob(preview),
  );
}

export function makeFanIdMediaKey(cardSerial: string, role: FanIdMediaRole): string {
  if (!isValidCardSerial(cardSerial)) throw new Error("Invalid Fan ID card serial");
  if (!isFanIdMediaRole(role)) throw new Error("Invalid Fan ID media role");

  return role.kind === "idol"
    ? `fanid:${cardSerial}:idol:${role.idolId}`
    : `fanid:${cardSerial}:user`;
}

export function isFanIdCropPreset(value: unknown): value is FanIdCropPreset {
  if (!isRecord(value) || !isRecord(value.crop) || !isRecord(value.croppedAreaPixels)) return false;

  const { crop, zoom, croppedAreaPixels } = value;
  return (
    isFiniteNumber(crop.x) &&
    isFiniteNumber(crop.y) &&
    isFiniteNumber(zoom) &&
    zoom >= 1 &&
    zoom <= 3 &&
    isFiniteNumber(croppedAreaPixels.x) &&
    isFiniteNumber(croppedAreaPixels.y) &&
    isPositiveInteger(croppedAreaPixels.width) &&
    isPositiveInteger(croppedAreaPixels.height)
  );
}

export function isFanIdMediaRecord(value: unknown): value is FanIdMediaRecord {
  if (!isRecord(value)) return false;
  if (
    typeof value.key !== "string" ||
    typeof value.cardSerial !== "string" ||
    !isValidCardSerial(value.cardSerial) ||
    !isFanIdMediaRole(value.role) ||
    !isBlob(value.source) ||
    !isPositiveInteger(value.sourceWidth) ||
    !isPositiveInteger(value.sourceHeight) ||
    !isValidCropMap(value.crops) ||
    !isValidPreviewMap(value.previews) ||
    !isFiniteNumber(value.updatedAt)
  ) {
    return false;
  }

  return value.key === makeFanIdMediaKey(value.cardSerial, value.role);
}

export function classifyFanIdStorageError(error: unknown): "storage-full" | "storage-unavailable" {
  return isRecord(error) && error.name === "QuotaExceededError"
    ? "storage-full"
    : "storage-unavailable";
}

export function cropAspect(kind: FanIdCropKind): number {
  return kind === "user-avatar" ? 1 : 4 / 4.55;
}

export function resolveFanIdCardPhotos(
  input: ResolveFanIdCardPhotosInput,
): ResolvedFanIdCardPhotos {
  const idolPortraitSrc = input.idolOverrideSrc ?? input.catalogIdolSrc;

  if (input.mode === "idol") {
    return { portraitSrc: idolPortraitSrc, avatarSrc: null, photoRequired: false };
  }

  if (input.mode === "idol-user") {
    return {
      portraitSrc: idolPortraitSrc,
      avatarSrc: input.userAvatarSrc,
      photoRequired: input.userAvatarSrc === null,
    };
  }

  return {
    portraitSrc: input.userPortraitSrc,
    avatarSrc: null,
    photoRequired: input.userPortraitSrc === null,
  };
}
