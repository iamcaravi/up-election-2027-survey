import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import { getAnalysisPageData, resolveAnalysisScope, staticModules } from "@/lib/analysis-engine";
import { readAnalysisParams, readReportModules } from "@/lib/analysis-params";
import { AnalysisReportView } from "@/components/analysis/scoped/AnalysisReportView";
import { PrintOnLoad } from "@/components/analysis/scoped/AnalysisControls";

// Printable custom report of the canonical Analysis (same scope, filters and
// data; `?modules=` picks the sections). Opens the browser's print dialog so
// the user can save it as a PDF; the browser handles Hindi (Devanagari)
// shaping correctly, which a hand-built PDF could not.

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AnalysisReportPage({ searchParams }: { searchParams: SearchParams }) {
  const locale = await getServerLocale();
  const sp = await searchParams;
  const { scope: requested, filters } = readAnalysisParams(sp);
  const modules = readReportModules(sp);
  const scope = await resolveAnalysisScope(requested, locale);
  const page = await getAnalysisPageData(scope, locale, filters);
  const hi = locale === "hi";

  return (
    <div className="bg-[#f4f7fc] print:bg-white">
      {/* Print: hide the site chrome and keep cards whole across pages. */}
      <style>{`
        @media print {
          [data-section="header"], [data-section="footer"], nav[aria-label="Mobile Bottom Navigation"] { display: none !important; }
          @page { margin: 12mm; }
          section { break-inside: avoid; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-6">
        <PrintOnLoad hi={hi} />
        <p className="mb-3 text-xs text-slate-500">
          votersurvey.in — {hi ? "रिपोर्ट तैयार की गई" : "Report generated"}:{" "}
          {new Date().toLocaleString(hi ? "hi-IN" : "en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>
      <AnalysisReportView
        scope={scope}
        data={page?.analysis ?? null}
        extras={page?.extras ?? null}
        extra={page ? staticModules(page.ctx, page.analysis) : null}
        modules={modules}
        hi={hi}
      />
    </div>
  );
}
