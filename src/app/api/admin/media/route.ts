import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getAdminSession, hasAdminRole, logAudit } from "@/lib/auth";
import { MEDIA_UPLOAD_DIR, MEDIA_URL_PREFIX, extensionForMimeType, generateMediaFileName, validateUploadedFile } from "@/lib/media";

const WRITE_ROLES = ["ADMIN", "EDITOR"] as const;

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  const assets = await prisma.mediaAsset.findMany({
    where: q ? { OR: [{ fileName: { contains: q } }, { altText: { contains: q } }, { caption: { contains: q } }] } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminRole(session, WRITE_ROLES)) {
    return NextResponse.json({ error: "Only Admin/Editor accounts can upload media." }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  const altText = (form?.get("altText") as string | null)?.trim() || null;
  const caption = (form?.get("caption") as string | null)?.trim() || null;

  const bytes = Buffer.from(await file.arrayBuffer());
  const validationError = validateUploadedFile(file, bytes);
  if (validationError) return NextResponse.json(validationError, { status: 400 });

  const ext = extensionForMimeType(file.type)!;
  const fileName = generateMediaFileName(ext);
  await mkdir(MEDIA_UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(MEDIA_UPLOAD_DIR, fileName), bytes);

  const asset = await prisma.mediaAsset.create({
    data: {
      url: `${MEDIA_URL_PREFIX}${fileName}`,
      fileName,
      mimeType: file.type,
      sizeBytes: file.size,
      altText,
      caption,
      uploadedBy: session.email,
    },
  });

  await logAudit({
    adminUserId: session.sub,
    action: "UPLOAD",
    entityType: "MediaAsset",
    entityId: asset.id,
    metadata: { fileName, mimeType: file.type, sizeBytes: file.size },
  });

  return NextResponse.json(asset, { status: 201 });
}
