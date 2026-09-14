// Shared district-card color system — used by both the state landing page's
// embedded district explorer (src/components/map/DistrictExplorer.tsx) and
// the full district listing page (src/app/[state]/elections/[election]/
// districts/page.tsx), so a district's card looks the same wherever it's
// shown instead of one surface being colorful and the other plain grey.
// A small, fixed rotation of soft-pastel/strong-accent pairs — deterministic
// per district (by position), not random, so the same district always gets
// the same color and the palette reads as one consistent design system
// rather than an arbitrary rainbow. Every entry uses only Tailwind's
// standard palette (already used elsewhere in this app, e.g. the results
// dashboard's banners) so this introduces no new design language.
export const DISTRICT_COLORS = [
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", icon: "bg-blue-100 text-blue-600", hoverBorder: "hover:border-blue-400" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: "bg-emerald-100 text-emerald-600", hoverBorder: "hover:border-emerald-400" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", icon: "bg-amber-100 text-amber-700", hoverBorder: "hover:border-amber-400" },
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-800", icon: "bg-rose-100 text-rose-600", hoverBorder: "hover:border-rose-400" },
  { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-800", icon: "bg-violet-100 text-violet-600", hoverBorder: "hover:border-violet-400" },
  { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-800", icon: "bg-teal-100 text-teal-600", hoverBorder: "hover:border-teal-400" },
  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-900", icon: "bg-orange-100 text-orange-700", hoverBorder: "hover:border-orange-400" },
  { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-800", icon: "bg-indigo-100 text-indigo-600", hoverBorder: "hover:border-indigo-400" },
] as const;
