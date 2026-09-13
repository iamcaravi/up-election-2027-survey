import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession, logAudit } from "@/lib/auth";
import { generateSyntheticDataForConstituency, generateSyntheticDataForAllConstituencies } from "@/lib/synthetic-data";

const bodySchema = z.object({ constituencyId: z.string().min(1).optional() });

// Regenerates synthetic demo data. With a `constituencyId`, only that seat is
// (re)generated — fast, safe to call from the UI directly. Without one, EVERY
// UP constituency is regenerated sequentially (SQLite is single-writer), so
// this can take a few minutes for all 403 seats; the client is expected to
// show a "this may take a while" notice and await the response.
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  if (parsed.data.constituencyId) {
    const result = await generateSyntheticDataForConstituency(parsed.data.constituencyId);
    if (!result) return NextResponse.json({ error: "Constituency or survey not found" }, { status: 404 });

    await logAudit({
      adminUserId: session.sub,
      action: "REGENERATE_SYNTHETIC_DATA_ONE",
      entityType: "Constituency",
      entityId: parsed.data.constituencyId,
      metadata: { responsesCreated: result.responsesCreated },
    });

    return NextResponse.json(result);
  }

  const result = await generateSyntheticDataForAllConstituencies();

  await logAudit({
    adminUserId: session.sub,
    action: "REGENERATE_SYNTHETIC_DATA_ALL",
    entityType: "SiteSetting",
    entityId: "SYNTHETIC_DATA",
    metadata: result,
  });

  return NextResponse.json(result);
}
