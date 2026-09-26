import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saltedHash } from "@/lib/hash";
import { isRateLimited } from "@/lib/rate-limit";
import { recordHeartbeat, getPresenceStats } from "@/lib/presence";

const bodySchema = z.object({
  fingerprint: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const visitorHash = saltedHash(parsed.data.fingerprint);

    if (isRateLimited(`presence:${visitorHash}`, 6, 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const stats = await recordHeartbeat(visitorHash);
    return NextResponse.json(stats, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Presence heartbeat failed:", error);
    return NextResponse.json(
      { error: "Visitor statistics are temporarily unavailable." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function GET() {
  try {
    const stats = await getPresenceStats();
    return NextResponse.json(stats, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Presence stats failed:", error);
    return NextResponse.json(
      { error: "Visitor statistics are temporarily unavailable." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
