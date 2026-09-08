import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDistrictBySlug } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { ConstituencyGrid } from "@/components/district/ConstituencyGrid";
import { formatNumber } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ district: string }>;
}): Promise<Metadata> {
  const { district: slug } = await params;
  const district = await getDistrictBySlug(slug);
  if (!district) return {};
  return {
    title: `${district.name} — Assembly Constituencies`,
    description: `${district.name} district: ${district.constituencies.length} assembly constituencies, candidates and 2027 public survey results.`,
  };
}

export const revalidate = 30;

export default async function DistrictPage({ params }: { params: Promise<{ district: string }> }) {
  const { district: slug } = await params;
  const district = await getDistrictBySlug(slug);
  if (!district) notFound();

  const totalResponses = district.constituencies.reduce((sum, c) => sum + c._count.surveyResponses, 0);
  const activeSurveys = district.constituencies.length;

  return (
    <div>
      <div className="border-b border-border bg-surface">
        <Container className="py-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Uttar Pradesh · District</p>
          <h1 className="font-display text-3xl font-extrabold sm:text-5xl">{district.name}</h1>
          <div className="mt-6 flex flex-wrap gap-6">
            <Stat label="Constituencies" value={district.constituencies.length} />
            <Stat label="Total Responses" value={totalResponses} />
            <Stat label="Active Surveys" value={activeSurveys} />
          </div>
        </Container>
      </div>

      <Container className="py-12">
        <ConstituencyGrid
          districtSlug={district.slug}
          constituencies={district.constituencies.map((c) => ({
            id: c.id,
            slug: c.slug,
            number: c.number,
            name: c.name,
            reservedStatus: c.reservedStatus,
            currentMlaName: c.currentMlaName,
            currentMlaParty: c.currentMlaParty,
            responseCount: c._count.surveyResponses,
            candidateCount: c._count.candidates,
          }))}
        />
      </Container>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-2xl font-extrabold">{formatNumber(value)}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
