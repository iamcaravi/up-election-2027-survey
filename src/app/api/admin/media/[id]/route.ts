import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getAdminSession, hasAdminRole, logAudit } from "@/lib/auth";
import { MEDIA_UPLOAD_DIR } from "@/lib/media";

const WRITE_ROLES = ["ADMIN", "EDITOR"] as const;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(asset);
}

const updateSchema = z.object({
  altText: z.string().trim().max(300).nullable().optional(),
  caption: z.string().trim().max(500).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminRole(session, WRITE_ROLES)) {
    return NextResponse.json({ error: "Only Admin/Editor accounts can edit media." }, { status: 403 });
  }
  const { id } = await params;

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const existing = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const asset = await prisma.mediaAsset.update({ where: { id }, data: parsed.data });
  await logAudit({ adminUserId: session.sub, action: "UPDATE", entityType: "MediaAsset", entityId: id, metadata: parsed.data });
  return NextResponse.json(asset);
}

// The file path deleted from disk is always derived from the DB row's own
// fileName (never from the request), so there is no path-traversal surface
// here — the `id` route param only ever selects which row's fileName to use.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminRole(session, WRITE_ROLES)) {
    return NextResponse.json({ error: "Only Admin/Editor accounts can delete media." }, { status: 403 });
  }
  const { id } = await params;

  const existing = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const usedBySeoOverride = await prisma.seoOverride.findFirst({ where: { ogImageAssetId: id } });
  if (usedBySeoOverride) {
    return NextResponse.json(
      { error: `This asset is used as the OG image for the SEO override on "${usedBySeoOverride.path}". Remove that override first.` },
      { status: 409 }
    );
  }

  await prisma.mediaAsset.delete({ where: { id } });
  await unlink(path.join(MEDIA_UPLOAD_DIR, existing.fileName)).catch(() => {
    // File already gone from disk — the DB row is still the source of
    // truth for "does this asset exist", so this isn't treated as an error.
  });

  await logAudit({ adminUserId: session.sub, action: "DELETE", entityType: "MediaAsset", entityId: id, metadata: { fileName: existing.fileName } });
  return NextResponse.json({ ok: true });
}
