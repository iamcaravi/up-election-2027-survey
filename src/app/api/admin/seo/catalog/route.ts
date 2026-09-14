import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { SEO_STATIC_CATALOG, SEO_STATE_SCOPED_CATALOG } from "@/lib/seo-catalog";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    staticPages: SEO_STATIC_CATALOG.map((e) => ({ category: e.category, label: e.label, path: e.path })),
    stateScopedPages: SEO_STATE_SCOPED_CATALOG,
  });
}
