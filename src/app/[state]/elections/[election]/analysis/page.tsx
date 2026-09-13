import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BarChart3, MapPin, Newspaper, Users } from "lucide-react";
import { getStateAndElection } from "@/lib/data";
import { getPublicStatewideResults } from "@/lib/public-statewide-results";
import { getUpConstituencyExplorer } from "@/lib/up-analytics";
import { Container } from "@/components/ui/Container";
import { AnalysisHero } from "@/components/analysis/AnalysisHero";
import { ConstituencyExplorer } from "@/components/analysis/ConstituencyExplorer";
import { DistrictRanking } from "@/components/analysis/DistrictRanking";
import { SurveyTrustStrip } from "@/components/survey/SurveyTrustStrip";
import {
  SummaryCard,
  PartySupportChart,
  IssuesDonutChart,
  PrivacyPill,
  InlineState,
  DistributionCard,
  SyntheticDataBanner,
} from "@/components/results/ResultsDashboardParts";
import { statePath, electionPath } from "@/lib/routes";
import { displayStateName } from "@/lib/utils";
import type { PublicDistribution } from "@/lib/public-analytics-core";

export const metadata: Metadata = {
  title: "चुनाव विश्लेषण",
  description: "जनमत सर्वेक्षण का विस्तृत विश्लेषण — पार्टी समर्थन, मुख्य मुद्दे और मतदाता प्रोफ़ाइल।",
};

export const dynamic = "force-dynamic";

const INSUFFICIENT_DATA_LABEL = "पर्याप्त डेटा उपलब्ध नहीं है";

function topBucketHindiLabel(distribution: PublicDistribution): string {
  if (distribution.state !== "available") return INSUFFICIENT_DATA_LABEL;
  const available = distribution.buckets.filter((b) => b.state === "available");
  if (available.length === 0) return INSUFFICIENT_DATA_LABEL;
  const top = available.reduce((a, b) => (b.percentage > a.percentage ? b : a));
  return top.nameHindi ?? top.label;
}

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ state: string; election: string }>;
}) {
  const { state: stateSlug, election: electionSlug } = await params;
  const result = await getStateAndElection(stateSlug, electionSlug);
  if (!result?.election) notFound();
  const { state, election } = result;

  const [statewide, explorer] = await Promise.all([
    getPublicStatewideResults(election.id),
    getUpConstituencyExplorer(election.id, state.id),
  ]);
  if (!statewide) notFound();

  const districtNames = Array.from(new Set(explorer.constituencies.map((c) => c.districtName))).sort((a, b) =>
    a.localeCompare(b, "hi")
  );

  const hasResults = statewide.sample.validResponseCount > 0;
  const numberFormatter = new Intl.NumberFormat("hi-IN");
  const stateNameHi = displayStateName(state.name, state.slug, "hi");

  return (
    <div>
      <AnalysisHero
        stateName={stateNameHi}
        constituencyCount={explorer.constituencies.length}
        electionYear={election.year}
        exploreHref="#constituencies"
        surveyHref={statePath(state.slug)}
      />

      <Container className="py-8 sm:py-10">
        {statewide.isSynthetic && <SyntheticDataBanner />}

        {/* STATE SUMMARY */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            icon={<Users size={17} />}
            iconClass="bg-blue-100 text-blue-700"
            label="कुल प्रतिक्रियाएं"
            value={numberFormatter.format(statewide.sample.validResponseCount)}
          />
          <SummaryCard
            icon={<MapPin size={17} />}
            iconClass="bg-positive/10 text-positive"
            label="कवर किए गए विधानसभा क्षेत्र"
            value={`${numberFormatter.format(statewide.respondingConstituencyCount)} / ${numberFormatter.format(statewide.totalConstituencies)}`}
          />
          <SummaryCard
            icon={<BarChart3 size={17} />}
            iconClass="bg-orange-100 text-orange-700"
            label="अग्रणी पार्टी"
            value={hasResults ? topBucketHindiLabel(statewide.partyPreference) : INSUFFICIENT_DATA_LABEL}
          />
          <SummaryCard
            icon={<Newspaper size={17} />}
            iconClass="bg-blue-100 text-blue-700"
            label="मुख्य मुद्दा"
            value={hasResults ? topBucketHindiLabel(statewide.demographics.top_issue) : INSUFFICIENT_DATA_LABEL}
          />
        </div>

        {/* MAIN ANALYTICS */}
        {hasResults && (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <section className="card-surface rounded-2xl p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="font-display text-xl font-bold">पार्टी समर्थन</h2>
                <PrivacyPill />
              </div>
              <div className="mt-5 overflow-x-auto pb-1">
                {statewide.partyPreference.state === "available" ? (
                  <PartySupportChart buckets={statewide.partyPreference.buckets} locale="hi" />
                ) : (
                  <InlineState>{INSUFFICIENT_DATA_LABEL}</InlineState>
                )}
              </div>
            </section>

            <section className="card-surface rounded-2xl p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="font-display text-xl font-bold">{stateNameHi} के मुख्य मुद्दे</h2>
                <PrivacyPill />
              </div>
              <div className="mt-5">
                <IssuesDonutChart distribution={statewide.demographics.top_issue} centerLabel="मुख्य मुद्दे" />
              </div>
            </section>
          </div>
        )}

        {hasResults && (
          <div className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-xl font-bold">मतदाता प्रोफ़ाइल</h2>
              <PrivacyPill />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <DistributionCard title="आयु वर्ग" distribution={statewide.demographics.age_group} />
              <DistributionCard title="लिंग" distribution={statewide.demographics.gender} />
              <DistributionCard title="धर्म" distribution={statewide.demographics.religion} />
            </div>
          </div>
        )}

        {!hasResults && (
          <div className="mt-8">
            <InlineState>{INSUFFICIENT_DATA_LABEL}</InlineState>
          </div>
        )}

        {/* DISTRICT-WISE SURVEY */}
        <div className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">जिलेवार सर्वेक्षण</h2>
          <p className="mt-1 text-xs text-muted">प्रतिक्रियाओं की संख्या के अनुसार शीर्ष जिले</p>
          <div className="mt-5">
            <DistrictRanking districts={explorer.districts} locale="hi" />
          </div>
        </div>

        {/* CONSTITUENCY EXPLORER */}
        <div id="constituencies" className="mt-8 scroll-mt-20 card-surface rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold">{stateNameHi} में विधानसभा क्षेत्र</h2>
          <p className="mt-1 text-xs text-muted">
            {numberFormatter.format(explorer.constituencies.length)} विधानसभा क्षेत्र — अपना क्षेत्र खोजें और उसका विश्लेषण देखें
          </p>
          <div className="mt-5">
            <ConstituencyExplorer
              constituencies={explorer.constituencies}
              districtNames={districtNames}
              resultsBasePath={`${electionPath(state.slug, election.slug)}/constituencies/`}
            />
          </div>
        </div>

        {/* DISCLAIMER */}
        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3.5 text-sm text-foreground">
          <p className="font-bold text-ink">यह एक जनमत सर्वेक्षण है, आधिकारिक चुनाव परिणाम नहीं।</p>
          <p className="mt-0.5 text-xs leading-5 text-muted">दिखाया गया डेटा उपलब्ध सर्वेक्षण प्रतिक्रियाओं पर आधारित है।</p>
        </div>
      </Container>

      <Container>
        <SurveyTrustStrip />
      </Container>
    </div>
  );
}
