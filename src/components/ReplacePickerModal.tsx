"use client";

// 替換人生四格 — opened by the 圖鑑 「＋」. Shows the newcomer above the user's
// current four-cut strip and lets them tap whichever cut to swap out. Portaled to
// document.body (a fixed modal inside a transformed ancestor would collapse).

import { createPortal } from "react-dom";
import type { CardArtist } from "@/lib/lite";
import { getGroupSymbol } from "@/lib/groupSymbols";
import Thumb from "@/components/Thumb";
import { useCopy } from "@/lib/i18n/LocaleProvider";

// One photobooth cut (matches FourCuts' visual exactly), no link/group of its own.
function CutInner({ a }: { a: CardArtist }) {
  const sym = getGroupSymbol(a.group);
  return (
    <div className="relative block aspect-[3/4] overflow-hidden rounded-lg ring-1 ring-white/10">
      <Thumb src={a.image_url} seed={a.id} label={a.name} rounded="rounded-lg" focusY={a.image_focus} />
      <span
        className={`frame-symbol${sym.length > 2 ? " frame-symbol--long" : ""} pointer-events-none absolute right-1 top-1 text-white/80 drop-shadow`}
        style={{ fontSize: sym.length > 2 ? 9 : 13 }}
      >
        {sym}
      </span>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1.5 pt-4 pb-1">
        <div className="truncate font-orbitron text-[11px] font-bold leading-tight text-white">{a.name}</div>
        {a.name_zh && a.name_zh !== a.name && <div className="truncate text-[9px] text-white/70">{a.name_zh}</div>}
      </div>
    </div>
  );
}

export default function ReplacePickerModal({
  newcomer, current, onPick, onClose,
}: {
  newcomer: CardArtist;
  current: CardArtist[];
  onPick: (slotIndex: number) => void;
  onClose: () => void;
}) {
  const copy = useCopy();
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="window-frame w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="title-bar">
          <span className="mr-1.5 text-base">✦</span>
          <span className="flex-1 truncate font-orbitron text-xs font-bold tracking-wide">{copy.swapTitle}</span>
          <span className="win-btn win-btn-close" onClick={onClose} style={{ cursor: "pointer" }}>×</span>
        </div>
        <div className="window-body p-5">
          {/* who's coming in */}
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#c8ccd2]/50 bg-white/70 p-2.5">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-[#c8ccd2]">
              <Thumb src={newcomer.image_url} seed={newcomer.id} label={newcomer.name} rounded="rounded-lg" focusY={newcomer.image_focus} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9aa0aa]">{copy.swapIncoming}</div>
              <div className="truncate text-sm font-black text-[#1c1e24]">{newcomer.name}</div>
              {newcomer.name_zh && newcomer.name_zh !== newcomer.name && (
                <div className="truncate text-[11px] text-[#7c8088]">{newcomer.name_zh}</div>
              )}
            </div>
          </div>

          <p className="mb-2 text-center text-xs font-bold text-[#5e636d]">{copy.swapPrompt}</p>

          {/* current four cuts — each tappable to swap out */}
          <div className="rounded-[22px] border-2 border-[#aeb3bb] bg-[#e9ebee] p-3 shadow-[5px_5px_0_rgba(124,128,136,0.3)]">
            <div className="grid grid-cols-2 gap-1.5">
              {current.map((a, i) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onPick(i)}
                  aria-label={`${copy.swapThisCut}: ${a.name} → ${newcomer.name}`}
                  className="group relative block w-full rounded-lg text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b4302b]"
                >
                  <CutInner a={a} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-lg bg-[#b4302b]/0 opacity-0 transition group-hover:bg-[#b4302b]/70 group-hover:opacity-100">
                    <span className="text-lg text-white">↺</span>
                    <span className="font-orbitron text-[10px] font-black tracking-wide text-white">{copy.swapThisCut}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-2.5 flex items-center justify-center gap-1.5 font-orbitron text-[10px] font-bold tracking-[0.25em] text-[#7c8088]">
              <span>✦</span><span>KStar · 2026</span><span>✦</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full rounded-full border border-[#c8ccd2] bg-white py-2 text-xs font-bold text-[#5e636d] transition hover:bg-[#7c8088]/10"
          >
            {copy.cancel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
