import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { statePath, electionPath, districtPath, constituencyPath, stateResultsPath, analysisPath, resultsLandingPath, analysisLandingPath } from "@/lib/routes";
import { SITE_URL } from "@/lib/seo";

const siteUrl = SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const states = await prisma.state.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      elections: {
        where: { isActive: true },
        select: {
          slug: true,
          electionConstituencies: {
            where: { isActive: true },
            select: { constituency: { select: { slug: true, district: { select: { slug: true } } } } },
          },
        },
      },
      districts: { select: { slug: true } },
    },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/states`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}${resultsLandingPath()}`, changeFrequency: "daily", priority: 0.85 },
    { url: `${siteUrl}${analysisLandingPath()}`, changeFrequency: "daily", priority: 0.85 },
    { url: `${siteUrl}/find-constituency`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/methodology`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/disclaimer`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const dynamicRoutes: MetadataRoute.Sitemap = [];

  for (const state of states) {
    dynamicRoutes.push({ url: `${siteUrl}${statePath(state.slug)}`, changeFrequency: "daily", priority: 0.8 });
    dynamicRoutes.push({ url: `${siteUrl}${stateResultsPath(state.slug)}`, changeFrequency: "daily", priority: 0.85 });

    for (const election of state.elections) {
      dynamicRoutes.push({
        url: `${siteUrl}${electionPath(state.slug, election.slug)}`,
        changeFrequency: "daily",
        priority: 0.75,
      });

      dynamicRoutes.push({
        url: `${siteUrl}${analysisPath(state.slug, election.slug)}`,
        changeFrequency: "daily",
        priority: 0.8,
      });

      dynamicRoutes.push({
        url: `${siteUrl}${electionPath(state.slug, election.slug)}/constituencies`,
        changeFrequency: "daily",
        priority: 0.65,
      });

      for (const districtSlug of new Set(state.districts.map((d) => d.slug))) {
        dynamicRoutes.push({
          url: `${siteUrl}${districtPath(state.slug, election.slug, districtSlug)}`,
          changeFrequency: "daily",
          priority: 0.7,
        });
      }

      for (const ec of election.electionConstituencies) {
        const cPath = `${siteUrl}${constituencyPath(state.slug, election.slug, ec.constituency.slug)}`;
        dynamicRoutes.push({ url: cPath, changeFrequency: "hourly", priority: 0.8 });
        dynamicRoutes.push({ url: `${cPath}/results`, changeFrequency: "hourly", priority: 0.6 });
      }
    }
  }

  return [...staticRoutes, ...dynamicRoutes];
}
