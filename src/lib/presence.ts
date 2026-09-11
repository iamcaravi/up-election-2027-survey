import "server-only";
import { prisma } from "./prisma";

// A visitor counts as "live" if their last heartbeat was within this window.
export const LIVE_WINDOW_MS = 90 * 1000;

export interface PresenceStats {
  live: number;
  total: number;
}

// Records/refreshes one heartbeat and returns the current stats in a single
// round trip (so the client doesn't need a second request to read them back).
// `upsert` is a single atomic statement — concurrent heartbeats for the same
// or different visitors cannot corrupt or double-count the total, and a
// returning visitor's existing row is updated in place rather than creating
// a second "unique visitor".
export async function recordHeartbeat(visitorHash: string): Promise<PresenceStats> {
  const now = new Date();
  await prisma.visitorPresence.upsert({
    where: { visitorHash },
    update: { lastSeenAt: now },
    create: { visitorHash, firstSeenAt: now, lastSeenAt: now },
  });
  return getPresenceStats();
}

export async function getPresenceStats(): Promise<PresenceStats> {
  const cutoff = new Date(Date.now() - LIVE_WINDOW_MS);
  const [live, total] = await Promise.all([
    prisma.visitorPresence.count({ where: { lastSeenAt: { gte: cutoff } } }),
    prisma.visitorPresence.count(),
  ]);
  return { live, total };
}
