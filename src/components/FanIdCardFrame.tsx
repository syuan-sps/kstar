// The 追星證 card's outer border, drawn in code rather than as a CSS gradient.
// It is an 11px metal band that rings the whole card (header included), so the
// interior is never covered — the opening is a clean hole through the middle.
// The band is silver by construction and tinted per edition via the theme accent,
// so every style gets its own version of the same frame.
//
// Geometry maps to the card's 328×693 box; a proportional viewBox keeps the band
// aligned if the card's height ever drifts.
const FRAME_OUTER = "M28 0 L300 0 A28 28 0 0 1 328 28 L328 665 A28 28 0 0 1 300 693 L28 693 A28 28 0 0 1 0 665 L0 28 A28 28 0 0 1 28 0 Z";
const FRAME_OPENING = "M33 11 L295 11 A22 22 0 0 1 317 33 L317 660 A22 22 0 0 1 295 682 L33 682 A22 22 0 0 1 11 660 L11 33 A22 22 0 0 1 33 11 Z";
// rivets sit on the band's centreline (5.5px in); top-centre is left free for the notch
const FRAME_RIVETS: ReadonlyArray<readonly [number, number]> = [
  [12.8, 12.8], [315.2, 12.8], [12.8, 680.2], [315.2, 680.2],
  [5.5, 346.5], [322.5, 346.5], [164, 687.5],
];

type BorderSkin = {
  src: string;
  alphaBounds: readonly [number, number, number, number];
};

export default function FanIdCardFrame({ accent, skin }: { accent: string; skin?: BorderSkin | null }) {
  // one gradient set per accent so several editions can render on the same page
  const key = accent.replace(/[^a-zA-Z0-9]/g, "") || "default";
  const metalId = `fanid-frame-metal-${key}`;
  const tintId = `fanid-frame-tint-${key}`;
  const rivetId = `fanid-frame-rivet-${key}`;
  const skinMaskId = `fanid-frame-skin-mask-${key}`;
  const [left, top, right, bottom] = skin?.alphaBounds ?? [0, 0, 1, 1];
  const sourceWidth = 887;
  const sourceHeight = 1774;
  const scaleX = 328 / (right - left);
  const scaleY = 693 / (bottom - top);

  return (
    <svg
      aria-hidden="true"
      data-fanid-card-frame="true"
      viewBox="0 0 328 693"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
    >
      <defs>
        <linearGradient id={metalId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="16%" stopColor="#f2f4f7" />
          <stop offset="34%" stopColor="#c8ccd2" />
          <stop offset="50%" stopColor="#9aa0aa" />
          <stop offset="66%" stopColor="#c8ccd2" />
          <stop offset="84%" stopColor="#eef0f3" />
          <stop offset="100%" stopColor="#aeb3bb" />
        </linearGradient>
        {/* accent sheen over the silver — this is what makes each edition distinct */}
        <linearGradient id={tintId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
          <stop offset="22%" stopColor={accent} stopOpacity="0.12" />
          <stop offset="45%" stopColor={accent} stopOpacity="0.5" />
          <stop offset="62%" stopColor={accent} stopOpacity="0.14" />
          <stop offset="84%" stopColor={accent} stopOpacity="0.45" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id={rivetId} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="42%" stopColor="#d3d7dd" />
          <stop offset="100%" stopColor="#7c8088" />
        </radialGradient>
        {skin && (
          <mask id={skinMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="328" height="693">
            <rect width="328" height="693" fill="black" />
            <path d={`${FRAME_OUTER} ${FRAME_OPENING}`} fill="white" fillRule="evenodd" />
          </mask>
        )}
      </defs>

      {skin ? (
        <image
          href={skin.src}
          x={-left * scaleX}
          y={-top * scaleY}
          width={sourceWidth * scaleX}
          height={sourceHeight * scaleY}
          preserveAspectRatio="none"
          mask={`url(#${skinMaskId})`}
        />
      ) : (
        <>
          {/* band = outer rounded rect minus the card opening */}
          <path d={`${FRAME_OUTER} ${FRAME_OPENING}`} fillRule="evenodd" fill={`url(#${metalId})`} />
          <path d={`${FRAME_OUTER} ${FRAME_OPENING}`} fillRule="evenodd" fill={`url(#${tintId})`} />
        </>
      )}

      {/* bevel: crisp dark edges with bright highlight rims */}
      <path d={FRAME_OUTER} fill="none" stroke="#5f636b" strokeOpacity="0.8" strokeWidth="1.4" />
      <path d={FRAME_OUTER} fill="none" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="0.8" transform="translate(0 1)" />
      <path d={FRAME_OPENING} fill="none" stroke="#3a3d43" strokeOpacity="0.5" strokeWidth="1.4" />
      <path d={FRAME_OPENING} fill="none" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="0.8" transform="translate(0 -1)" />

      {/* rivets / panel screws */}
      {FRAME_RIVETS.map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="3.2" fill={`url(#${rivetId})`} />
          <circle cx={cx} cy={cy} r="3.2" fill="none" stroke="#5f636b" strokeOpacity="0.75" strokeWidth="0.7" />
          <circle cx={cx - 0.9} cy={cy - 0.9} r="0.8" fill="#ffffff" fillOpacity="0.85" />
        </g>
      ))}
    </svg>
  );
}
