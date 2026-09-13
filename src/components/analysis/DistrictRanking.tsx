import type { DistrictSummaryItem } from "@/lib/up-analytics";

export function DistrictRanking({ districts, locale }: { districts: DistrictSummaryItem[]; locale: "hi" | "en" }) {
  const numberFormatter = new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN");
  const withResponses = districts.filter((d) => d.responseCount > 0);
  const maxResponses = Math.max(1, ...withResponses.map((d) => d.responseCount));

  if (withResponses.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-surface-2 p-6 text-center text-sm text-muted">
        पर्याप्त डेटा उपलब्ध नहीं है
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {withResponses.slice(0, 15).map((d) => (
        <li key={d.districtSlug}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold text-ink">
              {d.districtName} <span className="font-normal text-muted">({d.constituencyCount} क्षेत्र)</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted">
              {numberFormatter.format(d.responseCount)}
              {d.leadingPartyLabel && <span className="ml-2 font-bold text-ink">{d.leadingPartyLabel}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-ink" style={{ width: `${(d.responseCount / maxResponses) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
