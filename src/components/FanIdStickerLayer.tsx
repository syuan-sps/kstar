import { useId, type ReactNode } from "react";
import {
  getStickerComposition,
  resolveStickerThemeId,
  type StickerKind,
  type StickerPlacement,
  type StickerThemeId,
} from "@/lib/fanIdStickers";

type Props = {
  themeId?: string | null;
  enabled: boolean;
  layer?: StickerPlacement["layer"];
};

type StickerPaint = {
  readonly fill: string;
  readonly stroke: string;
  readonly detail: string;
  readonly accent: string;
  readonly fillOpacity?: number;
};

type SvgIds = ReturnType<typeof buildSvgIds>;

const SPARKLE_PATH =
  "M0 -10 C1.4 -3.6 3.6 -1.4 10 0 C3.6 1.4 1.4 3.6 0 10 C-1.4 3.6 -3.6 1.4 -10 0 C-3.6 -1.4 -1.4 -3.6 0 -10 Z";

export default function FanIdStickerLayer({ themeId, enabled, layer }: Props) {
  const idPrefix = useId().replace(/:/g, "");

  if (!enabled) {
    return null;
  }

  const placements = layer
    ? getStickerComposition(themeId).filter((placement) => placement.layer === layer)
    : getStickerComposition(themeId);
  const resolvedThemeId = resolveStickerThemeId(themeId) ?? "chrome";
  const ids = buildSvgIds(idPrefix);

  if (placements.length === 0) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      data-fanid-sticker-contract="two-pass"
      data-fanid-sticker-layer={layer ?? "all"}
      className={`pointer-events-none absolute inset-0 h-full w-full overflow-hidden ${
        layer === "under-content" ? "z-0" : "z-20"
      }`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      focusable="false"
      overflow="hidden"
      style={{ overflow: "hidden" }}
    >
      <defs>
        <filter id={ids.shadow} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0.3" dy="0.8" stdDeviation="0.7" floodColor="#1c1e24" floodOpacity=".28" />
        </filter>
        <linearGradient id={ids.chromeFill} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".45" stopColor="#aeb7c2" />
          <stop offset=".7" stopColor="#ffffff" />
          <stop offset="1" stopColor="#59636f" />
        </linearGradient>
        <radialGradient id={ids.pearlFill} cx=".32" cy=".28" r=".95">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".48" stopColor="#f9f7fb" />
          <stop offset=".78" stopColor="#dbe3f1" />
          <stop offset="1" stopColor="#b8c5d8" />
        </radialGradient>
        <linearGradient id={ids.dreamyGlow} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fdfcff" />
          <stop offset=".5" stopColor="#dae7ff" />
          <stop offset="1" stopColor="#c6bff3" />
        </linearGradient>
        <linearGradient id={ids.dreamyCloud} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".55" stopColor="#eef0ff" />
          <stop offset="1" stopColor="#d5dcfb" />
        </linearGradient>
        <radialGradient id={ids.dreamyBubble} cx=".34" cy=".28" r=".9">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".98" />
          <stop offset=".45" stopColor="#f4f8ff" stopOpacity=".92" />
          <stop offset=".8" stopColor="#d6e5ff" stopOpacity=".72" />
          <stop offset="1" stopColor="#c6c4f4" stopOpacity=".5" />
        </radialGradient>
        <linearGradient id={ids.kawaiiCandy} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff8fd" />
          <stop offset=".4" stopColor="#ffd0e4" />
          <stop offset=".78" stopColor="#f6a9c7" />
          <stop offset="1" stopColor="#d98fb8" />
        </linearGradient>
        <linearGradient id={ids.kawaiiResin} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".42" stopColor="#ffe0f0" />
          <stop offset=".7" stopColor="#f6c0e1" />
          <stop offset="1" stopColor="#d18ac0" />
        </linearGradient>
        <linearGradient id={ids.kawaiiGloss} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fffef9" />
          <stop offset=".34" stopColor="#fff1a8" />
          <stop offset=".7" stopColor="#8cc6ff" />
          <stop offset="1" stopColor="#6b92e6" />
        </linearGradient>
        <linearGradient id={ids.monoBlack} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6a6a6a" />
          <stop offset=".4" stopColor="#1f1f1f" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <linearGradient id={ids.monoBlackChrome} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d6d6d6" />
          <stop offset=".25" stopColor="#2f2f2f" />
          <stop offset=".6" stopColor="#8a8a8a" />
          <stop offset="1" stopColor="#111111" />
        </linearGradient>
        <pattern id={ids.monoGingham} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="#f8f7f4" />
          <rect width="2" height="2" fill="#4f4f4f" />
          <rect x="2" y="2" width="2" height="2" fill="#4f4f4f" />
        </pattern>
      </defs>
      {placements.map((placement) => (
        <g
          key={placement.id}
          transform={`translate(${placement.x} ${placement.y}) rotate(${placement.rotate})`}
          filter={`url(#${ids.shadow})`}
        >
          {renderStickerShape(placement, resolvedThemeId, ids)}
        </g>
      ))}
    </svg>
  );
}

