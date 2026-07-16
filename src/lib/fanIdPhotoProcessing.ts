import type { FanIdCropKind, FanIdCropPreset } from "./fanIdMedia";

export const MAX_FAN_ID_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_FAN_ID_SOURCE_PIXELS = 40_000_000;
export const MAX_FAN_ID_SOURCE_EDGE = 4096;
export const FAN_ID_OUTPUT_SIZE = {
  "idol-portrait": { width: 1200, height: 1365 },
  "user-portrait": { width: 1200, height: 1365 },
  "user-avatar": { width: 640, height: 640 },
} as const;

export type FanIdPhotoErrorCode =
  | "unsupported-type"
  | "file-too-large"
  | "decode-failed"
  | "decoded-image-too-large"
  | "canvas-unavailable"
  | "encode-failed";

export class FanIdPhotoError extends Error {
  constructor(public readonly code: FanIdPhotoErrorCode) {
    super(code);
    this.name = "FanIdPhotoError";
  }
}

export type FanIdPhotoValidation =
  | { ok: true }
  | { ok: false; code: "unsupported-type" | "file-too-large" };

type PhotoFile = Pick<Blob, "size" | "type">;

interface DecodedImage {
  image: CanvasImageSource;
  width: number;
  height: number;
  dispose(): void;
}

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateFanIdPhotoFile(file: PhotoFile): FanIdPhotoValidation {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) return { ok: false, code: "unsupported-type" };
  if (file.size > MAX_FAN_ID_FILE_BYTES) return { ok: false, code: "file-too-large" };
  return { ok: true };
}

function throwValidationError(validation: FanIdPhotoValidation): void {
  if (!validation.ok) throw new FanIdPhotoError(validation.code);
}

async function decodeImage(file: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        image: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => bitmap.close(),
      };
    } catch {
      // Some browsers do not support imageOrientation or a particular image codec.
    }
  }

  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw new FanIdPhotoError("decode-failed");
  }

  const objectUrl = URL.createObjectURL(file);
  const image = document.createElement("img");
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new FanIdPhotoError("decode-failed"));
      image.src = objectUrl;
    });
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error instanceof FanIdPhotoError ? error : new FanIdPhotoError("decode-failed");
  }

  return {
    image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    dispose: () => URL.revokeObjectURL(objectUrl),
  };
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  if (typeof document === "undefined") throw new FanIdPhotoError("canvas-unavailable");

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) throw new FanIdPhotoError("canvas-unavailable");
  return context;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function encodePreparedSource(canvas: HTMLCanvasElement): Promise<Blob> {
  const webp = await canvasToBlob(canvas, "image/webp", 0.9);
  if (webp?.type === "image/webp") return webp;

  const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.92);
  if (jpeg?.type === "image/jpeg") return jpeg;
  throw new FanIdPhotoError("encode-failed");
}

export async function prepareFanIdPhotoSource(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  throwValidationError(validateFanIdPhotoFile(file));

  const decoded = await decodeImage(file);
  try {
    if (decoded.width * decoded.height > MAX_FAN_ID_SOURCE_PIXELS) {
      throw new FanIdPhotoError("decoded-image-too-large");
    }
    if (decoded.width <= 0 || decoded.height <= 0) throw new FanIdPhotoError("decode-failed");

    const scale = Math.min(1, MAX_FAN_ID_SOURCE_EDGE / Math.max(decoded.width, decoded.height));
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));
    const canvas = createCanvas(width, height);
    getContext(canvas).drawImage(decoded.image, 0, 0, width, height);

    return { blob: await encodePreparedSource(canvas), width, height };
  } finally {
    decoded.dispose();
  }
}

export async function renderFanIdPhotoCrop(
  source: Blob,
  preset: FanIdCropPreset,
  kind: FanIdCropKind,
): Promise<Blob> {
  const decoded = await decodeImage(source);
  try {
    if (decoded.width <= 0 || decoded.height <= 0) throw new FanIdPhotoError("decode-failed");

    const output = FAN_ID_OUTPUT_SIZE[kind];
    const { x, y, width, height } = preset.croppedAreaPixels;
    const canvas = createCanvas(output.width, output.height);
    getContext(canvas).drawImage(
      decoded.image,
      x,
      y,
      width,
      height,
      0,
      0,
      output.width,
      output.height,
    );

    const blob = await canvasToBlob(canvas, "image/webp", 0.92);
    if (blob?.type !== "image/webp") throw new FanIdPhotoError("encode-failed");
    return blob;
  } finally {
    decoded.dispose();
  }
}
