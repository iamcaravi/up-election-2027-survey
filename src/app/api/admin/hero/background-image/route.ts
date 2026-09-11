import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getAdminSession, logAudit } from "@/lib/auth";

// Admin-uploaded replacement Hero background images. Stored under
// public/uploads/hero/ with a fresh generated filename — the original
// public/hero-bg.png is never touched/overwritten by this route. The
// returned path is stored on HeroConfig.backgroundImageUrl (see
// src/lib/hero-config.ts) via the normal Hero Editor Save flow; uploading
// here only stores the file and hands back its URL, it does not itself
// persist HERO_CONFIG.

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "hero");

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Unsupported file type. Use PNG, JPG, or WebP." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large. Maximum size is 8MB." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // Sanity-check the actual bytes match the claimed type (basic magic-number
  // sniff) rather than trusting the client-supplied Content-Type alone.
  const isPng = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isJpg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isWebp =
    bytes.length > 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;
  const matches = (ext === "png" && isPng) || (ext === "jpg" && isJpg) || (ext === "webp" && isWebp);
  if (!matches) {
    return NextResponse.json({ error: "File content does not match its declared type." }, { status: 400 });
  }

  const filename = `hero-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);

  const url = `/uploads/hero/${filename}`;

  await logAudit({
    adminUserId: session.sub,
    action: "UPLOAD_HERO_BACKGROUND_IMAGE",
    entityType: "SiteSetting",
    entityId: "HERO_CONFIG",
    metadata: { url, size: file.size, type: file.type },
  });

  return NextResponse.json({ url });
}
