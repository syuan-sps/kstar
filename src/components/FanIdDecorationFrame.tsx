type Props = {
  themeId?: string | null;
  enabled: boolean;
};

export default function FanIdDecorationFrame({ themeId, enabled }: Props) {
  if (!enabled || themeId !== "kawaii") {
    return null;
  }

  return (
    <img
      alt=""
      data-fanid-decoration-frame="kawaii-sleeve"
      draggable={false}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full object-fill"
      src="/fanid-themes/kawaii/decorated-frame-v1.png"
    />
  );
}
