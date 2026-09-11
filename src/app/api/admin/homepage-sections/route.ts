import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { homepageSectionsConfigSchema } from "@/lib/homepage-sections-config";

const HOMEPAGE_SECTIONS_CONFIG_KEY = "HOMEPAGE_SECTIONS_CONFIG";

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = homepageSectionsConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const setting = await prisma.siteSetting.upsert({
    where: { key: HOMEPAGE_SECTIONS_CONFIG_KEY },
    update: { value: JSON.stringify(parsed.data) },
    create: { key: HOMEPAGE_SECTIONS_CONFIG_KEY, value: JSON.stringify(parsed.data) },
  });

  await logAudit({
    adminUserId: session.sub,
    action: "UPDATE_HOMEPAGE_SECTIONS_CONFIG",
    entityType: "SiteSetting",
    entityId: HOMEPAGE_SECTIONS_CONFIG_KEY,
  });

  return NextResponse.json(setting);
}
