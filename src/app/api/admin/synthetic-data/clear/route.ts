import { NextResponse } from "next/server";
import { getAdminSession, logAudit } from "@/lib/auth";
import { clearAllSyntheticData } from "@/lib/synthetic-data";

export async function POST() {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await clearAllSyntheticData();

  await logAudit({
    adminUserId: session.sub,
    action: "CLEAR_SYNTHETIC_DATA",
    entityType: "SiteSetting",
    entityId: "SYNTHETIC_DATA",
    metadata: { deleted },
  });

  return NextResponse.json({ deleted });
}
