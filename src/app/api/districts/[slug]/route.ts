import { NextRequest, NextResponse } from "next/server";
import { getDistrictBySlug } from "@/lib/data";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const district = await getDistrictBySlug(slug);
  if (!district) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: district.id,
    name: district.name,
    slug: district.slug,
    constituencies: district.constituencies.map((c) => ({
      id: c.id,
      slug: c.slug,
      number: c.number,
      name: c.name,
      reservedStatus: c.reservedStatus,
      responseCount: c._count.surveyResponses,
      candidateCount: c._count.candidates,
    })),
  });
}
