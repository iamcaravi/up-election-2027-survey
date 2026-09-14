"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { SITE_URL } from "@/lib/seo";

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
// Also emits matching BreadcrumbList JSON-LD from the exact same item list
// (never a hand-maintained duplicate), using the current pathname for the
// last (unlinked, current-page) item's own URL.
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const allItems: BreadcrumbItem[] = [{ label: t.nav.home, href: "/" }, ...items];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allItems.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: `${SITE_URL}${item.href ?? pathname}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
    </>
  );
}
