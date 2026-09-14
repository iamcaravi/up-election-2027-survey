import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { SITE_BRANDING_KEY, getSiteBranding, siteBrandingSchema, socialLinksInputSchema, normalizeSocialLinksInput } from "@/lib/site-branding";
import { SOCIAL_LINKS_KEY, getSocialLinks } from "@/lib/social-links";

// Branding + social links are site-wide (every page reads them), so this
// stays ADMIN-only — same bar the existing generic settings route
// (/api/admin/settings) already applies to MIN_ANALYTICS_GROUP_SIZE and
// ELECTION_PERIOD_MODE.
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [branding, socialLinks] = await Promise.all([getSiteBranding(), getSocialLinks()]);
  return NextResponse.json({ ...branding, socialLinks });
}

const putSchema = siteBrandingSchema.extend({ socialLinks: socialLinksInputSchema.optional() });

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const { socialLinks, ...branding } = parsed.data;
  const normalizedSocialLinks = normalizeSocialLinksInput(socialLinks ?? {});

  await prisma.$transaction([
    prisma.siteSetting.upsert({
      where: { key: SITE_BRANDING_KEY },
      update: { value: JSON.stringify(branding) },
      create: { key: SITE_BRANDING_KEY, value: JSON.stringify(branding) },
    }),
    prisma.siteSetting.upsert({
      where: { key: SOCIAL_LINKS_KEY },
      update: { value: JSON.stringify(normalizedSocialLinks) },
      create: { key: SOCIAL_LINKS_KEY, value: JSON.stringify(normalizedSocialLinks) },
    }),
  ]);

  await logAudit({
    adminUserId: session.sub,
    action: "UPDATE_SETTING",
    entityType: "SiteBranding",
    metadata: { ...branding, socialLinks: normalizedSocialLinks },
  });

  return NextResponse.json({ ...branding, socialLinks: normalizedSocialLinks });
}
