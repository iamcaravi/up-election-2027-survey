import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { assertElectionConstituencySameState } from "@/lib/admin-guards";

const createSchema = z.object({
  electionId: z.string().min(1),
  constituencyId: z.string().min(1),
});

// electionId is required, never defaulted — mappings are always listed
// scoped to one election.
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const electionId = req.nextUrl.searchParams.get("electionId");
  if (!electionId) {
    return NextResponse.json({ error: "Missing required ?electionId= parameter." }, { status: 400 });
  }

  const mappings = await prisma.electionConstituency.findMany({
    where: { electionId },
    include: {
      constituency: { include: { district: { select: { name: true } } } },
    },
    orderBy: { constituency: { number: "asc" } },
  });
  return NextResponse.json(mappings);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const { electionId, constituencyId } = parsed.data;

  // The single most important invariant of this endpoint: an election can
  // only be mapped to constituencies within its own state.
  const stateBlocker = await assertElectionConstituencySameState(prisma, electionId, constituencyId);
  if (stateBlocker) return NextResponse.json(stateBlocker, { status: stateBlocker.error.includes("not found") ? 404 : 400 });

  const constituency = await prisma.constituency.findUnique({ where: { id: constituencyId } });
  if (!constituency) return NextResponse.json({ error: "Constituency not found." }, { status: 404 });

  const existing = await prisma.electionConstituency.findUnique({
    where: { electionId_constituencyId: { electionId, constituencyId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: `${constituency.name} is already mapped to this election${existing.isActive ? "" : " (currently disabled)"}.` },
      { status: 409 }
    );
  }

  const mapping = await prisma.electionConstituency.create({
    data: { electionId, constituencyId },
  });

  await logAudit({
    adminUserId: session.sub,
    action: "CREATE",
    entityType: "ElectionConstituency",
    entityId: mapping.id,
    metadata: { electionId, constituencyId, constituencyName: constituency.name },
  });

  return NextResponse.json(mapping, { status: 201 });
}
