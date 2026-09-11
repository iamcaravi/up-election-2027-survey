import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saltedHash } from "@/lib/hash";
import { isRateLimited } from "@/lib/rate-limit";
import { recordHeartbeat, getPresenceStats } from "@/lib/presence";

const bodySchema = z.object({
  fingerprint: z.string().min(8).max(200),
});

// Heartbeat: registers/refreshes this anonymous visitor and returns the
// current live + total counts in the same round trip.
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const visitorHash = saltedHash(parsed.data.fingerprint);

  if (isRateLimited(`presence:${visitorHash}`, 6, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const stats = await recordHeartbeat(visitorHash);
  return NextResponse.json(stats);
}

// Read-only stats fetch — used for the very first render before a heartbeat
// has necessarily gone out, so the footer isn't stuck on "—" longer than it
// has to be. Never writes/creates a visitor row.
export async function GET() {
  const stats = await getPresenceStats();
  return NextResponse.json(stats);
}
