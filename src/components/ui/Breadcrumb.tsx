"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export interface BreadcrumbItem {
  /** Omit for the leading "Home" segment, which this component supplies itself. */
  label: string;
  /** Omitted on the last item — that one renders as the current page, not a link. */
  href?: string;
}

// Shared breadcrumb trail for the State → Election → District → Constituency
// hierarchy pages. SurveyHero has its own inline breadcrumb (tuned for that
// hero's specific layout/background) — this is the equivalent for every
// other page in the hierarchy, which previously had no breadcrumb at all.
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const { t } = useLocale();
  const allItems: BreadcrumbItem[] = [{ label: t.nav.home, href: "/" }, ...items];

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-3 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-xs font-medium text-muted sm:text-sm"
    >
      {allItems.map((item, i) => {
        const isLast = i === allItems.length - 1;
        return (
          <span key={i} className="flex shrink-0 items-center gap-1.5">
            {i > 0 && <ChevronRight size={13} className="shrink-0" aria-hidden="true" />}
            {isLast || !item.href ? (
              <span className="font-semibold text-foreground" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="hover:text-ink">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
