import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, hasAdminRole, logAudit } from "@/lib/auth";
import { listSeoOverrides, upsertSeoOverride, resetSeoOverride } from "@/lib/seo-overrides";

const WRITE_ROLES = ["ADMIN", "EDITOR"] as const;

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const overrides = await listSeoOverrides();
  return NextResponse.json(overrides);
}

const putSchema = z.object({
  path: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .regex(/^\/[a-zA-Z0-9\-/]*$/, "Path must be a real site-relative path starting with /"),
  title: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(400).nullable().optional(),
  ogImageAssetId: z.string().trim().min(1).nullable().optional(),
  noindex: z.boolean().optional(),
});

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminRole(session, WRITE_ROLES)) {
    return NextResponse.json({ error: "Only Admin/Editor accounts can manage SEO overrides." }, { status: 403 });
  }

  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const { path, ...data } = parsed.data;

  if (data.ogImageAssetId) {
    const asset = await prisma.mediaAsset.findUnique({ where: { id: data.ogImageAssetId } });
    if (!asset) return NextResponse.json({ error: "Selected OG image was not found in the Media Library." }, { status: 400 });
  }

  const override = await upsertSeoOverride(path, data, session.email);

  await logAudit({ adminUserId: session.sub, action: "UPSERT", entityType: "SeoOverride", entityId: path, metadata: data });

  return NextResponse.json(override);
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminRole(session, WRITE_ROLES)) {
    return NextResponse.json({ error: "Only Admin/Editor accounts can manage SEO overrides." }, { status: 403 });
  }

  const path = req.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing required ?path=" }, { status: 400 });

  await resetSeoOverride(path);
  await logAudit({ adminUserId: session.sub, action: "RESET", entityType: "SeoOverride", entityId: path });

  return NextResponse.json({ ok: true });
}
