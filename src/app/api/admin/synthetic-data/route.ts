import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { getSiteSetting } from "@/lib/data";
import { SYNTHETIC_DATA_MODE_KEY, SYNTHETIC_DATA_SOURCE, REAL_DATA_SOURCE } from "@/lib/synthetic-data";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [enabled, syntheticResponseCount, realResponseCount] = await Promise.all([
    getSiteSetting<boolean>(SYNTHETIC_DATA_MODE_KEY, false),
    prisma.surveyResponse.count({ where: { dataSource: SYNTHETIC_DATA_SOURCE } }),
    prisma.surveyResponse.count({ where: { dataSource: REAL_DATA_SOURCE } }),
  ]);

  return NextResponse.json({ enabled, syntheticResponseCount, realResponseCount });
}

const modeSchema = z.object({ enabled: z.boolean() });

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = modeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  await prisma.siteSetting.upsert({
    where: { key: SYNTHETIC_DATA_MODE_KEY },
    update: { value: JSON.stringify(parsed.data.enabled) },
    create: { key: SYNTHETIC_DATA_MODE_KEY, value: JSON.stringify(parsed.data.enabled) },
  });

  await logAudit({
    adminUserId: session.sub,
    action: parsed.data.enabled ? "ENABLE_SYNTHETIC_DATA_MODE" : "DISABLE_SYNTHETIC_DATA_MODE",
    entityType: "SiteSetting",
    entityId: SYNTHETIC_DATA_MODE_KEY,
  });

  return NextResponse.json({ enabled: parsed.data.enabled });
}
