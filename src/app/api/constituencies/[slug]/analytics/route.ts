import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConstituencyDemographicBreakdown, type DemographicDimension } from "@/lib/analytics";

const VALID_DIMENSIONS: DemographicDimension[] = ["age_group", "gender", "social_category", "religion"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dimension = (req.nextUrl.searchParams.get("dimension") ?? "age_group") as DemographicDimension;
  const target = (req.nextUrl.searchParams.get("target") ?? "candidate_choice") as
    | "candidate_choice"
    | "party_preference";

  if (!VALID_DIMENSIONS.includes(dimension)) {
    return NextResponse.json({ error: "Invalid dimension" }, { status: 400 });
  }

  const constituency = await prisma.constituency.findUnique({ where: { slug }, select: { id: true } });
  if (!constituency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const breakdown = await getConstituencyDemographicBreakdown(constituency.id, dimension, target);
  if (!breakdown) return NextResponse.json({ error: "No active survey" }, { status: 404 });

  return NextResponse.json(breakdown);
}
