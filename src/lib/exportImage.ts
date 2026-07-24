// Shared PNG export for the share/report cards. Hardened for Tailwind v4 +
// Next 16: html-to-image otherwise embeds the ~22MB Noto Sans TC face and
// copies hundreds of inherited custom properties, which stalls rasterisation.

// Only the computed properties the cards actually render with — limiting the
// copy set skips Tailwind v4's --tw-*/@theme custom properties.
export const EXPORT_STYLE_PROPS = [
  "display", "position", "top", "right", "bottom", "left", "box-sizing",
  // Without "visibility" an element carrying Tailwind's `invisible` keeps its
  // absolute position in the clone but loses the thing hiding it, so it renders
  // on top of whatever it was parked over. Never drop it from this allowlist.
  "visibility",
  "z-index",
  "width", "height", "min-width", "max-width", "min-height", "max-height",
  "margin-top", "margin-right", "margin-bottom", "margin-left",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "flex-grow", "flex-shrink", "flex-basis", "flex-direction", "flex-wrap",
  "align-items", "justify-content", "gap", "column-gap", "row-gap", "grid-template-columns",
  "aspect-ratio", "overflow", "overflow-x", "overflow-y",
  "background-color", "background-image", "background-size", "background-position", "background-repeat",
  "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
  "border-top-style", "border-right-style", "border-bottom-style", "border-left-style",
  "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
  "border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius",
  "box-shadow", "opacity", "color",
  "font-family", "font-size", "font-weight", "font-style", "letter-spacing", "line-height",
  "text-align", "text-overflow", "white-space", "text-shadow", "text-transform",
  "object-fit", "object-position", "transform", "transform-origin",
  // Tailwind v4 compiles translate/rotate/scale utilities to the STANDALONE CSS
  // properties, not to `transform` — so copying only "transform" silently drops
  // them. This is why `-translate-x-1/2` centring shifted in exported PNGs.
  "translate", "rotate", "scale",
];

const DEFAULT_SHARE_TITLE = { zh: "我的追星靈魂", en: "My fan soul" };

export interface ExportOptions {
  fileName: string;
  pixelRatio?: number;
  kind?: "download" | "share";
  shareTitle?: string;
  shareText?: string;
  frame?: { w: number; h: number; bg: string };
  locale?: "zh" | "en";
}

// Post-render hook only: without a frame the original blob object is returned,
// preserving the established export path exactly. A frame composites the PNG
// onto the requested canvas after the hardened render/retry has succeeded.
export async function prepareExportBlob(
  blob: Blob,
  frame?: ExportOptions["frame"],
): Promise<Blob> {
  if (!frame) return blob;
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const candidate = new Image();
      candidate.onload = () => resolve(candidate);
      candidate.onerror = () => reject(new Error("image decode failed"));
      candidate.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = frame.w;
    canvas.height = frame.h;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas unavailable");
    context.fillStyle = frame.bg;
    context.fillRect(0, 0, frame.w, frame.h);
    const scale = (frame.w * 0.78) / image.width;
    const width = image.width * scale;
    const height = image.height * scale;
    context.drawImage(image, (frame.w - width) / 2, (frame.h - height) / 2, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error("PNG encoding failed")), "image/png");
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type ExportBlobResult =
  | { ok: true; blob: Blob }
  | { ok: false; error: unknown };

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
    || Boolean(error && typeof error === "object" && "name" in error && error.name === "AbortError");
}

// Which card an export came from, derived from its file name (one map, so the
// analytics event is labelled without threading a prop through every call site).
function cardFromFileName(fileName: string): string {
  if (fileName.includes("fourcut")) return "fourcut";
  if (fileName.includes("report")) return "report";
  if (fileName.includes("fanid")) return "fanid";
  return "story";
}

// Fire a Vercel Web Analytics custom event. Records the ACTUAL action taken
// (a "share" that falls back to a download is counted as a download). A cancelled
// share never reaches here. Import is dynamic so a failed load never breaks export.
function trackExport(action: "download" | "share", fileName: string): void {
  if (typeof window === "undefined") return;
  const card = cardFromFileName(fileName);
  import("@vercel/analytics").then(({ track }) => {
    track("export", { action, card });
  }).catch(() => { /* analytics is best-effort, never block the export */ });

  // Durable, queryable counterpart to the Vercel Analytics event above (see
  // src/app/api/track-export/route.ts). keepalive lets the request survive a
  // page navigation that happens right after the download/share click; the
  // catch keeps this best-effort, exactly like the analytics call.
  try {
    fetch("/api/track-export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ card, action, locale: document.documentElement.lang || null }),
      keepalive: true,
    }).catch(() => { /* tracking is best-effort, never block the export */ });
  } catch {
    /* best-effort, never block the export */
  }
}

export async function completeExport(
  blob: Blob,
  opts: Pick<ExportOptions, "fileName" | "kind" | "shareTitle" | "shareText">,
): Promise<{ ok: boolean; error?: unknown }> {
  const { fileName, kind = "download", shareTitle = "我的追星靈魂", shareText = "" } = opts;
  try {
    const file = new File([blob], fileName, { type: "image/png" });
    const canShareFiles = kind === "share"
      && typeof navigator !== "undefined"
      && navigator.canShare?.({ files: [file] });
    if (canShareFiles) {
      await navigator.share({ files: [file], title: shareTitle, text: shareText });
      trackExport("share", fileName); // only reached when the share wasn't cancelled
    } else {
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
      } finally {
        URL.revokeObjectURL(url);
      }
      trackExport("download", fileName);
    }
    return { ok: true };
  } catch (error) {
    return isAbortError(error) ? { ok: true } : { ok: false, error };
  }
}

