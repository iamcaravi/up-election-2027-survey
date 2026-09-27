import { NextRequest, NextResponse } from "next/server";
import { recordHeartbeat, getPresenceStats } from "@/lib/presence";

export const dynamic = "force-dynamic";

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

export async function POST(req: NextRequest) {
  try {
    const { z } = await import("zod");
    const { saltedHash } = await import("@/lib/hash");
    const { isRateLimited } = await import("@/lib/rate-limit");

    const body = await req.json().catch(() => null);
    const parsed = z.object({
      fingerprint: z.string().min(8).max(200),
    }).safeParse(body);

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
