import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { heroConfigSchema } from "@/lib/hero-config";

const HERO_CONFIG_KEY = "HERO_CONFIG";

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = heroConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const setting = await prisma.siteSetting.upsert({
    where: { key: HERO_CONFIG_KEY },
    update: { value: JSON.stringify(parsed.data) },
    create: { key: HERO_CONFIG_KEY, value: JSON.stringify(parsed.data) },
  });

  await logAudit({
    adminUserId: session.sub,
    action: "UPDATE_HERO_CONFIG",
    entityType: "SiteSetting",
    entityId: HERO_CONFIG_KEY,
  });

  return NextResponse.json(setting);
}
