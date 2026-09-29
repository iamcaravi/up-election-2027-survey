import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import { getScopedAnalysis, resolveScope } from "@/lib/scoped-survey";
import { readAnalysisParams } from "@/lib/analysis-params";
import { ScopedAnalysisView } from "@/components/analysis/scoped/ScopedAnalysisView";
import { PrintOnLoad } from "@/components/analysis/scoped/AnalysisControls";

// Printable version of the canonical Analysis (same scope, same data, same
// components — every panel expanded, controls hidden). Opens the browser's
// print dialog so the user can save it as a PDF; the browser handles Hindi
// (Devanagari) shaping correctly, which a hand-built PDF could not.

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AnalysisReportPage({ searchParams }: { searchParams: SearchParams }) {
  const locale = await getServerLocale();
  const { scope: requested, filters } = readAnalysisParams(await searchParams);
  const scope = await resolveScope(requested, locale);
  const data = await getScopedAnalysis(scope, locale, filters);
  const hi = locale === "hi";

  return (
    <div className="bg-white">
      {/* Print: hide the site chrome and keep cards whole across pages. */}
      <style>{`
        @media print {
          [data-section="header"], [data-section="footer"], nav[aria-label="Mobile Bottom Navigation"] { display: none !important; }
          @page { margin: 12mm; }
          section { break-inside: avoid; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <PrintOnLoad hi={hi} />
        <p className="text-xs text-slate-500">
          votersurvey.in — {hi ? "रिपोर्ट तैयार की गई" : "Report generated"}:{" "}
          {new Date().toLocaleString(hi ? "hi-IN" : "en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>
      <ScopedAnalysisView scope={scope} data={data} hi={hi} printMode />
    </div>
  );
}
