import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { slugify, isValidSlug } from "@/lib/slugify";
import { RESERVED_STATUSES } from "@/lib/enums";
import { assertDistrictInState } from "@/lib/admin-guards";

const CONSTITUENCY_TYPES = ["ASSEMBLY", "LOK_SABHA"] as const;

const createSchema = z.object({
  stateId: z.string().min(1),
  districtId: z.string().min(1),
  number: z.number().int().min(1),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(80).optional(),
  type: z.enum(CONSTITUENCY_TYPES).optional(),
  reservedStatus: z.enum(RESERVED_STATUSES).optional(),
});

// stateId is required, never defaulted.
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stateId = req.nextUrl.searchParams.get("stateId");
  const districtId = req.nextUrl.searchParams.get("districtId");
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!stateId) {
    return NextResponse.json({ error: "Missing required ?stateId= parameter." }, { status: 400 });
  }

  const constituencies = await prisma.constituency.findMany({
    where: {
      stateId,
      ...(districtId ? { districtId } : {}),
      ...(q ? { name: { contains: q } } : {}),
    },
    include: {
      district: { select: { id: true, name: true } },
      _count: { select: { candidates: true, surveys: true, electionConstituencies: true, surveyResponses: true } },
    },
    orderBy: { number: "asc" },
    take: 500,
  });
  return NextResponse.json(constituencies);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const data = parsed.data;

  const state = await prisma.state.findUnique({ where: { id: data.stateId } });
  if (!state) return NextResponse.json({ error: "State not found." }, { status: 404 });

  const districtBlocker = await assertDistrictInState(prisma, state.id, data.districtId);
  if (districtBlocker) return NextResponse.json(districtBlocker, { status: districtBlocker.error.includes("not found") ? 404 : 400 });

  const slug = data.slug ? slugify(data.slug) : slugify(data.name);
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Slug must be lowercase letters, numbers and single hyphens only." }, { status: 400 });
  }

  const [slugClash, numberClash] = await Promise.all([
    prisma.constituency.findUnique({ where: { stateId_slug: { stateId: state.id, slug } } }),
    prisma.constituency.findUnique({ where: { stateId_number: { stateId: state.id, number: data.number } } }),
  ]);
  if (slugClash) {
    return NextResponse.json({ error: `A constituency with slug "${slug}" already exists in ${state.name}.` }, { status: 409 });
  }
  if (numberClash) {
    return NextResponse.json({ error: `A constituency with number ${data.number} already exists in ${state.name}.` }, { status: 409 });
  }

  const constituency = await prisma.constituency.create({
    data: {
      stateId: state.id,
      districtId: data.districtId,
      number: data.number,
      name: data.name,
      slug,
      type: data.type ?? "ASSEMBLY",
      reservedStatus: data.reservedStatus ?? "None",
    },
  });

  await logAudit({
    adminUserId: session.sub,
    action: "CREATE",
    entityType: "Constituency",
    entityId: constituency.id,
    metadata: { name: constituency.name, stateId: state.id, districtId: data.districtId, number: constituency.number },
  });

  return NextResponse.json(constituency, { status: 201 });
}
