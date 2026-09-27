import "server-only";
import { prisma } from "./prisma";

// A visitor counts as "live" if their last heartbeat was within this window.
export const LIVE_WINDOW_MS = 90 * 1000;

export interface PresenceStats {
  live: number;
  total: number;
}

type CountRow = { count: number };

function readCount(row: CountRow | undefined): number {
  return Number(row?.count ?? 0);
}

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

  // Health already proves that $queryRaw works in the Worker. Use raw SQL here
  // to avoid the adapter/runtime issue observed with the filtered Prisma count.
  const liveRows = await prisma.$queryRaw<CountRow[]>`SELECT COUNT(*)::int AS count FROM "visitor_presence" WHERE "lastSeenAt" >= ${cutoff}`;
  const totalRows = await prisma.$queryRaw<CountRow[]>`SELECT COUNT(*)::int AS count FROM "visitor_presence"`;

  return { live: readCount(liveRows[0]), total: readCount(totalRows[0]) };
}