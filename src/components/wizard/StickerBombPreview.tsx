type StickerBombPreviewProps = {
  enabled: boolean;
};

export function StickerBombPreview({ enabled }: StickerBombPreviewProps) {
  return (
    <span
      aria-hidden="true"
      data-sticker-toggle-thumbnail
      className={`relative h-10 w-8 overflow-hidden rounded-[11px] border shadow-[inset_0_1px_0_rgba(255,255,255,.75)] ${enabled ? "border-[#b4302b]/35 bg-[linear-gradient(180deg,rgba(255,255,255,.92),rgba(180,48,43,.08))]" : "border-[#c8ccd2] bg-[linear-gradient(180deg,#ffffff,#f4f5f7)]"}`}
    >
      <span className="absolute inset-[3px] rounded-[8px] border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,.88),rgba(28,30,36,.04))]" />
      <span className="absolute inset-x-1.5 top-1.5 h-1 rounded-full bg-black/10" />
      <span className="absolute inset-x-1 bottom-1.5 h-4 rounded-[5px] border border-black/5 bg-black/[0.055]" />
      {enabled && (
        <>
          <span data-sticker-toggle-thumb-accent className="absolute left-0.5 top-1 h-2.5 w-2.5 rounded-full border border-white/80 bg-[#ffd6ea] shadow-[0_1px_3px_rgba(180,48,43,.18)]" />
          <span data-sticker-toggle-thumb-accent className="absolute right-0 top-3 block h-2 w-2 rotate-12 rounded-[4px] border border-white/70 bg-[#fff0a8] shadow-[0_1px_3px_rgba(28,30,36,.18)]" />
          <span data-sticker-toggle-thumb-accent className="absolute bottom-1 right-0.5 h-2 w-2 rounded-full border border-white/80 bg-[#cfd9ff] shadow-[0_1px_3px_rgba(28,30,36,.16)]" />
        </>
      )}
    </span>
  );
}
