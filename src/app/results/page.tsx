import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import { getScopedResults, resolveScope, sameScope, scopeQuery, type ScopeParams } from "@/lib/scoped-survey";
import { ScopedResultsView } from "@/components/results/ScopedResultsView";
import { buildPageMetadata } from "@/lib/seo";
import { applySeoOverride } from "@/lib/seo-overrides";

// THE canonical Result page. Scope lives in the query string
// (?state=&district=&constituency=) so refresh, sharing and browser
// Back/Forward always reproduce exactly what was on screen. Legacy result
// URLs (/results/[state], …/constituencies/[c]/results) redirect here.

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readScope(sp: Record<string, string | string[] | undefined>): ScopeParams {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
  return { state: one(sp.state), district: one(sp.district), constituency: one(sp.constituency) };
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const locale = await getServerLocale();
  const hi = locale === "hi";
  const scope = await resolveScope(readScope(await searchParams), locale);
  const place = scope.constituency?.name ?? scope.district?.name ?? scope.state?.name;
  const year = scope.election?.year ?? 2027;
  const title = place
    ? hi
      ? `${place} विधानसभा सर्वेक्षण ${year} — परिणाम`
      : `${place} Assembly Survey ${year} — Results`
    : hi
      ? "सर्वेक्षण परिणाम"
      : "Survey Results";
  const path = `/results${scopeQuery(scope.params)}`;
  const base = buildPageMetadata({
    title,
    description: place
      ? hi
        ? `${place} के सार्वजनिक सर्वेक्षण परिणाम — पार्टी समर्थन, विधायक के कार्यों पर राय और मुख्य मुद्दे।`
        : `Public survey results for ${place} — party support, MLA opinion and main issues.`
      : hi
        ? "राज्य, जिला या विधानसभा क्षेत्र चुनकर सार्वजनिक सर्वेक्षण परिणाम देखें।"
        : "Choose a state, district or constituency to see public survey results.",
    path,
  });
  return applySeoOverride(base, path);
}

export const dynamic = "force-dynamic";

export default async function ResultsPage({ searchParams }: { searchParams: SearchParams }) {
  const locale = await getServerLocale();
  const requested = readScope(await searchParams);
  const scope = await resolveScope(requested, locale);
  if (!sameScope(requested, scope.params)) redirect(`/results${scopeQuery(scope.params)}`);

  const data = scope.level === "none" ? null : await getScopedResults(scope, locale);
  return <ScopedResultsView scope={scope} data={data} hi={locale === "hi"} />;
}
