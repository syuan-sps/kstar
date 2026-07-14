// Shared PNG export for the share/report cards. Hardened for Tailwind v4 +
// Next 16: html-to-image otherwise embeds the ~22MB Noto Sans TC face and
// copies hundreds of inherited custom properties, which stalls rasterisation.

// Only the computed properties the cards actually render with — limiting the
// copy set skips Tailwind v4's --tw-*/@theme custom properties.
const EXPORT_STYLE_PROPS = [
  "display", "position", "top", "right", "bottom", "left", "box-sizing",
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
];

const DEFAULT_SHARE_TITLE = { zh: "我的追星靈魂", en: "My fan soul" };

export interface ExportOptions {
  fileName: string;
  pixelRatio?: number;
  kind?: "download" | "share";
  shareTitle?: string;
  shareText?: string;
  locale?: "zh" | "en";
}

// Renders `node` to a PNG and either Web-Shares the file or downloads it.
// Returns { ok:false } only when the image genuinely couldn't be produced
// (so the caller can show a "screenshot instead" hint). A cancelled share
// resolves ok:true.
export async function exportNode(node: HTMLElement, opts: ExportOptions): Promise<{ ok: boolean }> {
  const { fileName, pixelRatio = 2, kind = "download", shareText = "", locale = "zh" } = opts;
  const shareTitle = opts.shareTitle ?? DEFAULT_SHARE_TITLE[locale];
  try {
    const htmlToImage = await import("html-to-image");
    // Transparent canvas so the rounded card exports with see-through corners
    // (PNG alpha) instead of a filled square wedge behind the border radius.
    const o = {
      pixelRatio,
      backgroundColor: undefined,
      skipFonts: true,
      fontEmbedCSS: "",
      includeStyleProperties: EXPORT_STYLE_PROPS,
    };
    // Ensure photos are decoded, else html-to-image grabs a blank frame.
    await Promise.all(
      [...node.querySelectorAll("img")].map((im) =>
        im.complete && im.naturalWidth
          ? Promise.resolve()
          : new Promise<void>((res) => { im.onload = () => res(); im.onerror = () => res(); }),
      ),
    );
    // First render is often incomplete — retry a few times.
    let blob: Blob | null = null;
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
    if (!blob) return { ok: false };

    const file = new File([blob], fileName, { type: "image/png" });
    const canShareFiles =
      kind === "share" &&
      typeof navigator !== "undefined" &&
      navigator.canShare?.({ files: [file] });
    if (canShareFiles) {
      await navigator.share({ files: [file], title: shareTitle, text: shareText });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
    return { ok: true };
  } catch {
    // user cancelled the share sheet, or an unexpected error — not a hard fail.
    return { ok: true };
  }
}
