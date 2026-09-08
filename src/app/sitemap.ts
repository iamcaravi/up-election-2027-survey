import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://up-election-2027.example";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [districts, constituencies] = await Promise.all([
    prisma.district.findMany({ select: { slug: true } }),
    prisma.constituency.findMany({ select: { slug: true, district: { select: { slug: true } } } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/uttar-pradesh`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/methodology`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/disclaimer`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const districtRoutes: MetadataRoute.Sitemap = districts.map((d) => ({
    url: `${siteUrl}/uttar-pradesh/${d.slug}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const constituencyRoutes: MetadataRoute.Sitemap = constituencies.flatMap((c) => [
    { url: `${siteUrl}/uttar-pradesh/${c.district.slug}/${c.slug}`, changeFrequency: "hourly" as const, priority: 0.8 },
    { url: `${siteUrl}/uttar-pradesh/${c.district.slug}/${c.slug}/results`, changeFrequency: "hourly" as const, priority: 0.6 },
  ]);

  return [...staticRoutes, ...districtRoutes, ...constituencyRoutes];
}
