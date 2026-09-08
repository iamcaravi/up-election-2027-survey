import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { syncCandidateChoiceOptions } from "@/lib/survey-sync";
import { slugify } from "@/lib/slugify";
import { CANDIDATE_STATUSES, CONFIDENCE_SCORES } from "@/lib/enums";

const createSchema = z.object({
  constituencyId: z.string().min(1),
  name: z.string().min(2).max(120),
  partyId: z.string().optional().nullable(),
  status: z.enum(CANDIDATE_STATUSES),
  confidenceScore: z.enum(CONFIDENCE_SCORES),
  currentOffice: z.string().max(200).optional(),
  background: z.string().max(2000).optional(),
  sourceNotes: z.string().max(2000).optional(),
  sourceUrls: z.array(z.string().url()).max(10).optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  photoSourceUrl: z.string().url().optional().or(z.literal("")),
  photoSourceName: z.string().max(200).optional(),
  photoLicense: z.string().max(200).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const constituencyId = req.nextUrl.searchParams.get("constituencyId");
  const candidates = await prisma.candidate.findMany({
    where: constituencyId ? { constituencyId } : undefined,
    include: { party: true, constituency: { include: { district: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(candidates);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const data = parsed.data;

  const constituency = await prisma.constituency.findUnique({ where: { id: data.constituencyId } });
  if (!constituency) return NextResponse.json({ error: "Constituency not found" }, { status: 404 });

  let slug = slugify(data.name);
  const existing = await prisma.candidate.findFirst({ where: { constituencyId: data.constituencyId, slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const candidate = await prisma.candidate.create({
    data: {
      constituencyId: data.constituencyId,
      name: data.name,
      slug,
      partyId: data.partyId || null,
      status: data.status,
      confidenceScore: data.confidenceScore,
      currentOffice: data.currentOffice,
      background: data.background,
      sourceNotes: data.sourceNotes,
      sourceUrls: data.sourceUrls ? JSON.stringify(data.sourceUrls) : null,
      photoUrl: data.photoUrl || null,
      photoSourceUrl: data.photoSourceUrl || null,
      photoSourceName: data.photoSourceName || null,
      photoLicense: data.photoLicense || null,
      photoVerified: false,
      photoRetrievedAt: data.photoUrl ? new Date() : null,
    },
  });

  if (data.photoUrl) {
    await prisma.imageSource.create({
      data: {
        candidateId: candidate.id,
        imageUrl: data.photoUrl,
        sourceUrl: data.photoSourceUrl || data.photoUrl,
        sourceName: data.photoSourceName || "Unknown",
        license: data.photoLicense,
        status: "PENDING",
      },
    });
  }

  await syncCandidateChoiceOptions(data.constituencyId);
  await logAudit({
    adminUserId: session.sub,
    action: "CREATE",
    entityType: "Candidate",
    entityId: candidate.id,
    metadata: { name: candidate.name, constituencyId: data.constituencyId },
  });

  return NextResponse.json(candidate, { status: 201 });
}
