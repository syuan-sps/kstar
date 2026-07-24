import type { NextConfig } from "next";

// Files in public/ are served with `max-age=0, must-revalidate` by default, so
// every sticker costs a revalidation round-trip on every visit — 20 of them
// each time a pack tab is opened, which is exactly the mobile cost this art was
// just shrunk to avoid. The art is stable, so cache it properly.
//
// A day of freshness plus a month of stale-while-revalidate means repeat
// visitors pay nothing, while a replaced image still propagates within a day
// (rather than being pinned for a year by `immutable`, which would be wrong for
// art that is still being iterated on).
const ART_CACHE = "public, max-age=86400, stale-while-revalidate=2592000";

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/fanid-themes/:path*", headers: [{ key: "Cache-Control", value: ART_CACHE }] },
      { source: "/card-frames/:path*", headers: [{ key: "Cache-Control", value: ART_CACHE }] },
      { source: "/four-cuts/:path*", headers: [{ key: "Cache-Control", value: ART_CACHE }] },
      { source: "/idols/:path*", headers: [{ key: "Cache-Control", value: ART_CACHE }] },
    ];
  },
};

export default nextConfig;
