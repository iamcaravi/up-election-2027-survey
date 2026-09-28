"use client";

import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, MapPin, Landmark, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Scope navigation shared by the canonical Result and Analysis pages.
//
// The URL is the single source of truth: every selector/filter change is a
// router.push to a new query string, the server re-renders the page for that
// scope, and Back/Forward/Refresh/shared links all reproduce it exactly.
// Transitions are tracked with useTransition, so while a new scope is loading
// the current content is visibly marked as stale (dimmed + "loading" badge)
// and React discards any superseded navigation — the latest selection wins.

interface ScopeNavContextValue {
  pending: boolean;
  navigate: (href: string) => void;
}

const ScopeNavContext = createContext<ScopeNavContextValue>({ pending: false, navigate: () => {} });

export function ScopeNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = (href: string) => startTransition(() => router.push(href, { scroll: false }));
  return <ScopeNavContext.Provider value={{ pending, navigate }}>{children}</ScopeNavContext.Provider>;
}

export function useScopeNav() {
  return useContext(ScopeNavContext);
}

/** Wraps scope-dependent content: dims it and announces loading while a new scope is fetched. */
export function ScopeContent({ children, hi }: { children: ReactNode; hi: boolean }) {
  const { pending } = useScopeNav();
  return (
    <div className="relative" aria-busy={pending}>
      {pending && (
        <div className="pointer-events-none sticky top-20 z-20 flex justify-center" role="status">
          <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-1.5 text-sm font-semibold text-blue-700 shadow-md">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            {hi ? "नया डेटा लोड हो रहा है…" : "Loading new data…"}
          </span>
        </div>
      )}
      <div className={cn("transition-opacity duration-200", pending && "pointer-events-none select-none opacity-40")}>{children}</div>
    </div>
  );
}

export interface ScopeSelectOption {
  slug: string;
  label: string;
  number?: number;
}

interface ScopeSelectorsProps {
  hi: boolean;
  basePath: "/results" | "/analysis";
  value: { state?: string; district?: string; constituency?: string };
  options: { states: ScopeSelectOption[]; districts: ScopeSelectOption[]; constituencies: ScopeSelectOption[] };
  /** Extra query params to carry across scope changes (e.g. analysis filters). */
  keep?: Record<string, string | undefined>;
  className?: string;
  selectClassName?: string;
}

function buildHref(basePath: string, scope: ScopeSelectorsProps["value"], keep?: ScopeSelectorsProps["keep"]) {
  const q = new URLSearchParams();
  if (scope.state) q.set("state", scope.state);
  if (scope.district) q.set("district", scope.district);
  if (scope.constituency) q.set("constituency", scope.constituency);
  for (const [k, v] of Object.entries(keep ?? {})) if (v && v !== "all") q.set(k, v);
  const s = q.toString();
  return s ? `${basePath}?${s}` : basePath;
}

export function ScopeSelectors({ hi, basePath, value, options, keep, className, selectClassName }: ScopeSelectorsProps) {
  const { navigate } = useScopeNav();
  // Optimistic local mirror so the chosen value shows immediately; it is
  // re-seeded from the URL-derived props whenever the scope changes (the
  // parent keys this component by scope), so Back/Forward never desync.
  const [local, setLocal] = useState(value);

  const change = (next: ScopeSelectorsProps["value"]) => {
    setLocal(next);
    navigate(buildHref(basePath, next, keep));
  };

  const base = cn(
    "h-11 w-full cursor-pointer appearance-none rounded-xl border border-[#dde5f0] bg-white pl-10 pr-9 text-sm font-semibold text-[#0b1f3a] shadow-[0_1px_2px_rgba(15,31,75,0.05)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
    selectClassName
  );

  return (
    <div className={cn("grid grid-cols-1 gap-2.5 sm:grid-cols-3", className)}>
      <Field icon={<MapPin size={16} />} label={hi ? "राज्य चुनें" : "Select state"}>
        <select
          aria-label={hi ? "राज्य चुनें" : "Select state"}
          className={base}
          value={local.state ?? ""}
          onChange={(e) => change({ state: e.target.value || undefined })}
        >
          <option value="">{hi ? "राज्य चुनें" : "Select state"}</option>
          {options.states.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      <Field icon={<Landmark size={16} />} label={hi ? "जिला चुनें" : "Select district"}>
        <select
          aria-label={hi ? "जिला चुनें" : "Select district"}
          className={base}
          value={local.district ?? ""}
          disabled={!local.state || options.districts.length === 0}
          onChange={(e) => change({ state: local.state, district: e.target.value || undefined })}
        >
          <option value="">{local.state ? (hi ? "सभी जिले" : "All districts") : hi ? "जिला चुनें" : "Select district"}</option>
          {options.districts.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      <Field icon={<Building2 size={16} />} label={hi ? "विधानसभा क्षेत्र चुनें" : "Select constituency"}>
        <select
          aria-label={hi ? "विधानसभा क्षेत्र चुनें" : "Select constituency"}
          className={base}
          value={local.constituency ?? ""}
          disabled={!local.district || options.constituencies.length === 0}
          onChange={(e) => change({ state: local.state, district: local.district, constituency: e.target.value || undefined })}
        >
          <option value="">
            {local.district ? (hi ? "सभी विधानसभा क्षेत्र" : "All constituencies") : hi ? "विधानसभा क्षेत्र चुनें" : "Select constituency"}
          </option>
          {options.constituencies.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.label}
              {o.number ? ` (${o.number})` : ""}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function Field({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{label}</span>
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600" aria-hidden="true">
        {icon}
      </span>
      {children}
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
    </label>
  );
}

/** A select that updates one query param (used for analysis filters). */
export function QueryParamSelect({
  ariaLabel,
  icon,
  href,
  value,
  options,
}: {
  ariaLabel: string;
  icon: ReactNode;
  href: (value: string) => string;
  value: string;
  options: { value: string; label: string }[];
}) {
  const { navigate } = useScopeNav();
  const [local, setLocal] = useState(value);
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{ariaLabel}</span>
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600" aria-hidden="true">
        {icon}
      </span>
      <select
        aria-label={ariaLabel}
        value={local}
        onChange={(e) => {
          setLocal(e.target.value);
          navigate(href(e.target.value));
        }}
        className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-[#dde5f0] bg-white pl-10 pr-9 text-sm font-semibold text-[#0b1f3a] shadow-[0_1px_2px_rgba(15,31,75,0.05)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
    </label>
  );
}
