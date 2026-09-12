import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { heroElementsConfigSchema, SURVEY_HERO_ELEMENTS_KEY } from "@/lib/survey-hero-elements-config";

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = heroElementsConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const setting = await prisma.siteSetting.upsert({
    where: { key: SURVEY_HERO_ELEMENTS_KEY },
    update: { value: JSON.stringify(parsed.data) },
    create: { key: SURVEY_HERO_ELEMENTS_KEY, value: JSON.stringify(parsed.data) },
  });

  await logAudit({
    adminUserId: session.sub,
    action: "UPDATE_SURVEY_HERO_ELEMENTS",
    entityType: "SiteSetting",
    entityId: SURVEY_HERO_ELEMENTS_KEY,
  });

  return NextResponse.json(setting);
}
