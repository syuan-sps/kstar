import type { FanIdThemeId } from "@/lib/fanIdThemes";

type Props = {
  themeId?: string | null;
  enabled: boolean;
};

export const FAN_ID_DECORATION_ASSETS: Record<FanIdThemeId, { sleeve: string }> = {
  chrome: {
    sleeve: "/fanid-themes/chrome/decorated-sleeve-v1.png",
  },
  "cloudy-dreamy": {
    sleeve: "/fanid-themes/cloudy-dreamy/decorated-sleeve-v1.png",
  },
  kawaii: {
    sleeve: "/fanid-themes/kawaii/decorated-sleeve-v2.png",
  },
  "monochrome-cute": {
    sleeve: "/fanid-themes/monochrome-cute/decorated-sleeve-v1.png",
  },
};

export default function FanIdDecorationFrame({ themeId, enabled }: Props) {
  if (!enabled || !themeId || !Object.prototype.hasOwnProperty.call(FAN_ID_DECORATION_ASSETS, themeId)) {
    return null;
  }

  const assets = FAN_ID_DECORATION_ASSETS[themeId as FanIdThemeId];

  return (
    <>
      <img
        alt=""
        data-fanid-decoration-frame={`${themeId}-sleeve`}
        draggable={false}
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-fill"
        src={assets.sleeve}
      />
    </>
  );
}
