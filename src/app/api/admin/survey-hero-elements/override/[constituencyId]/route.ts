import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { getSiteSetting } from "@/lib/data";
import { heroElementsConfigSchema, surveyHeroElementsOverrideKey, normalizeHeroElementsConfig } from "@/lib/survey-hero-elements-config";

export async function GET(req: NextRequest, { params }: { params: Promise<{ constituencyId: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { constituencyId } = await params;
  const raw = await getSiteSetting<unknown>(surveyHeroElementsOverrideKey(constituencyId), null);
  return NextResponse.json({ override: raw ? normalizeHeroElementsConfig(raw) : null });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ constituencyId: string }> }) {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { constituencyId } = await params;
  const constituency = await prisma.constituency.findUnique({ where: { id: constituencyId } });
  if (!constituency) return NextResponse.json({ error: "Constituency not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = heroElementsConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  const key = surveyHeroElementsOverrideKey(constituencyId);
  const setting = await prisma.siteSetting.upsert({
    where: { key },
    update: { value: JSON.stringify(parsed.data) },
    create: { key, value: JSON.stringify(parsed.data) },
  });

  await logAudit({
    adminUserId: session.sub,
    action: "UPDATE_SURVEY_HERO_ELEMENTS_OVERRIDE",
    entityType: "Constituency",
    entityId: constituencyId,
  });

  return NextResponse.json(setting);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ constituencyId: string }> }) {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { constituencyId } = await params;
  const key = surveyHeroElementsOverrideKey(constituencyId);
  await prisma.siteSetting.deleteMany({ where: { key } });

  await logAudit({
    adminUserId: session.sub,
    action: "DELETE_SURVEY_HERO_ELEMENTS_OVERRIDE",
    entityType: "Constituency",
    entityId: constituencyId,
  });

  return NextResponse.json({ ok: true });
}
