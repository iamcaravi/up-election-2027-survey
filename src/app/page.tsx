import type { Metadata } from "next";
import { getDistricts, getHomeStats, getSiteSetting, getStates } from "@/lib/data";
import {
  DEFAULT_HOMEPAGE_SECTIONS_CONFIG,
  buildHomepageSectionsStyleCss,
  normalizeHomepageSectionsConfig,
} from "@/lib/homepage-sections-config";
import { HomeHero } from "@/components/home/HomeHero";
import { AvailableStatesSection } from "@/components/home/AvailableStatesSection";
import { TrustBenefitsSection } from "@/components/home/TrustBenefitsSection";
import { AreaSearchAndPurposeSection } from "@/components/home/AreaSearchAndPurposeSection";
import { LatestAnalysisSection } from "@/components/home/LatestAnalysisSection";
import { buildPageMetadata } from "@/lib/seo";
import { resolveStaticSeoBase } from "@/lib/seo-catalog";
import { applySeoOverride } from "@/lib/seo-overrides";
import { getServerLocale } from "@/lib/i18n/locale-cookie";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const base = resolveStaticSeoBase("home", locale);
  return applySeoOverride(
    buildPageMetadata({ title: base.title, description: base.description, path: base.path }),
    base.path
  );
}

export default async function Home() {
  const stats = await getHomeStats();
  const states = await getStates();
  // The preloaded UP district list is only an optimisation: if it fails, the
  // hero loads the list client-side (and shows an error state if that fails
  // too). Log it so the failure is never silent.
  const upDistrictsData = await getDistricts("uttar-pradesh").catch((error) => {
    console.error("[page] / getDistricts(uttar-pradesh) preload failed:", error);
    return { state: null, districts: [] };
  });
  const sectionsConfigRaw = await getSiteSetting("HOMEPAGE_SECTIONS_CONFIG", DEFAULT_HOMEPAGE_SECTIONS_CONFIG);

  const sections = normalizeHomepageSectionsConfig(sectionsConfigRaw);
  const sectionsStyleCss = buildHomepageSectionsStyleCss(sections);

  const initialDistricts =
    upDistrictsData.districts?.map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      constituencyCount: d._count.constituencies,
    })) ?? [];

  return (
    <div className="min-h-screen bg-[#F0F4F9]">
      {/* Styles for homepage sections */}
      <style dangerouslySetInnerHTML={{ __html: sectionsStyleCss }} />

      {/* 1. Hero Section with Parliament 4K image, 4-selectors bar, and 2x2 dynamic stats card */}
      <div data-section="hero">
        <HomeHero
          surveyStates={states}
          initialDistricts={initialDistricts}
          stats={stats}
        />
      </div>

      {/* 2. Available States Section: 7 active states with lightweight SVG map silhouettes and dynamic counts */}
      <div data-section="states">
        <AvailableStatesSection states={states} />
      </div>

      {/* 3. Benefit / Trust Cards: 4 compact cards */}
      <div data-section="features">
        <TrustBenefitsSection />
      </div>

      {/* 4. Section 8 & 9: Map-based Area Search with India vector map & Survey Purpose */}
      <div data-section="about">
        <AreaSearchAndPurposeSection />
      </div>

      {/* 5. Section 10: Latest Analysis Highlights */}
      <div data-section="analysis">
        <LatestAnalysisSection />
      </div>
    </div>
  );
}