// Framing is the only newly authorized stage with distinct failure semantics.
// Keeping its catch here prevents decode/canvas/encoding failures from reaching
// exportNode's legacy catch, where share cancellation intentionally means ok.
export async function prepareExportBlobResult(
  blob: Blob,
  frame?: ExportOptions["frame"],
): Promise<ExportBlobResult> {
  if (!frame) return { ok: true, blob };
  try {
    return { ok: true, blob: await prepareExportBlob(blob, frame) };
  } catch (error) {
    return { ok: false, error };
  }
}

// Renders `node` to a PNG and either Web-Shares the file or downloads it.
// Returns { ok:false } only when the image genuinely couldn't be produced
// (so the caller can show a "screenshot instead" hint). A cancelled share
// resolves ok:true.
export async function exportNode(node: HTMLElement, opts: ExportOptions): Promise<{ ok: boolean; error?: unknown }> {
  const { fileName, pixelRatio = 2, kind = "download", shareText = "", frame, locale = "zh" } = opts;
  const shareTitle = opts.shareTitle ?? DEFAULT_SHARE_TITLE[locale];
  // Screen-only affordances (the "take the quiz" invitation on a quiz-free card,
  // the parked archetype block in photo-only) are pulled from the LIVE node
  // before anything is measured. Filtering them out of the clone alone left the
  // canvas sized for the taller card, i.e. a blank gap where they had been.
  // Restored in the finally below, so an export failure can't leave them hidden.
  const screenOnly = [...node.querySelectorAll<HTMLElement>('[data-export-hide="true"]')];
  const priorDisplay = screenOnly.map((el) => el.style.display);
  screenOnly.forEach((el) => { el.style.display = "none"; });

  try {
    const htmlToImage = await import("html-to-image");
    // Transparent canvas so the rounded card exports with see-through corners
    // (PNG alpha) instead of a filled square wedge behind the border radius.
    // The PAD margin keeps the corners/border off the canvas clip edge (no
    // jaggies) and gives box-shadows room to fade out instead of being cropped.
    const PAD = 40;
    const o = {
      pixelRatio,
      backgroundColor: undefined,
      skipFonts: true,
      fontEmbedCSS: "",
      includeStyleProperties: EXPORT_STYLE_PROPS,
      // Screen-only affordances (e.g. the "take the quiz" invitation on a
      // quiz-free card) opt out of the export — nobody wants a pitch baked into
      // the image they share. Text nodes have no dataset and must pass through.
      filter: (domNode: HTMLElement) => domNode.dataset?.exportHide !== "true",
      // width/height enlarge the canvas; html-to-image also copies them onto the
      // cloned node as inline styles, so style{} (applied last) pins the clone
      // back to its true size and centres it with the margin.
      width: node.offsetWidth + PAD * 2,
      height: node.offsetHeight + PAD * 2,
      style: {
        width: `${node.offsetWidth}px`,
        height: `${node.offsetHeight}px`,
        margin: `${PAD}px`,
        // A transparent-background PNG must not carry the on-screen drop
        // shadow: `0 28px 64px` bleeds a grey haze across the whole PAD ring,
        // so the "transparent" margin lands at alpha 1-63 instead of 0 and
        // shows as a halo on any coloured backdrop. Framed exports composite
        // onto a filled canvas, so they keep the shadow. The crisp 1px ring is
        // preserved either way so the card keeps its defined edge.
        ...(frame ? {} : { boxShadow: "0 1px 0 rgba(255,255,255,.9), 0 0 0 1px rgba(28,30,36,.42)" }),
      },
    };
    // Ensure photos are decoded, else html-to-image grabs a blank frame.
    await Promise.all(
      [...node.querySelectorAll("img")].map((im) =>
        im.complete && im.naturalWidth
          ? Promise.resolve()
          : new Promise<void>((res) => { im.onload = () => res(); im.onerror = () => res(); }),
      ),
    );
    // Reveal export-only content (e.g. the story card's "測你的追星靈魂 →" invite,
    // which is aimed at whoever RECEIVES the shared PNG, not the owner viewing it
    // on screen). Hidden with inline display:none normally; shown just for capture.
    const exportOnly = [...node.querySelectorAll<HTMLElement>("[data-export-only]")];
    exportOnly.forEach((el) => { el.style.display = el.dataset.exportDisplay ?? "block"; });
    // First render is often incomplete — retry a few times.
    let blob: Blob | null = null;
    try {
      for (let attempt = 0; attempt < 3 && !blob; attempt++) {
        try {
          const dataUrl = await Promise.race([
            htmlToImage.toPng(node, o),
            new Promise<string>((_, rej) => setTimeout(() => rej(new Error("timeout")), 12000)),
          ]);
          const b = await (await fetch(dataUrl)).blob();
          if (b && b.size > 5000) blob = b;
        } catch {
          /* retry */
        }
      }
    } finally {
      exportOnly.forEach((el) => { el.style.display = "none"; });
    }
    if (!blob) return { ok: false };
    if (frame) {
      const prepared = await prepareExportBlobResult(blob, frame);
      if (!prepared.ok) return { ok: false, error: prepared.error };
      blob = prepared.blob;
    }

    return completeExport(blob, { fileName, kind, shareTitle, shareText });
  } catch (error) {
    return { ok: false, error };
  } finally {
    screenOnly.forEach((el, i) => { el.style.display = priorDisplay[i]; });
  }
}
