import "server-only";
import { prisma } from "./prisma";

// A visitor counts as "live" if their last heartbeat was within this window.
export const LIVE_WINDOW_MS = 90 * 1000;

export interface PresenceStats {
  live: number;
  total: number;
}

// Records/refreshes one heartbeat and returns the current stats.
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

  // Keep these sequential in the Worker. Prisma's adapter/pool can fail when
  // multiple queries are issued concurrently from the same client instance.
  const live = await prisma.visitorPresence.count({
    where: { lastSeenAt: { gte: cutoff } },
  });
  const total = await prisma.visitorPresence.count();

  return { live, total };
}
