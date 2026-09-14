import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession, hasAdminRole, logAudit } from "@/lib/auth";
import { listContentBlocks, createContentBlock, getContentBlock } from "@/lib/content-blocks";

const WRITE_ROLES = ["ADMIN", "EDITOR"] as const;

const SLOT_KEY_PATTERN = /^[a-z0-9]+(\.[a-z0-9-]+)*$/;

const createSchema = z.object({
  slotKey: z.string().trim().min(3).max(120).regex(SLOT_KEY_PATTERN, "Use lowercase dot-separated segments, e.g. legal.privacy"),
  contentType: z.enum(["plainText", "richText", "structuredSections", "json"]),
  initialValue: z.unknown(),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blocks = await listContentBlocks();
  return NextResponse.json(blocks);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminRole(session, WRITE_ROLES)) {
    return NextResponse.json({ error: "Only Admin/Editor accounts can manage content blocks." }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const existing = await getContentBlock(parsed.data.slotKey);
  if (existing) {
    return NextResponse.json({ error: `A content block with slot key "${parsed.data.slotKey}" already exists.` }, { status: 409 });
  }

  const block = await createContentBlock({
    slotKey: parsed.data.slotKey,
    contentType: parsed.data.contentType,
    initialValue: parsed.data.initialValue,
    editorEmail: session.email,
  });

  await logAudit({
    adminUserId: session.sub,
    action: "CREATE",
    entityType: "ContentBlock",
    entityId: block.slotKey,
    metadata: { contentType: block.contentType },
  });

  return NextResponse.json(block, { status: 201 });
}
