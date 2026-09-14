"use client";

// Shared, state-generic "District → Constituency" cascade: the constituency
// list always derives from whichever district is currently selected, so
// selecting a constituency from another district is structurally impossible
// (not just discouraged by UI). Used by both the Find Constituency flow and
// the Results dashboard, so the two don't drift into separate cascade logic.

export interface DistrictOption {
  slug: string;
  name: string;
}

export interface ConstituencyOption {
  slug: string;
  name: string;
  districtSlug: string;
}

export function DistrictConstituencySelect({
  districts,
  constituencies,
  districtValue,
  constituencyValue,
  onDistrictChange,
  onConstituencyChange,
  districtLabel,
  constituencyLabel,
  districtPlaceholder,
  constituencyPlaceholder,
  constituencyDisabledPlaceholder,
}: {
  districts: DistrictOption[];
  constituencies: ConstituencyOption[];
  districtValue: string;
  constituencyValue: string;
  onDistrictChange: (slug: string) => void;
  onConstituencyChange: (slug: string) => void;
  districtLabel: string;
  constituencyLabel: string;
  districtPlaceholder: string;
  constituencyPlaceholder: string;
  constituencyDisabledPlaceholder: string;
}) {
  const availableConstituencies = districtValue
    ? constituencies.filter((c) => c.districtSlug === districtValue)
    : [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">{districtLabel}</span>
        <select
          value={districtValue}
          onChange={(e) => onDistrictChange(e.target.value)}
          className="h-12 w-full rounded-xl border border-border bg-surface px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
        >
          <option value="">{districtPlaceholder}</option>
          {districts.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">{constituencyLabel}</span>
        <select
          value={constituencyValue}
          disabled={!districtValue}
          onChange={(e) => onConstituencyChange(e.target.value)}
          className="h-12 w-full rounded-xl border border-border bg-surface px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">{districtValue ? constituencyPlaceholder : constituencyDisabledPlaceholder}</option>
          {availableConstituencies.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
