import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const results = await prisma.constituency.findMany({
    where: q ? { name: { contains: q } } : undefined,
    include: { district: true, state: true },
    orderBy: { number: "asc" },
    take: 20,
  });
  // District (and now state) name is included so admins can disambiguate
  // same-named constituencies across states — the created candidate is
  // always tied to the exact constituency id selected, never the name.
  return NextResponse.json(
    results.map((c) => ({
      id: c.id,
      name: c.name,
      number: c.number,
      districtName: c.district.name,
      stateName: c.state.name,
    }))
  );
}