function renderStickerShape(
  placement: StickerPlacement,
  themeId: StickerThemeId,
  ids: SvgIds,
): ReactNode {
  const paint = getStickerPaint(themeId, placement, ids);
  const scale = placement.size / 20;

  return (
    <g
      transform={`scale(${scale})`}
      strokeLinecap="round"
      strokeLinejoin="round"
      fillOpacity={paint.fillOpacity ?? 1}
    >
      {renderStickerByKind(placement.kind, paint)}
    </g>
  );
}

function renderStickerByKind(kind: StickerKind, paint: StickerPaint): ReactNode {
  switch (kind) {
    case "heart":
      return (
        <>
          <path
            d="M0 8.8 C-6.1 4.6 -9.2 0.6 -8.5 -4 C-7.9 -7.6 -4.2 -9.2 -0.6 -6.2 C-0.2 -5.9 -0.1 -5.8 0 -5.7 C0.1 -5.8 0.2 -5.9 0.6 -6.2 C4.2 -9.2 7.9 -7.6 8.5 -4 C9.2 0.6 6.1 4.6 0 8.8 Z"
            fill={paint.fill}
            stroke={paint.stroke}
            strokeWidth={1.1}
          />
          <path d="M-4.8 -3.1 C-3.7 -5.8 -1.7 -6.9 0.1 -6.5" fill="none" stroke={paint.detail} strokeOpacity=".78" strokeWidth=".9" />
        </>
      );
    case "star":
      return (
        <>
          <path
            d="M0 -9.6 L2.8 -3.4 L9.4 -2.6 L4.2 1.7 L5.8 8.6 L0 5.1 L-5.8 8.6 L-4.2 1.7 L-9.4 -2.6 L-2.8 -3.4 Z"
            fill={paint.fill}
            stroke={paint.stroke}
            strokeWidth={1.05}
          />
          <path d="M-1.5 -6.6 L0 -3.8 L3.7 -3.3" fill="none" stroke={paint.detail} strokeOpacity=".74" strokeWidth=".85" />
        </>
      );
    case "bow":
      return (
        <>
          <path d="M-1.8 -0.4 C-4.5 -5.5 -8.7 -7.4 -9.5 -3.5 C-10.1 -0.8 -7.4 1.1 -2.4 2.2 Z" fill={paint.fill} stroke={paint.stroke} strokeWidth={1.05} />
          <path d="M1.8 -0.4 C4.5 -5.5 8.7 -7.4 9.5 -3.5 C10.1 -0.8 7.4 1.1 2.4 2.2 Z" fill={paint.fill} stroke={paint.stroke} strokeWidth={1.05} />
          <path d="M-2.2 2 L-6.8 8.4 L-2.4 7.1 L0 3.6 Z" fill={paint.fill} stroke={paint.stroke} strokeWidth={1.05} />
          <path d="M2.2 2 L6.8 8.4 L2.4 7.1 L0 3.6 Z" fill={paint.fill} stroke={paint.stroke} strokeWidth={1.05} />
          <rect x="-2.4" y="-2.6" width="4.8" height="5.2" rx="1.8" fill={paint.accent} stroke={paint.stroke} strokeWidth=".9" />
          <path d="M-6.7 -2.5 C-5 -4.4 -3.6 -4.6 -1.7 -3.7" fill="none" stroke={paint.detail} strokeOpacity=".72" strokeWidth=".8" />
          <path d="M6.7 -2.5 C5 -4.4 3.6 -4.6 1.7 -3.7" fill="none" stroke={paint.detail} strokeOpacity=".72" strokeWidth=".8" />
        </>
      );
    case "moon":
      return (
        <>
          <path
            d="M4.6 -9 A8.8 8.8 0 1 0 4.6 9 A6 6 0 1 1 4.6 -9 Z"
            fill={paint.fill}
            fillRule="evenodd"
            stroke={paint.stroke}
            strokeWidth={1.05}
          />
          <path d="M2.7 -6.8 A6 6 0 0 0 2.7 6.8" fill="none" stroke={paint.detail} strokeOpacity=".74" strokeWidth=".8" />
        </>
      );
    case "cloud":
      return (
        <>
          <path
            d="M-8 2.6 C-8.2 -1.4 -5.7 -4.4 -2.5 -4.4 C-1.4 -7.1 1.3 -8.3 4 -7.2 C6.4 -6.1 7.9 -3.7 7.9 -1.3 C9.5 -0.7 10.4 0.5 10.4 2.2 C10.4 4.8 8.1 6.8 5.1 6.8 H-5.7 C-8.7 6.8 -10.7 5.1 -10.7 2.8 C-10.7 1.1 -9.6 -0.3 -8 0.1 Z"
            fill={paint.fill}
            stroke={paint.stroke}
            strokeWidth={1.05}
          />
          <path d="M-4.8 -1.1 C-2.7 -4.6 0.7 -4.8 3.9 -3.2" fill="none" stroke={paint.detail} strokeOpacity=".7" strokeWidth=".8" />
        </>
      );
    case "pearl":
      return (
        <>
          <circle cx="0" cy="0" r="5.4" fill={paint.fill} stroke={paint.stroke} strokeWidth="1" />
          <circle cx="-1.8" cy="-2.1" r="1.6" fill={paint.detail} fillOpacity=".9" />
          <circle cx="1.9" cy="1.8" r=".95" fill={paint.accent} fillOpacity=".18" />
        </>
      );
    case "sparkle":
      return (
        <>
          <path d={SPARKLE_PATH} fill={paint.fill} stroke={paint.stroke} strokeWidth={1} />
          <path d="M0 -6.8 C0.8 -2.6 2.5 -0.9 6.8 0" fill="none" stroke={paint.detail} strokeOpacity=".78" strokeWidth=".82" />
        </>
      );
    case "chain":
      return (
        <>
          <g transform="rotate(-18)">
            <rect x="-9" y="-4.4" width="10.8" height="8.8" rx="4.4" fill={paint.fill} fillOpacity=".24" stroke={paint.stroke} strokeWidth="2.1" />
            <rect x="-1.8" y="-4.4" width="10.8" height="8.8" rx="4.4" fill={paint.fill} fillOpacity=".24" stroke={paint.stroke} strokeWidth="2.1" />
            <path d="M-7.2 -2.4 C-5.4 -3.9 -3.1 -4.2 -1.2 -2.8" fill="none" stroke={paint.detail} strokeOpacity=".56" strokeWidth=".8" />
            <path d="M0 2.8 C2.1 4 4.8 3.8 6.7 2.1" fill="none" stroke={paint.detail} strokeOpacity=".56" strokeWidth=".8" />
          </g>
        </>
      );
    case "butterfly":
      return (
        <>
          <path d="M0 -0.2 C-1.7 -5.5 -6.9 -8.5 -9 -5.2 C-10.6 -2.6 -9 1.7 -5.6 3.7 C-3.7 4.8 -1.3 4.4 0 -0.2 Z" fill={paint.fill} stroke={paint.stroke} strokeWidth="1.02" />
          <path d="M0 -0.2 C1.7 -5.5 6.9 -8.5 9 -5.2 C10.6 -2.6 9 1.7 5.6 3.7 C3.7 4.8 1.3 4.4 0 -0.2 Z" fill={paint.fill} stroke={paint.stroke} strokeWidth="1.02" />
          <path d="M-0.1 0.2 C-1.3 4.8 -3.5 8.4 -5.7 8 C-8.4 7.5 -7.5 3.7 -4.7 2.2 C-3.2 1.4 -1.4 1.2 -0.1 0.2 Z" fill={paint.fill} stroke={paint.stroke} strokeWidth="1.02" />
          <path d="M0.1 0.2 C1.3 4.8 3.5 8.4 5.7 8 C8.4 7.5 7.5 3.7 4.7 2.2 C3.2 1.4 1.4 1.2 0.1 0.2 Z" fill={paint.fill} stroke={paint.stroke} strokeWidth="1.02" />
          <path d="M0 -6.7 C1.2 -5.1 1.3 4.7 0 8" fill="none" stroke={paint.accent} strokeWidth="1.3" />
          <path d="M-0.4 -6.7 C-1.8 -9 -3.4 -9.7 -4.9 -9.5" fill="none" stroke={paint.stroke} strokeWidth=".72" />
          <path d="M0.4 -6.7 C1.8 -9 3.4 -9.7 4.9 -9.5" fill="none" stroke={paint.stroke} strokeWidth=".72" />
        </>
      );
    case "flower":
      return (
        <>
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cx="0"
              cy="-5.4"
              rx="3.2"
              ry="5"
              transform={`rotate(${angle})`}
              fill={paint.fill}
              stroke={paint.stroke}
              strokeWidth=".95"
            />
          ))}
          <circle cx="0" cy="0" r="2.8" fill={paint.accent} stroke={paint.stroke} strokeWidth=".8" />
          <circle cx="-0.8" cy="-1" r=".95" fill={paint.detail} fillOpacity=".82" />
        </>
      );
    case "cat":
      return (
        <>
          <path
            d="M-8.2 -1.2 L-6.4 -8.6 L-1.9 -5.4 C-0.6 -5.9 0.6 -5.9 1.9 -5.4 L6.4 -8.6 L8.2 -1.2 C9.2 3.5 7.1 8.2 1.8 8.9 H-1.8 C-7.1 8.2 -9.2 3.5 -8.2 -1.2 Z"
            fill={paint.fill}
            stroke={paint.stroke}
            strokeWidth="1.05"
          />
          <circle cx="-3.1" cy="0.6" r="1" fill={paint.accent} />
          <circle cx="3.1" cy="0.6" r="1" fill={paint.accent} />
          <path d="M0 2.1 L-1 3.4 H1 Z" fill={paint.detail} />
          <path d="M-2 4.8 C-1 5.6 1 5.6 2 4.8" fill="none" stroke={paint.detail} strokeWidth=".72" />
        </>
      );
    case "ghost":
      return (
        <>
          <path
            d="M-7.4 8.1 V-0.4 C-7.4 -5.2 -4.4 -8.7 0 -8.7 C4.5 -8.7 7.4 -5.2 7.4 -0.4 V8.1 C5.8 6.1 4.2 5.9 2.4 8.1 C1 6 0 5.9 -1.3 8.1 C-3 6 -4.8 5.9 -7.4 8.1 Z"
            fill={paint.fill}
            stroke={paint.stroke}
            strokeWidth="1.02"
          />
          <circle cx="-2.2" cy="-1.2" r="1.05" fill={paint.accent} />
          <circle cx="2.2" cy="-1.2" r="1.05" fill={paint.accent} />
          <path d="M-1.8 3 C-0.6 4.1 0.6 4.1 1.8 3" fill="none" stroke={paint.detail} strokeWidth=".72" />
        </>
      );
    case "safety-pin":
      return (
        <>
          <g transform="rotate(-18)">
            <path d="M-8.6 0 C-8.6 -4.5 -5.7 -7.1 -1.8 -7.1 C2.4 -7.1 5.5 -4.3 5.5 -0.3 V4.8" fill="none" stroke={paint.stroke} strokeWidth="1.9" />
            <path d="M5.5 4.8 L8.6 7.6 L3.2 8.8 L4.1 3.2 Z" fill={paint.fill} stroke={paint.stroke} strokeWidth=".9" />
            <circle cx="-1.8" cy="-0.3" r="4.2" fill={paint.fill} fillOpacity=".2" stroke={paint.stroke} strokeWidth="1.6" />
            <path d="M-4.3 -2.3 C-2.8 -4.4 -0.4 -4.7 2 -3.6" fill="none" stroke={paint.detail} strokeOpacity=".62" strokeWidth=".8" />
          </g>
        </>
      );
    default:
      return assertNever(kind);
  }
}

