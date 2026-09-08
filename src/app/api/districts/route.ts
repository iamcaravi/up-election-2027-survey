import { NextResponse } from "next/server";
import { getDistricts } from "@/lib/data";

export async function GET() {
  const districts = await getDistricts();
  return NextResponse.json(
    districts.map((d) => ({ id: d.id, name: d.name, slug: d.slug, constituencyCount: d._count.constituencies }))
  );
}
