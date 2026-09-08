import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";

const schema = z.object({
  key: z.enum(["MIN_ANALYTICS_GROUP_SIZE", "ELECTION_PERIOD_MODE"]),
  value: z.unknown(),
});

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const setting = await prisma.siteSetting.upsert({
    where: { key: parsed.data.key },
    update: { value: JSON.stringify(parsed.data.value) },
    create: { key: parsed.data.key, value: JSON.stringify(parsed.data.value) },
  });

  await logAudit({
    adminUserId: session.sub,
    action: "UPDATE_SETTING",
    entityType: "SiteSetting",
    entityId: parsed.data.key,
    metadata: { value: parsed.data.value },
  });

  return NextResponse.json(setting);
}
