import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConstituencyResults } from "@/lib/analytics";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const constituency = await prisma.constituency.findUnique({ where: { slug }, select: { id: true } });
  if (!constituency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const results = await getConstituencyResults(constituency.id);
  if (!results) return NextResponse.json({ error: "No active survey" }, { status: 404 });

  return NextResponse.json(results);
}
