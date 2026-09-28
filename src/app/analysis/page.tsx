import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import { getScopedAnalysis, resolveScope, sameScope } from "@/lib/scoped-survey";
import { analysisQuery, readAnalysisParams } from "@/lib/analysis-params";
import { ScopedAnalysisView } from "@/components/analysis/scoped/ScopedAnalysisView";
import { buildPageMetadata } from "@/lib/seo";
import { applySeoOverride } from "@/lib/seo-overrides";

// THE canonical Analysis page (State / District / Assembly + filters), all in
// the query string. Legacy analysis URLs redirect here with scope preserved.

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const locale = await getServerLocale();
  const hi = locale === "hi";
  const { scope: requested } = readAnalysisParams(await searchParams);
  const scope = await resolveScope(requested, locale);
  const place = scope.constituency?.name ?? scope.district?.name ?? scope.state?.name;
  const year = scope.election?.year ?? 2027;
  const path = `/analysis${analysisQuery(scope.params)}`;
  const base = buildPageMetadata({
    title: place
      ? hi
        ? `${place} विधानसभा सर्वेक्षण ${year} — विस्तृत विश्लेषण`
        : `${place} Assembly Survey ${year} — Detailed Analysis`
      : hi
        ? "विस्तृत विश्लेषण"
        : "Detailed Analysis",
    description: place
      ? hi
        ? `${place} के सर्वेक्षण परिणामों का विस्तृत विश्लेषण — जनसांख्यिकी, क्रॉस विश्लेषण, रुझान और तुलना।`
        : `Detailed analysis of ${place}'s survey results — demographics, cross-analysis, trends and comparisons.`
      : hi
        ? "राज्य, जिला या विधानसभा क्षेत्र चुनकर सर्वेक्षण परिणामों का विस्तृत विश्लेषण देखें।"
        : "Choose a state, district or constituency for a detailed analysis of survey results.",
    path,
  });
  return applySeoOverride(base, path);
}

export const dynamic = "force-dynamic";

export default async function AnalysisPage({ searchParams }: { searchParams: SearchParams }) {
  const locale = await getServerLocale();
  const { scope: requested, filters } = readAnalysisParams(await searchParams);
  const scope = await resolveScope(requested, locale);
  if (!sameScope(requested, scope.params)) redirect(`/analysis${analysisQuery(scope.params, filters)}`);

  const data = scope.level === "none" ? null : await getScopedAnalysis(scope, locale, filters);
  return <ScopedAnalysisView scope={scope} data={data} hi={locale === "hi"} />;
}
