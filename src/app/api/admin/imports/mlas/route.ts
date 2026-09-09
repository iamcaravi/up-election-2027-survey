import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { csvToObjects } from "@/lib/csv";
import { runMlaImport } from "@/lib/mla-import";

const bodySchema = z.object({ csv: z.string().min(1), commit: z.boolean().default(false) });

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const rows = csvToObjects(parsed.data.csv);
  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV has no data rows." }, { status: 400 });
  }
  if (rows.length > 500) {
    return NextResponse.json({ error: "CSV too large (max 500 rows per MLA import)." }, { status: 400 });
  }

  const summary = await runMlaImport(prisma, rows, { commit: parsed.data.commit });

  if (parsed.data.commit) {
    await logAudit({
      adminUserId: session.sub,
      action: "MLA_IMPORT",
      entityType: "Candidate",
      metadata: {
        totalRows: summary.totalRows,
        created: summary.toCreate,
        updated: summary.toUpdate,
        unchanged: summary.unchanged,
        needsReview: summary.needsReview,
      },
    });
  }

  return NextResponse.json(summary);
}
