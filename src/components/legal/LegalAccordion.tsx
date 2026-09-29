"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export interface LegalSection {
  title: string;
  body: string;
  linkBefore?: string;
  linkLabel?: string;
  linkAfter?: string;
}

interface LegalAccordionProps {
  sections: LegalSection[];
  expandAllLabel: string;
  contactLabel: string;
}

// Numbered accordion rows shared by the Terms and Privacy pages — native
// <details>/<summary> for free keyboard/screen-reader support, with an
// "expand all" control since these pages show every clause on one page
// (there's nowhere else for "View all" to navigate to).
export function LegalAccordion({ sections, expandAllLabel }: LegalAccordionProps) {
  const listRef = useRef<HTMLDivElement>(null);

  function expandAll() {
    const details = listRef.current?.querySelectorAll("details");
    details?.forEach((d) => {
      d.open = true;
    });
  }

  return (
    <div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={expandAll}
          className="text-sm font-semibold text-accent hover:underline"
        >
          {expandAllLabel} →
        </button>
      </div>

      <div ref={listRef} className="mt-2 space-y-2">
        {sections.map((section, i) => (
          <details key={section.title} className="group rounded-xl border border-border bg-surface px-4 py-3 open:shadow-[var(--shadow-card)]">
            <summary className="flex cursor-pointer list-none items-center gap-3 font-display text-sm font-bold text-foreground marker:content-none">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[11px] font-bold text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1">{section.title}</span>
              <ChevronDown size={16} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2.5 pl-9 text-sm leading-relaxed text-foreground/90">
              {section.body}
              {section.linkLabel && (
                <>
                  {" "}
                  {section.linkBefore}
                  <Link href="/contact" className="font-semibold text-accent hover:underline">
                    {section.linkLabel}
                  </Link>
                  {section.linkAfter}
                </>
              )}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
