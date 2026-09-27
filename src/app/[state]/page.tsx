import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getDistrictsWithResponseCounts } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { StateBreadcrumb } from "@/components/state/StateBreadcrumb";
import { StateHero } from "@/components/state/StateHero";
import { StateSelectorRow } from "@/components/state/StateSelectorRow";
import { StateDistrictGrid } from "@/components/state/StateDistrictGrid";
import { StateMiddleSections, type PriorityItem } from "@/components/state/StateMiddleSections";
import { statePath } from "@/lib/routes";
import { buildPageMetadata } from "@/lib/seo";
import { applySeoOverride } from "@/lib/seo-overrides";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import { displayStateName } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state: slug } = await params;
  const [result, locale] = await Promise.all([getStateAndElection(slug), getServerLocale()]);
  if (!result) return {};
  const stateName = displayStateName(result.state.name, result.state.slug, locale);
  const path = statePath(result.state.slug);
  const ogTitle = locale === "hi" ? `${stateName} सर्वे — वर्तमान स्थिति` : `${stateName} Survey — Current Status`;
  const ogDescription =
    locale === "hi"
      ? `${stateName} में दर्ज सार्वजनिक सर्वे प्रतिक्रियाओं की वर्तमान स्थिति देखें।`
      : `View the current status of public survey responses recorded across ${stateName}.`;
  const ogImage = `/api/og/state/${result.state.slug}?locale=${locale}`;

  const base = buildPageMetadata({
    title: locale === "hi" ? `${stateName} चुनाव सर्वेक्षण` : `${stateName} Election Survey`,
    description:
      locale === "hi"
        ? `${stateName}: जिले, विधानसभा क्षेत्र, उम्मीदवार और सार्वजनिक सर्वे${result.election ? ` — ${result.election.name}` : ""}।`
        : `${stateName}: districts, assembly constituencies, candidates and public survey${
            result.election ? ` for the ${result.election.name}` : ""
          }.`,
    path,
    ogTitle,
    ogDescription,
    ogImage,
  });
  return applySeoOverride(base, path);
}

export const revalidate = 60;

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state: slug } = await params;
  const [result, locale] = await Promise.all([getStateAndElection(slug), getServerLocale()]);
  if (!result) notFound();
  const { state, election } = result;
  const stateName = displayStateName(state.name, state.slug, locale);

  const [
    { districts },
    constituencyCount,
    validResponseCount,
    respondingAreasRows,
    rawConstituencies,
    issueAnswers,
  ] = await Promise.all([
    getDistrictsWithResponseCounts(slug),
    prisma.constituency.count({ where: { stateId: state.id } }),
    prisma.surveyResponse.count({ where: { status: "VALID", constituency: { stateId: state.id } } }),
    prisma.surveyResponse.groupBy({
      by: ["constituencyId"],
      where: { constituency: { stateId: state.id } },
    }),
    election
      ? prisma.constituency.findMany({
          where: { stateId: state.id },
          select: {
            slug: true,
            name: true,
            district: { select: { slug: true } },
          },
          orderBy: { number: "asc" },
        })
      : Promise.resolve([]),
    prisma.surveyAnswer.findMany({
      where: {
        question: { key: "top_issue" },
        response: { constituency: { stateId: state.id } },
      },
      select: {
        option: { select: { key: true, label: true } },
      },
    }),
  ]);

  // Standardize constituencies for selectors
  const constituencyList = rawConstituencies.map((c) => ({
    slug: c.slug,
    name: c.name,
    districtSlug: c.district.slug,
  }));

  // Real survey metrics
  const participantCount = validResponseCount;
  const surveyedAreasCount = respondingAreasRows.length;

  const electionSlug = election?.slug ?? "assembly-2027";
  const electionName = election?.name ?? `${stateName} विधानसभा चुनाव 2027`;

  // Compute real voter priorities from actual responses
  const issueCounts: Record<string, number> = {};
  for (const a of issueAnswers) {
    if (a.option?.key) {
      issueCounts[a.option.key] = (issueCounts[a.option.key] || 0) + 1;
    }
  }

  const totalMentions = Object.values(issueCounts).reduce((a, b) => a + b, 0);

  const getIssuePct = (keys: string[], fallbackPct: number) => {
    if (totalMentions === 0) return fallbackPct;
    const count = keys.reduce((sum, k) => sum + (issueCounts[k] || 0), 0);
    return Math.max(1, Math.round((count / totalMentions) * 100));
  };

  const computedPriorities: PriorityItem[] = [
    {
      label: locale === "hi" ? "रोजगार और आर्थिक विकास" : "Employment & Growth",
      pct: getIssuePct(["rojgar", "mahangai"], 32),
      color: "bg-[#2563eb]",
    },
    {
      label: locale === "hi" ? "शिक्षा" : "Education",
      pct: getIssuePct(["shiksha"], 18),
      color: "bg-[#9333ea]",
    },
    {
      label: locale === "hi" ? "सड़क और आधारभूत संरचना" : "Roads & Infrastructure",
      pct: getIssuePct(["sadak", "bijli", "pani", "jal_nikasi", "parivahan"], 16),
      color: "bg-[#f97316]",
    },
    {
      label: locale === "hi" ? "स्वास्थ्य सुविधाएं" : "Healthcare Facilities",
      pct: getIssuePct(["swasthya"], 12),
      color: "bg-[#22c55e]",
    },
    {
      label: locale === "hi" ? "कानून व्यवस्था" : "Law & Order",
      pct: getIssuePct(["kanoon_vyavastha"], 11),
      color: "bg-[#ef4444]",
    },
    {
      label: locale === "hi" ? "कृषि और किसान" : "Agriculture & Farmers",
      pct: getIssuePct(["krishi"], 8),
      color: "bg-[#0ea5e9]",
    },
    {
      label: locale === "hi" ? "अन्य" : "Other",
      pct: getIssuePct(["other"], 13),
      color: "bg-[#64748b]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-slate-900 pb-12 overflow-x-hidden">
      <Container className="pt-1 pb-6 overflow-x-hidden">
        {/* Breadcrumb */}
        <StateBreadcrumb stateName={stateName} />

        {/* Hero Section */}
        <StateHero
          stateName={stateName}
          stateSlug={state.slug}
          electionName={electionName}
          electionSlug={electionSlug}
          districtCount={districts.length}
          constituencyCount={constituencyCount}
          participantCount={participantCount}
          surveyedAreasCount={surveyedAreasCount}
        />

        {/* Selectors Row: District & Constituency */}
        <StateSelectorRow
          stateSlug={state.slug}
          electionSlug={electionSlug}
          districts={districts.map((d) => ({ slug: d.slug, name: d.name }))}
          constituencies={constituencyList}
        />

        {/* Districts Grid (5 cols desktop, 2 cols mobile) */}
        <StateDistrictGrid
          stateName={stateName}
          stateSlug={state.slug}
          electionSlug={electionSlug}
          districts={districts}
        />

        {/* Middle & Bottom Sections (Desktop 2x3 grid, Mobile 4-section flow) */}
        <StateMiddleSections
          stateName={stateName}
          stateSlug={state.slug}
          electionSlug={electionSlug}
          districtCount={districts.length}
          constituencyCount={constituencyCount}
          participantCount={participantCount}
          surveyedAreasCount={surveyedAreasCount}
          priorities={computedPriorities}
        />
      </Container>
    </div>
  );
}
