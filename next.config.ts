import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Legacy UP-only URLs (from before the multi-state migration) rewritten to
  // a non-colliding bridge path (see src/app/uttar-pradesh/legacy-bridge/[...legacy]/page.tsx)
  // that resolves the current election dynamically and issues the real
  // redirect. This runs before filesystem route resolution, so — unlike a
  // page.tsx living directly under /uttar-pradesh/[district]/... — it can
  // exclude "elections" as a possible :district value (so it can never
  // structurally collide with the canonical /uttar-pradesh/elections/[election]
  // route tree) and also excludes "legacy-bridge" itself, since redirects()
  // re-checks its own output against this same list — without the
  // exclusion, the bridge destination would be re-matched and mis-redirected.
  async redirects() {
    return [
      {
        source: "/uttar-pradesh/:district((?!elections|legacy-bridge)[^/]+)",
        destination: "/uttar-pradesh/legacy-bridge/:district",
        permanent: false,
      },
      {
        source: "/uttar-pradesh/:district((?!elections|legacy-bridge)[^/]+)/:constituency",
        destination: "/uttar-pradesh/legacy-bridge/:district/:constituency",
        permanent: false,
      },
      {
        source: "/uttar-pradesh/:district((?!elections|legacy-bridge)[^/]+)/:constituency/:action(survey|results)",
        destination: "/uttar-pradesh/legacy-bridge/:district/:constituency/:action",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