export function getStickerPaint(
  themeId: StickerThemeId,
  placement: StickerPlacement,
  ids: SvgIds,
): StickerPaint {
  if (themeId === "dreamy" && placement.tone === "bubble") {
    return {
      fill: `url(#${ids.dreamyBubble})`,
      stroke: "#a8badf",
      detail: "#ffffff",
      accent: "#dee9ff",
      fillOpacity: 0.96,
    };
  }

  if (placement.kind === "pearl") {
    return {
      fill: `url(#${ids.pearlFill})`,
      stroke: "#a1adbf",
      detail: "#ffffff",
      accent: "#d6deec",
    };
  }

  switch (themeId) {
    case "dreamy":
      if (placement.tone === "soft") {
        return {
          fill: `url(#${ids.dreamyCloud})`,
          stroke: "#a6b8df",
          detail: "#ffffff",
          accent: "#d4ddff",
        };
      }
      if (placement.tone === "bubble" || placement.tone === "translucent") {
        return {
          fill: `url(#${ids.dreamyBubble})`,
          stroke: "#a8badf",
          detail: "#ffffff",
          accent: "#dee9ff",
          fillOpacity: placement.tone === "translucent" ? 0.82 : 0.96,
        };
      }
      return {
        fill: `url(#${ids.dreamyGlow})`,
        stroke: "#9aa8d0",
        detail: "#ffffff",
        accent: "#d8cfff",
      };
    case "kawaii":
      if (placement.tone === "resin") {
        return {
          fill: `url(#${ids.kawaiiResin})`,
          stroke: "#bf6d96",
          detail: "#ffffff",
          accent: "#f1b5d8",
        };
      }
      if (placement.tone === "glossy") {
        return {
          fill: `url(#${ids.kawaiiGloss})`,
          stroke: "#7b78bc",
          detail: "#ffffff",
          accent: "#fff0a8",
        };
      }
      return {
        fill: `url(#${ids.kawaiiCandy})`,
        stroke: "#cc78a1",
        detail: "#ffffff",
        accent: "#ffe9f4",
      };
    case "monochrome-cute":
      if (placement.tone === "white" || placement.kind === "ghost") {
        return {
          fill: `url(#${ids.pearlFill})`,
          stroke: "#b6b6b6",
          detail: "#ffffff",
          accent: "#1f1f1f",
        };
      }
      if (placement.tone === "black-chrome") {
        return {
          fill: `url(#${ids.monoBlackChrome})`,
          stroke: "#1a1a1a",
          detail: "#f0f0f0",
          accent: "#f6f6f6",
        };
      }
      if (placement.tone === "gingham") {
        return {
          fill: `url(#${ids.monoGingham})`,
          stroke: "#2a2a2a",
          detail: "#ffffff",
          accent: "#f4f1eb",
        };
      }
      return {
        fill: `url(#${ids.monoBlack})`,
        stroke: "#111111",
        detail: "#f4f4f4",
        accent: "#f5f1e9",
      };
    case "chrome":
    default:
      return {
        fill: `url(#${ids.chromeFill})`,
        stroke: "#47505d",
        detail: "#ffffff",
        accent: "#d4dde7",
      };
  }
}

export function buildSvgIds(prefix: string) {
  return {
    shadow: `${prefix}-shadow`,
    chromeFill: `${prefix}-chrome-fill`,
    pearlFill: `${prefix}-pearl-fill`,
    dreamyGlow: `${prefix}-dreamy-glow`,
    dreamyCloud: `${prefix}-dreamy-cloud`,
    dreamyBubble: `${prefix}-dreamy-bubble`,
    kawaiiCandy: `${prefix}-kawaii-candy`,
    kawaiiResin: `${prefix}-kawaii-resin`,
    kawaiiGloss: `${prefix}-kawaii-gloss`,
    monoBlack: `${prefix}-mono-black`,
    monoBlackChrome: `${prefix}-mono-black-chrome`,
    monoGingham: `${prefix}-mono-gingham`,
  } as const;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported sticker kind: ${String(value)}`);
}
