import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession, hasAdminRole, logAudit } from "@/lib/auth";
import { getContentBlock, saveContentBlockDraft, publishContentBlock, discardContentBlockDraft } from "@/lib/content-blocks";

const WRITE_ROLES = ["ADMIN", "EDITOR"] as const;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slotKey: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slotKey } = await params;

  const block = await getContentBlock(slotKey);
  if (!block) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(block);
}

// One action-based PATCH instead of three near-identical routes — each
// action maps 1:1 onto a src/lib/content-blocks.ts function, so the actual
// draft/publish/discard invariants (no version on draft save, version
// snapshot only at publish, publish requires a pending draft) live in
// exactly one place, not duplicated per route.
const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save-draft"), value: z.unknown() }),
  z.object({ action: z.literal("publish") }),
  z.object({ action: z.literal("discard-draft") }),
]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slotKey: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminRole(session, WRITE_ROLES)) {
    return NextResponse.json({ error: "Only Admin/Editor accounts can manage content blocks." }, { status: 403 });
  }
  const { slotKey } = await params;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const existing = await getContentBlock(slotKey);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    if (parsed.data.action === "save-draft") {
      const block = await saveContentBlockDraft({ slotKey, value: parsed.data.value, editorEmail: session.email });
      await logAudit({ adminUserId: session.sub, action: "SAVE_DRAFT", entityType: "ContentBlock", entityId: slotKey });
      return NextResponse.json(block);
    }
    if (parsed.data.action === "publish") {
      const block = await publishContentBlock({ slotKey, editorEmail: session.email });
      await logAudit({ adminUserId: session.sub, action: "PUBLISH", entityType: "ContentBlock", entityId: slotKey });
      return NextResponse.json(block);
    }
    const block = await discardContentBlockDraft({ slotKey, editorEmail: session.email });
    await logAudit({ adminUserId: session.sub, action: "DISCARD_DRAFT", entityType: "ContentBlock", entityId: slotKey });
    return NextResponse.json(block);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Something went wrong." }, { status: 400 });
  }
}
