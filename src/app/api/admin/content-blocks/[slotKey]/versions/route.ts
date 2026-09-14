import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession, hasAdminRole, logAudit } from "@/lib/auth";
import { getContentBlockVersions, restoreContentBlockVersion } from "@/lib/content-blocks";

const WRITE_ROLES = ["ADMIN", "EDITOR"] as const;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slotKey: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slotKey } = await params;

  const versions = await getContentBlockVersions(slotKey);
  return NextResponse.json(versions);
}

const restoreSchema = z.object({ versionId: z.string().min(1) });

// Restoring a version only ever populates draftValue (see
// restoreContentBlockVersion's own doc comment) — the caller must still
// PATCH {action:"publish"} afterward to make it live. This is intentionally
// stricter than the existing FaqItem restore, per the approved Phase 2 plan.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slotKey: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminRole(session, WRITE_ROLES)) {
    return NextResponse.json({ error: "Only Admin/Editor accounts can manage content blocks." }, { status: 403 });
  }
  const { slotKey } = await params;

  const parsed = restoreSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  try {
    const block = await restoreContentBlockVersion({ slotKey, versionId: parsed.data.versionId, editorEmail: session.email });
    await logAudit({
      adminUserId: session.sub,
      action: "RESTORE_TO_DRAFT",
      entityType: "ContentBlock",
      entityId: slotKey,
      metadata: { versionId: parsed.data.versionId },
    });
    return NextResponse.json(block);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Something went wrong." }, { status: 400 });
  }
}
