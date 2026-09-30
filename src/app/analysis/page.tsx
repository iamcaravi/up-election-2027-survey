import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import { needsScopeRedirect } from "@/lib/scoped-survey";
import { getAnalysisPageData, resolveAnalysisScope } from "@/lib/analysis-engine";
import { analysisQuery, readAnalysisParams } from "@/lib/analysis-params";
import { ScopedAnalysisView } from "@/components/analysis/scoped/ScopedAnalysisView";
import { buildPageMetadata } from "@/lib/seo";
import { applySeoOverride } from "@/lib/seo-overrides";

// THE canonical Analysis page (State / District / Assembly + filters), all in
// the query string. A bare /analysis opens Uttar Pradesh; `?state=all` is the
// explicit combined all-states view. Legacy analysis URLs redirect here.

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const locale = await getServerLocale();
  const hi = locale === "hi";
  const { scope: requested } = readAnalysisParams(await searchParams);
  const scope = await resolveAnalysisScope(requested, locale);
  const place = scope.constituency?.name ?? scope.district?.name ?? scope.state?.name;
  const year = scope.election?.year ?? 2027;
  const path = `/analysis${analysisQuery(scope.params)}`;
  const base = buildPageMetadata({
    title: place
      ? hi
        ? `${place} विधानसभा सर्वेक्षण ${year} — विस्तृत विश्लेषण`
        : `${place} Assembly Survey ${year} — Detailed Analysis`
      : hi
        ? "समग्र सर्वेक्षण विश्लेषण — सभी राज्य"
        : "Overall Survey Analysis — All states",
    description: place
      ? hi
        ? `${place} के सर्वेक्षण परिणामों का विस्तृत विश्लेषण — जनसांख्यिकी, क्रॉस विश्लेषण, रुझान और तुलना।`
        : `Detailed analysis of ${place}'s survey results — demographics, cross-analysis, trends and comparisons.`
      : hi
        ? "सभी उपलब्ध राज्यों की सर्वेक्षण प्रतिक्रियाओं का समग्र विश्लेषण।"
        : "Combined analysis of survey responses from all available states.",
    path,
  });
  return applySeoOverride(base, path);
}

export const dynamic = "force-dynamic";

export default async function AnalysisPage({ searchParams }: { searchParams: SearchParams }) {
  const locale = await getServerLocale();
  const { scope: requested, filters } = readAnalysisParams(await searchParams);
  const scope = await resolveAnalysisScope(requested, locale);
  if (needsScopeRedirect(requested, scope.params)) redirect(`/analysis${analysisQuery(scope.params, filters)}`);

  const page = await getAnalysisPageData(scope, locale, filters);
  return <ScopedAnalysisView scope={scope} data={page?.analysis ?? null} extras={page?.extras ?? null} hi={locale === "hi"} />;
}
