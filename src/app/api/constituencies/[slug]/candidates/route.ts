import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const constituency = await prisma.constituency.findUnique({ where: { slug }, select: { id: true } });
  if (!constituency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const candidates = await prisma.candidate.findMany({
    where: { constituencyId: constituency.id, isActive: true },
    include: { party: { select: { name: true, shortName: true, colorHex: true, logoUrl: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    candidates.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      status: c.status,
      confidenceScore: c.confidenceScore,
      party: c.party,
      photoUrl: c.photoUrl,
      photoVerified: c.photoVerified,
      currentOffice: c.currentOffice,
      background: c.background,
    }))
  );
}
