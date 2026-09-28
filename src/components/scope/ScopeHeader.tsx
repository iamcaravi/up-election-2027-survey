import type { ReactNode } from "react";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { constituencyPath, districtPath, statePath } from "@/lib/routes";
import type { ResolvedScope } from "@/lib/scoped-survey";

// Breadcrumb + hero text shared by the canonical Result and Analysis pages so
// both always describe the scope (State → District → Assembly) identically.

export function scopeBreadcrumb(scope: ResolvedScope, hi: boolean, leaf: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  if (scope.state) {
    items.push({ label: hi ? "राज्य" : "States", href: "/rajya" });
    items.push({ label: scope.state.name, href: statePath(scope.state.slug) });
  }
  if (scope.state && scope.district && scope.election) {
    items.push({ label: hi ? "जिले" : "Districts", href: `${statePath(scope.state.slug)}#district-explorer` });
    items.push({ label: scope.district.name, href: districtPath(scope.state.slug, scope.election.slug, scope.district.slug) });
  }
  if (scope.state && scope.constituency && scope.election) {
    items.push({ label: scope.constituency.name, href: constituencyPath(scope.state.slug, scope.election.slug, scope.constituency.slug) });
  }
  items.push({ label: leaf });
  return items;
}

export function scopeTitle(scope: ResolvedScope, hi: boolean, fallback: string) {
  return scope.constituency?.name ?? scope.district?.name ?? scope.state?.name ?? fallback;
}

export function scopeEyebrow(scope: ResolvedScope, hi: boolean) {
  if (scope.constituency && scope.district && scope.state)
    return `${scope.state.name} · ${scope.district.name} · ${hi ? "विधानसभा क्षेत्र" : "Assembly Constituency"} #${scope.constituency.number}`;
  if (scope.district && scope.state) return `${scope.state.name} · ${hi ? "जिला" : "District"}`;
  if (scope.state) return `${scope.state.name} · ${hi ? "राज्य" : "State"}`;
  return hi ? "भारत" : "India";
}

export function ScopeHero({
  scope,
  hi,
  leaf,
  titleFallback,
  subtitle,
  description,
  aside,
  below,
}: {
  scope: ResolvedScope;
  hi: boolean;
  leaf: string;
  titleFallback: string;
  subtitle: string;
  description: string;
  aside?: ReactNode;
  below?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-[#eef5fc] via-[#f5f9fe] to-[#f4f7fb]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-purple-200/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-10 h-80 w-80 rounded-full bg-blue-200/25 blur-3xl" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-1/4 top-4 hidden h-28 w-40 opacity-25 sm:block"
        style={{ backgroundImage: "radial-gradient(#93c5fd 1.2px, transparent 1.2px)", backgroundSize: "14px 14px" }}
      />
      <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-4 sm:px-6 sm:pb-7 lg:px-8">
        <Breadcrumb items={scopeBreadcrumb(scope, hi, leaf)} />
        <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="text-[13px] font-bold tracking-wide text-[#ea580c] sm:text-sm">{scopeEyebrow(scope, hi)}</p>
            <h1 className="mt-1 font-display text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-[54px]">
              {scopeTitle(scope, hi, titleFallback)}
            </h1>
            <p className="mt-1 text-base font-bold text-[#2563eb] sm:text-lg">{subtitle}</p>
            <p className="mt-2 max-w-xl text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">{description}</p>
          </div>
          {aside}
        </div>
        {below && <div className="mt-5">{below}</div>}
      </div>
    </div>
  );
}
