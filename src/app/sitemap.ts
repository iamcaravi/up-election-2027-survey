import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import {
  statePath,
  electionPath,
  districtsPath,
  districtPath,
  constituencyPath,
  stateResultsPath,
  analysisPath,
  resultsLandingPath,
  analysisLandingPath,
} from "@/lib/routes";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 86400; // Cache and revalidate once every 24 hours

const siteUrl = SITE_URL.replace(/\/+$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Baseline static routes that must always be indexed, even if the database is temporarily unreachable
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${siteUrl}/states`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}${resultsLandingPath()}`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${siteUrl}${analysisLandingPath()}`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${siteUrl}/find-constituency`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/methodology`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/disclaimer`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const states = await prisma.state.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        updatedAt: true,
        elections: {
          where: { isActive: true },
          select: {
            slug: true,
            updatedAt: true,
            electionConstituencies: {
              where: { isActive: true },
              select: {
                constituency: {
                  select: {
                    slug: true,
                    updatedAt: true,
                    district: { select: { slug: true } },
                  },
                },
              },
            },
          },
        },
        districts: { select: { slug: true } },
      },
    });

    const dynamicRoutes: MetadataRoute.Sitemap = [];
    const seenUrls = new Set<string>(staticRoutes.map((r) => r.url));

    const addRoute = (entry: MetadataRoute.Sitemap[number]) => {
      if (!seenUrls.has(entry.url)) {
        seenUrls.add(entry.url);
        dynamicRoutes.push(entry);
      }
    };

    for (const state of states) {
      const stateDate = state.updatedAt ?? now;

      addRoute({
        url: `${siteUrl}${statePath(state.slug)}`,
        lastModified: stateDate,
        changeFrequency: "daily",
        priority: 0.8,
      });

      addRoute({
        url: `${siteUrl}${stateResultsPath(state.slug)}`,
        lastModified: stateDate,
        changeFrequency: "daily",
        priority: 0.85,
      });

      for (const election of state.elections) {
        const electionDate = election.updatedAt ?? stateDate;

        addRoute({
          url: `${siteUrl}${electionPath(state.slug, election.slug)}`,
          lastModified: electionDate,
          changeFrequency: "daily",
          priority: 0.75,
        });

        addRoute({
          url: `${siteUrl}${analysisPath(state.slug, election.slug)}`,
          lastModified: electionDate,
          changeFrequency: "daily",
          priority: 0.8,
        });

        addRoute({
          url: `${siteUrl}${districtsPath(state.slug, election.slug)}`,
          lastModified: electionDate,
          changeFrequency: "daily",
          priority: 0.65,
        });

        addRoute({
          url: `${siteUrl}${electionPath(state.slug, election.slug)}/constituencies`,
          lastModified: electionDate,
          changeFrequency: "daily",
          priority: 0.65,
        });

        for (const districtSlug of new Set(state.districts.map((d) => d.slug))) {
          addRoute({
            url: `${siteUrl}${districtPath(state.slug, election.slug, districtSlug)}`,
            lastModified: electionDate,
            changeFrequency: "daily",
            priority: 0.7,
          });
        }

        for (const ec of election.electionConstituencies) {
          const cDate = ec.constituency.updatedAt ?? electionDate;
          const cPath = `${siteUrl}${constituencyPath(state.slug, election.slug, ec.constituency.slug)}`;

          addRoute({
            url: cPath,
            lastModified: cDate,
            changeFrequency: "hourly",
            priority: 0.8,
          });

          addRoute({
            url: `${cPath}/results`,
            lastModified: cDate,
            changeFrequency: "hourly",
            priority: 0.6,
          });
        }
      }
    }

    return [...staticRoutes, ...dynamicRoutes];
  } catch (error) {
    console.error("[sitemap] Failed to fetch dynamic routes from database, serving static fallback:", error);
    return staticRoutes;
  }
}
